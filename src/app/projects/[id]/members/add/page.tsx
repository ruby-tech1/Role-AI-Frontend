'use client';

import { useState, FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api, { ApiError } from '@/lib/api';
import type { Role, ProjectMember } from '@/types';
import { ROLE_LABELS } from '@/types';
import { FaSpinner } from 'react-icons/fa';
import { FiChevronLeft, FiRefreshCcw } from 'react-icons/fi';
import Header from '@/components/common/Header';

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
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-white/40 text-sm font-black tracking-widest uppercase animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-foreground antialiased font-sans">
            <Header />

            <main className="max-w-2xl mx-auto px-6 py-12 pt-28">
                <div className="flex items-center gap-6 mb-12">
                    <Link href={`/projects/${id}`} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-white/40 hover:bg-white hover:text-black transition-all duration-500 shadow-xl">
                        <FiChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Add Member</h1>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Add a new member to the project</p>
                    </div>
                </div>

                <div className="glass-panel border-white/5 rounded-3xl p-10 mb-24 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/[0.04] transition-all duration-700" />

                    {error && (
                        <div className="mb-8 p-5 bg-destructive/10 border border-destructive/20 rounded-2xl animate-in shake duration-500">
                            <p className="text-destructive text-xs font-black uppercase tracking-widest text-center">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                                Email Address *
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="colleague@example.com"
                                className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium text-[15px]"
                            />
                            <p className="mt-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 opacity-60">
                                The member must have an existing account.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="role" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                                Role *
                            </label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                                className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-black uppercase tracking-widest text-xs"
                            >
                                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value} className="bg-black">
                                        {label.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 opacity-60">
                                Core role affects analyst tailoring during active consultation.
                            </p>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <Link
                                href={`/projects/${id}`}
                                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 py-4 px-6 bg-white text-black hover:bg-white/90 font-black rounded-2xl shadow-2xl shadow-white/5 transition-all duration-500 disabled:opacity-50 uppercase text-[10px] tracking-widest active:scale-95"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <FiRefreshCcw className="animate-spin h-4 w-4" />
                                        ADDING...
                                    </span>
                                ) : (
                                    'Add Member'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main >
        </div >
    );
}
