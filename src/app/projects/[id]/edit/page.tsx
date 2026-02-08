'use client';

import { useState, useEffect, FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api, { ApiError } from '@/lib/api';
import type { Project } from '@/types';
import { Spinner, PageLoader } from '@/components/common/Loading';
import { FiChevronLeft, FiRefreshCcw } from 'react-icons/fi';
import Header from '@/components/common/Header';

export default function EditProjectPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [context, setContext] = useState('');
    const [allowPmManage, setAllowPmManage] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        const fetchProject = async () => {
            if (!isAuthenticated || !id) return;

            try {
                const response = await api.get<Project>(`/projects/${id}`);
                if (response.success && response.data) {
                    setName(response.data.name);
                    setDescription(response.data.description || '');
                    setContext(response.data.context || '');
                    setAllowPmManage(response.data.allow_pm_manage ?? false);
                }
            } catch (err) {
                if (err instanceof ApiError) {
                    setError(err.message);
                } else {
                    setError('Failed to load project');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchProject();
    }, [isAuthenticated, id]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSaving(true);

        try {
            await api.patch(`/projects/${id}`, {
                name,
                description: description || undefined,
                context: context || undefined,
                allow_pm_manage: allowPmManage,
            });
            router.push(`/projects/${id}`);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Failed to update project');
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || isLoading) {
        return <PageLoader message="Modifying Project Settings..." />;
    }

    return (
        <div className="min-h-screen bg-black text-foreground antialiased font-sans">
            <Header />

            <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                <div className="flex items-center gap-6 mb-12">
                    <Link href={`/projects/${id}`} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-white/40 hover:bg-white hover:text-black transition-all duration-500 shadow-xl">
                        <FiChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Edit Project</h1>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Update project details</p>
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
                            <label htmlFor="name" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                                Project Name *
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium text-[15px]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="description" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all resize-none font-medium text-[15px]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="context" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                                Project Context
                            </label>
                            <textarea
                                id="context"
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                rows={4}
                                className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all resize-none font-medium text-[15px]"
                            />
                        </div>

                        <div className="flex items-center gap-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5 group-hover:border-white/10 transition-all duration-500">
                            <div className="relative flex items-center">
                                <input
                                    id="allowPmManage"
                                    type="checkbox"
                                    checked={allowPmManage}
                                    onChange={(e) => setAllowPmManage(e.target.checked)}
                                    className="w-6 h-6 rounded-lg border-white/10 bg-black text-white focus:ring-white/20 transition-all appearance-none border checked:bg-white relative after:content-['✓'] after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-black after:text-[14px] after:font-black after:opacity-0 checked:after:opacity-100"
                                />
                            </div>
                            <div>
                                <label htmlFor="allowPmManage" className="block text-sm font-black text-white uppercase tracking-tight">
                                    Member Management
                                </label>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                                    Allow Product Managers to manage design decisions.
                                </p>
                            </div>
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
                                disabled={isSaving}
                                className="flex-1 py-4 px-6 bg-white text-black hover:bg-white/90 font-black rounded-2xl shadow-2xl shadow-white/5 transition-all duration-500 disabled:opacity-50 uppercase text-[10px] tracking-widest active:scale-95"
                            >
                                {isSaving ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <Spinner size={16} />
                                        SAVING...
                                    </span>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main >
        </div >
    );
}
