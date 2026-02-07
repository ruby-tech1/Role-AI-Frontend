'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { FiRefreshCcw } from 'react-icons/fi';

export default function RegisterPage() {
    const { register, error, clearError, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        clearError();
        setLocalError(null);

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setLocalError('Password must be at least 8 characters');
            return;
        }

        try {
            await register({ email, password, full_name: fullName });
        } catch {
            // Error is handled in context
        }
    };

    const displayError = localError || error;

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-foreground antialiased font-sans p-6 overflow-hidden relative py-24">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/[0.02] rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/[0.01] rounded-full translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" />

            <div className="w-full max-w-md relative z-10">
                <div className="glass-panel border-white/5 rounded-[2.5rem] p-12 shadow-2xl overflow-hidden group">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="w-16 h-16 bg-white text-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-white/20 transform rotate-6 group-hover:rotate-0 transition-transform duration-500">
                            <span className="font-black text-2xl tracking-tighter">AI</span>
                        </div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">Create Account</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] opacity-40">Create a new account</p>
                    </div>

                    {/* Error Message */}
                    {displayError && (
                        <div className="mb-8 p-5 bg-destructive/10 border border-destructive/20 rounded-2xl animate-in shake duration-500">
                            <p className="text-destructive text-[10px] font-black uppercase tracking-widest text-center leading-relaxed">{displayError}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="fullName" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium"
                                placeholder="Enter your full name..."
                            />
                        </div>

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
                        <PasswordInput
                            id="password"
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />

                        <PasswordInput
                            id="confirmPassword"
                            label="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 px-6 bg-white text-black font-black rounded-2xl shadow-2xl shadow-white/5 hover:bg-white/90 transition-all duration-500 disabled:opacity-50 uppercase text-[10px] tracking-[0.2em] active:scale-95 mt-4"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <FiRefreshCcw className="animate-spin h-4 w-4" />
                                    SIGNING UP...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Terms */}
                    <p className="mt-8 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40 leading-relaxed px-4">
                        By proceeding, you agree to our{' '}
                        <Link href="/terms" className="text-white hover:underline transition-all font-black">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-white hover:underline transition-all font-black">
                            Privacy Policy
                        </Link>
                    </p>

                    {/* Login Link */}
                    <p className="mt-12 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                        Already have an account?{' '}
                        <Link href="/login" className="text-white hover:underline transition-all">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
