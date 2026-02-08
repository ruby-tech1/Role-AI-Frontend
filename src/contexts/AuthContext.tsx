'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { ReactNode } from 'react';

// Deprecated Provider - not needed with Zustand but kept for compatibility if imported elsewhere
export function AuthProvider({ children }: { children: ReactNode }) {
    return <>{children}</>;
}

export function useAuth() {
    const store = useAuthStore();

    return {
        user: store.user,
        isAuthenticated: !!store.user,
        isLoading: store.isLoading || !store._hasHydrated,
        error: store.error,
        login: store.login,
        loginWithGoogle: store.loginWithGoogle,
        register: store.register,
        logout: store.logout,
        clearError: store.clearError,
    };
}
