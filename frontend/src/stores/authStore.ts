import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import type { User, LoginCredentials, LoginResponse, AuthTokens } from '@/types';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshTokenValue: string | null;
    expiresIn: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    refreshAuthToken: () => Promise<void>;
    clearError: () => void;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshTokenValue: null,
            expiresIn: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (credentials: LoginCredentials) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<{ success: boolean; data: LoginResponse }>(
                        '/auth/login',
                        credentials
                    );

                    // Backend returns { user, tokens: { accessToken, refreshToken, expiresIn } }
                    const { user, tokens } = response.data.data;

                    set({
                        user: {
                            ...user,
                            phone: null,
                            roleId: null,
                            isActive: true,
                            lastLogin: new Date().toISOString(),
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        },
                        accessToken: tokens.accessToken,
                        refreshTokenValue: tokens.refreshToken,
                        expiresIn: tokens.expiresIn,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (error: unknown) {
                    let message = 'Login failed. Please check your credentials.';
                    if (error && typeof error === 'object' && 'response' in error) {
                        const axiosError = error as { response?: { data?: { message?: string } } };
                        message = axiosError.response?.data?.message || message;
                    }
                    set({
                        isLoading: false,
                        error: message,
                        isAuthenticated: false,
                    });
                    throw error;
                }
            },

            logout: async () => {
                const { refreshTokenValue, accessToken } = get();

                // Try to call logout endpoint
                if (accessToken && refreshTokenValue) {
                    try {
                        await api.post('/auth/logout', { refreshToken: refreshTokenValue });
                    } catch {
                        // Ignore logout errors, still clear local state
                    }
                }

                set({
                    user: null,
                    accessToken: null,
                    refreshTokenValue: null,
                    expiresIn: null,
                    isAuthenticated: false,
                    error: null,
                });
            },

            refreshAuthToken: async () => {
                const { refreshTokenValue } = get();
                if (!refreshTokenValue) {
                    throw new Error('No refresh token available');
                }

                try {
                    const response = await api.post<{ success: boolean; data: AuthTokens }>(
                        '/auth/refresh',
                        { refreshToken: refreshTokenValue }
                    );

                    const tokens = response.data.data;

                    set({
                        accessToken: tokens.accessToken,
                        refreshTokenValue: tokens.refreshToken,
                        expiresIn: tokens.expiresIn,
                    });
                } catch {
                    // Clear auth state on refresh failure
                    set({
                        user: null,
                        accessToken: null,
                        refreshTokenValue: null,
                        expiresIn: null,
                        isAuthenticated: false,
                        error: 'Session expired. Please login again.',
                    });
                    throw new Error('Session expired. Please login again.');
                }
            },

            clearError: () => set({ error: null }),

            setUser: (user: User) => set({ user }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshTokenValue: state.refreshTokenValue,
                expiresIn: state.expiresIn,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
