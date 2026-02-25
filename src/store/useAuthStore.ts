import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import api from '@/lib/api';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    error: string | null;

    login: (credentials: LoginRequest) => Promise<void>;
    loginWithGoogle: (code: string) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    setTokens: (accessToken: string, refreshToken: string) => void;
    clearError: () => void;
    updateUser: (userData: Partial<User>) => void;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: null,
            _hasHydrated: false,

            setHasHydrated: (state) => set({ _hasHydrated: state }),
            setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<AuthResponse>('/auth/login', credentials);
                    if (response.success && response.data) {
                        set({
                            user: response.data.user,
                            accessToken: response.data.access_token,
                            refreshToken: response.data.refresh_token,
                        });
                    }
                } catch (err: any) {
                    set({ error: err.message || 'Login failed' });
                    throw err;
                } finally {
                    set({ isLoading: false });
                }
            },

            loginWithGoogle: async (code: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<AuthResponse>('/auth/google', { code });
                    if (response.success && response.data) {
                        set({
                            user: response.data.user,
                            accessToken: response.data.access_token,
                            refreshToken: response.data.refresh_token,
                        });
                    }
                } catch (err: any) {
                    set({ error: err.message || 'Google login failed' });
                    throw err;
                } finally {
                    set({ isLoading: false });
                }
            },

            register: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<any>('/auth/register', data);
                    if (response.success) {
                        // Auto-login
                        await get().login({ email: data.email, password: data.password });
                    }
                } catch (err: any) {
                    set({ error: err.message || 'Registration failed' });
                    throw err;
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                const { refreshToken } = get();
                if (refreshToken) {
                    try {
                        await api.post('/auth/logout', { refresh_token: refreshToken });
                    } catch (error) {
                        console.error('Logout failed', error);
                        // Ignore error and clear local state
                    }
                }
                set({ user: null, accessToken: null, refreshToken: null });
            },

            clearError: () => set({ error: null }),
            updateUser: (userData) => set((state) => ({ user: state.user ? { ...state.user, ...userData } : null })),
        }),
        {
            name: 'auth-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken
            }),
        }
    )
);

// Configure API client to use store
// We need to defer this to ensure store is initialized? No, store creation is sync.
// But window might be undefined in SSR.
// However, api methods are called at runtime.
//api.setStore(useAuthStore); // This might cause circular issues depending on how api is imported vs created.
// Since api is singleton exported from module, it's fine.
api.setStore(useAuthStore);
