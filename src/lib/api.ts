/**
 * API client for Role-Aware AI Assistant backend
 */
import type { APIResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
    private baseUrl: string;
    private store: any = null;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    setStore(store: any) {
        this.store = store;
    }

    private getToken(): string | null {
        if (this.store) {
            return this.store.getState().accessToken;
        }
        if (typeof window === 'undefined') return null;
        // Fallback or legacy check
        return localStorage.getItem('access_token');
    }

    private getRefreshToken(): string | null {
        if (this.store) {
            return this.store.getState().refreshToken;
        }
        return null;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<APIResponse<T>> {
        let token = this.getToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        let response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
        });

        // Handle 401 Unauthorized (Token Expiry)
        if (response.status === 401 && this.store) {
            const refreshToken = this.getRefreshToken();

            if (refreshToken && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
                try {
                    // Attempt to refresh token
                    const refreshResponse = await fetch(`${this.baseUrl}/auth/refresh`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    });

                    if (refreshResponse.ok) {
                        const refreshData = await refreshResponse.json();
                        const newAccessToken = refreshData.data.access_token;

                        // Update store
                        this.store.getState().setTokens(newAccessToken, refreshToken);

                        // Retry original request with new token
                        (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
                        response = await fetch(`${this.baseUrl}${endpoint}`, {
                            ...options,
                            headers,
                        });
                    } else {
                        // Refresh failed, logout
                        this.store.getState().logout();
                    }
                } catch (error) {
                    console.error('Token refresh failed', error);
                    this.store.getState().logout();
                }
            }
        }

        const data: APIResponse<T> = await response.json();

        if (!response.ok) {
            throw new ApiError(data.message, response.status, data.status);
        }

        return data;
    }

    async get<T>(endpoint: string): Promise<APIResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, body?: unknown): Promise<APIResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async patch<T>(endpoint: string, body?: unknown): Promise<APIResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<APIResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    async upload<T>(endpoint: string, formData: FormData): Promise<APIResponse<T>> {
        const token = this.getToken();
        const headers: HeadersInit = {};

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData,
        });

        const data: APIResponse<T> = await response.json();

        if (!response.ok) {
            throw new ApiError(data.message, response.status, data.status);
        }

        return data;
    }

    /**
     * Upload with progress tracking using XMLHttpRequest
     */
    uploadWithProgress<T>(
        endpoint: string,
        formData: FormData,
        onProgress?: (percent: number) => void
    ): Promise<APIResponse<T>> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const token = this.getToken();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable && onProgress) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    onProgress(percent);
                }
            });

            xhr.addEventListener('load', () => {
                try {
                    const data: APIResponse<T> = JSON.parse(xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(data);
                    } else {
                        reject(new ApiError(data.message, xhr.status, data.status));
                    }
                } catch {
                    reject(new Error('Failed to parse response'));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            xhr.open('POST', `${this.baseUrl}${endpoint}`);

            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            xhr.send(formData);
        });
    }
}

export class ApiError extends Error {
    status: number;
    statusCode: string;

    constructor(message: string, status: number, statusCode: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.statusCode = statusCode;
    }
}

export const api = new ApiClient();
export default api;
