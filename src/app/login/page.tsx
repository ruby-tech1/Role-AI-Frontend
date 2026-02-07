'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordInput } from '@/components/ui/PasswordInput';
import api, { ApiError } from '@/lib/api';
import type { AuthResponse } from '@/types';
import { FiRefreshCcw } from 'react-icons/fi';
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
        <div className="min-h-screen flex items-center justify-center bg-black text-foreground antialiased font-sans p-6 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.02] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/[0.01] rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

            <div className="w-full max-w-md relative z-10">
                <div className="glass-panel border-white/5 rounded-[2.5rem] p-12 shadow-2xl overflow-hidden group">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="w-16 h-16 bg-white text-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-white/20 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                            <span className="font-black text-2xl tracking-tighter">AI</span>
                        </div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">Login</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] opacity-40">Sign in to your account</p>
                    </div>

                    {/* Error Message */}
                    {displayError && (
                        <div className="mb-8 p-5 bg-destructive/10 border border-destructive/20 rounded-2xl animate-in shake duration-500">
                            <p className="text-destructive text-[10px] font-black uppercase tracking-widest text-center leading-relaxed">{displayError}</p>
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

                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-3 group/check cursor-pointer" onClick={() => {
                                const el = document.getElementById('remember') as HTMLInputElement;
                                if (el) el.click();
                            }}>
                                <input
                                    id="remember"
                                    type="checkbox"
                                    className="w-5 h-5 rounded-lg border-white/10 bg-black text-white focus:ring-white/20 transition-all appearance-none border checked:bg-white relative after:content-['✓'] after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-black after:text-[12px] after:font-black after:opacity-0 checked:after:opacity-100"
                                />
                                <label htmlFor="remember" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer group-hover/check:text-white transition-colors">
                                    Remember Me
                                </label>
                            </div>
                            <Link href="/forgot-password" className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 px-6 bg-white text-black font-black rounded-2xl shadow-2xl shadow-white/5 hover:bg-white/90 transition-all duration-500 disabled:opacity-50 uppercase text-[10px] tracking-[0.2em] active:scale-95"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <FiRefreshCcw className="animate-spin h-4 w-4" />
                                    LOGGING IN...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-12 flex items-center px-4">
                        <div className="flex-1 border-t border-white/5"></div>
                        <span className="px-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Or sign in with</span>
                        <div className="flex-1 border-t border-white/5"></div>
                    </div>

                    {/* Google Sign In */}
                    <button
                        type="button"
                        onClick={() => googleLogin()}
                        disabled={googleLoading}
                        className="mt-8 w-full py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-black rounded-2xl flex items-center justify-center gap-4 transition-all duration-500 disabled:opacity-50 uppercase text-[10px] tracking-widest"
                    >
                        {googleLoading ? (
                            <FiRefreshCcw className="animate-spin h-4 w-4" />
                        ) : (
                            <FcGoogle className="w-5 h-5" />
                        )}
                        {googleLoading ? 'Connecting...' : 'Google'}
                    </button>

                    {/* Register Link */}
                    <p className="mt-12 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                        New here?{' '}
                        <Link href="/register" className="text-white hover:underline transition-all">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
