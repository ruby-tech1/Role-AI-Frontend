'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordInput } from '@/components/ui/PasswordInput';
import api, { ApiError } from '@/lib/api';
import type { AuthResponse } from '@/types';
import { FaSpinner } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
    const { login, error, clearError, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await login({ email, password });
        } catch {
            // Error is handled in context
        }
    };

    const googleLogin = useGoogleLogin({
        flow: 'auth-code',
        onSuccess: async (response) => {
            setGoogleLoading(true);
            setGoogleError(null);

            try {
                const result = await api.post<AuthResponse>('/auth/google', {
                    code: response.code,
                });

                if (result.success && result.data) {
                    localStorage.setItem('access_token', result.data.access_token);
                    window.location.href = '/dashboard';
                }
            } catch (err) {
                if (err instanceof ApiError) {
                    setGoogleError(err.message);
                } else {
                    setGoogleError('Google sign-in failed. Please try again.');
                }
            } finally {
                setGoogleLoading(false);
            }
        },
        onError: () => {
            setGoogleError('Google sign-in was cancelled or failed.');
        },
    });

    const displayError = googleError || error;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="w-full max-w-md p-8">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-gray-300">Sign in to your account</p>
                    </div>

                    {/* Error Message */}
                    {displayError && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <p className="text-red-200 text-sm text-center">{displayError}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                placeholder="you@example.com"
                            />
                        </div>

                        <PasswordInput
                            id="password"
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    className="h-4 w-4 rounded bg-white/5 border-white/10 text-purple-500 focus:ring-purple-500"
                                />
                                <label htmlFor="remember" className="ml-2 text-sm text-gray-300">
                                    Remember me
                                </label>
                            </div>
                            <Link href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300 transition">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-8 flex items-center">
                        <div className="flex-1 border-t border-white/10"></div>
                        <span className="px-4 text-sm text-gray-400">or continue with</span>
                        <div className="flex-1 border-t border-white/10"></div>
                    </div>

                    {/* Google Sign In */}
                    <button
                        type="button"
                        onClick={() => googleLogin()}
                        disabled={googleLoading}
                        className="mt-6 w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-lg flex items-center justify-center gap-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {googleLoading ? (
                            <FaSpinner className="animate-spin h-5 w-5 text-white" />
                        ) : (
                            <FcGoogle className="w-5 h-5" />
                        )}
                        {googleLoading ? 'Signing in...' : 'Continue with Google'}
                    </button>

                    {/* Register Link */}
                    <p className="mt-8 text-center text-gray-400">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
