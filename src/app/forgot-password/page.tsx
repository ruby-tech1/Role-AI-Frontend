'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { FiCheck, FiRefreshCcw } from 'react-icons/fi';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });
            setIsSubmitted(true);
        } catch {
            // Always show success to prevent email enumeration
            setIsSubmitted(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-foreground antialiased font-sans px-6 py-2 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 w-full h-full bg-white/[0.01] rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl animate-pulse" />

            <div className="w-full max-w-md relative z-10">
                <div className="glass-panel border-white/5 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-12 shadow-2xl overflow-hidden group">
                    {/* Header */}
                    <div className="text-center mb-8 sm:mb-12">
                        <div className="w-16 h-16 bg-white/5 border border-white/10 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transform group-hover:scale-110 transition-transform duration-500">
                            <FiRefreshCcw className={`w-8 h-8 ${isLoading ? 'animate-spin' : ''}`} />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Forgot Password</h1>
                        <p className="text-sm font-medium text-muted-foreground opacity-80">
                            {isSubmitted
                                ? 'Reset Link Sent'
                                : 'Enter your email to reset password'}
                        </p>
                    </div>

                    {isSubmitted ? (
                        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
                                <FiCheck className="w-10 h-10 text-white" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground mb-12 leading-relaxed px-4">
                                If the email <strong className="text-white">{email}</strong> matches our records, a reset link will be sent shortly.
                            </p>
                            <Link
                                href="/login"
                                className="inline-block px-8 py-3 bg-white/10 text-white border border-white/10 font-semibold rounded-xl text-sm transition-all duration-300 shadow-2xl shadow-white/5 hover:bg-white/20 active:scale-95 tracking-wide"
                            >
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-8 p-5 bg-destructive/10 border border-destructive/20 rounded-2xl animate-in shake duration-500">
                                    <p className="text-destructive text-sm font-semibold text-center leading-relaxed">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                                        Email Address
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

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 px-6 bg-white/10 text-white border border-white/10 font-semibold rounded-xl shadow-2xl shadow-white/5 hover:bg-white/20 transition-all duration-300 disabled:opacity-50 text-sm tracking-wide active:scale-95"
                                >
                                    {isLoading ? 'SENDING...' : 'Send Reset Link'}
                                </button>
                            </form>

                            <p className="mt-10 text-center text-sm font-medium text-muted-foreground opacity-80">
                                Remember your password?{' '}
                                <Link href="/login" className="text-white hover:underline transition-all">
                                    Sign In
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
