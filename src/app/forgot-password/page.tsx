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
        <div className="min-h-screen flex items-center justify-center bg-black text-foreground antialiased font-sans p-6 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 w-full h-full bg-white/[0.01] rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />

            <div className="w-full max-w-md relative z-10">
                <div className="glass-panel border-white/5 rounded-[2.5rem] p-12 shadow-2xl overflow-hidden group">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="w-16 h-16 bg-white/5 border border-white/10 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transform group-hover:scale-110 transition-transform duration-500">
                            <FiRefreshCcw className={`w-8 h-8 ${isLoading ? 'animate-spin' : ''}`} />
                        </div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">Forgot Password</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] opacity-40 leading-relaxed px-4">
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
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-12 leading-relaxed px-4">
                                If the email <strong className="text-white">{email}</strong> matches our records, a reset link will be sent shortly.
                            </p>
                            <Link
                                href="/login"
                                className="inline-block px-10 py-4 bg-white text-black font-black rounded-2xl transition-all duration-300 shadow-2xl shadow-white/5 hover:bg-white/90 active:scale-95 uppercase text-[10px] tracking-widest"
                            >
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-8 p-5 bg-destructive/10 border border-destructive/20 rounded-2xl animate-in shake duration-500">
                                    <p className="text-destructive text-[10px] font-black uppercase tracking-widest text-center leading-relaxed">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium"
                                        placeholder="you@example.com"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-5 px-6 bg-white text-black font-black rounded-2xl shadow-2xl shadow-white/5 hover:bg-white/90 transition-all duration-500 disabled:opacity-50 uppercase text-[10px] tracking-[0.2em] active:scale-95"
                                >
                                    {isLoading ? 'SENDING...' : 'Send Reset Link'}
                                </button>
                            </form>

                            <p className="mt-12 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                Remember your password?{' '}
                                <Link href="/login" className="text-white hover:underline transition-all">
                                    Sign In
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div >
    );
}
