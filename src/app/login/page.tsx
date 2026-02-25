'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ApiError } from '@/lib/api';
import { FiRefreshCcw } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
    const { login, loginWithGoogle, error, clearError, isLoading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await login({ email, password });
            router.push('/dashboard');
        } catch {

        }
    };

    const googleLogin = useGoogleLogin({
        flow: 'auth-code',
        onSuccess: async (response) => {
            setGoogleLoading(true);
            setGoogleError(null);

            try {
                await loginWithGoogle(response.code);
                router.push('/dashboard');
            } catch (err: any) {
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
        <div className="min-h-screen flex items-center justify-center bg-black text-foreground antialiased font-sans px-6 py-2 overflow-hidden relative">
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
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Login</h1>
                        <p className="text-sm font-medium text-muted-foreground opacity-80">Sign in to your account</p>
                    </div>

                    {/* Error Message */}
                    {displayError && (
                        <div className="mb-8 p-5 bg-destructive/10 border border-destructive/20 rounded-2xl animate-in shake duration-500">
                            <p className="text-destructive text-sm font-semibold text-center leading-relaxed">{displayError}</p>
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
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition"
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
                                    className="w-5 h-5 rounded-md border-white/10 bg-black text-white focus:ring-white/30 transition-all appearance-none border checked:bg-white relative after:content-['✓'] after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-black after:text-sm after:font-bold after:opacity-0 checked:after:opacity-100"
                                />
                                <label htmlFor="remember" className="text-sm font-medium text-muted-foreground cursor-pointer group-hover/check:text-white transition-colors">
                                    Remember Me
                                </label>
                            </div>
                            <Link href="/forgot-password" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 px-6 bg-white/10 text-white border border-white/10 font-semibold rounded-xl shadow-2xl shadow-white/5 hover:bg-white/20 transition-all duration-300 disabled:opacity-50 text-sm tracking-wide active:scale-95"
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
                        <span className="px-4 text-xs font-medium text-white/40 uppercase tracking-wider">Or sign in with</span>
                        <div className="flex-1 border-t border-white/5"></div>
                    </div>

                    {/* Google Sign In */}
                    <button
                        type="button"
                        onClick={() => googleLogin()}
                        disabled={googleLoading}
                        className="mt-6 w-full py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-medium rounded-xl flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 text-sm"
                    >
                        {googleLoading ? (
                            <FiRefreshCcw className="animate-spin h-4 w-4" />
                        ) : (
                            <FcGoogle className="w-5 h-5" />
                        )}
                        {googleLoading ? 'Connecting...' : 'Google'}
                    </button>

                    {/* Register Link */}
                    <p className="mt-10 text-center text-sm font-medium text-muted-foreground opacity-80">
                        New here?{' '}
                        <Link href="/register" className="text-white hover:text-accent transition-all">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
