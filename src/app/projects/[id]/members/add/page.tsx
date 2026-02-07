'use client';

import { useState, FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api, { ApiError } from '@/lib/api';
import type { Role, ProjectMember } from '@/types';
import { ROLE_LABELS } from '@/types';
import { FaSpinner } from 'react-icons/fa';
import { FiChevronLeft } from 'react-icons/fi';

export default function AddMemberPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Role>('developer');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!authLoading && !isAuthenticated) {
        router.push('/login');
        return null;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await api.post<ProjectMember>(`/projects/${id}/members`, {
                email,
                role,
            });
            router.push(`/projects/${id}`);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Failed to add member');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="flex items-center gap-3 text-white">
                    <FaSpinner className="animate-spin h-8 w-8 text-white/50" />
                    <span className="text-xl">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="bg-white/5 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/dashboard" className="text-xl font-bold text-white hover:text-purple-400 transition">
                            Role-Aware AI
                        </Link>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-300">{user?.full_name}</span>
                            <button onClick={logout} className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/projects/${id}`} className="text-gray-400 hover:text-white transition">
                        <FiChevronLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Add Team Member</h1>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                                Email Address *
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="colleague@example.com"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            />
                            <p className="mt-2 text-sm text-gray-400">
                                The user must already have an account with this email.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-200 mb-2">
                                Role *
                            </label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            >
                                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value} className="bg-slate-800">
                                        {label}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-2 text-sm text-gray-400">
                                This determines how the AI tailors responses for this team member.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <Link
                                href={`/projects/${id}`}
                                className="px-6 py-3 border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-medium rounded-lg transition"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50"
                            >
                                {isLoading ? 'Adding...' : 'Add Member'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
