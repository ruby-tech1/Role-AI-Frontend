'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { FiRefreshCcw } from 'react-icons/fi';

export default function RegisterPage() {
    const { register, error, clearError, isLoading } = useAuth();
    const router = useRouter();
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
            router.push('/dashboard');
        } catch {
            // Error is handled in context
        }
    };

    const displayError = localError || error;

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-foreground antialiased font-sans px-6 py-2 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.02] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/[0.01] rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

            <div className="w-full max-w-md relative z-10">
                <div className="glass-panel border-white/5 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-12 shadow-2xl overflow-hidden group">
                    {/* Header */}
                    <div className="text-center mb-8 sm:mb-12">
                        <div className="w-16 h-16 bg-white text-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-white/20 transform rotate-6 group-hover:rotate-0 transition-transform duration-500">
                            <span className="font-black text-2xl tracking-tighter">AI</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h1>
                        <p className="text-sm font-medium text-muted-foreground opacity-80">Create a new account</p>
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
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-200 mb-2">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition"
                                placeholder="Enter your full name..."
                            />
                        </div>

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
                            className="w-full py-4 px-6 bg-white/10 text-white border border-white/10 font-semibold rounded-xl shadow-2xl shadow-white/5 hover:bg-white/20 transition-all duration-300 disabled:opacity-50 text-sm tracking-wide active:scale-95"
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
                    <p className="mt-8 text-center text-xs font-medium text-muted-foreground opacity-60 leading-relaxed px-4">
                        By proceeding, you agree to our{' '}
                        <Link href="/terms" className="text-white hover:underline transition-all">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-white hover:underline transition-all">
                            Privacy Policy
                        </Link>
                    </p>

                    {/* Login Link */}
                    <p className="mt-8 text-center text-sm font-medium text-muted-foreground opacity-80">
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
