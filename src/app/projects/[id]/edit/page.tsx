'use client';

import { useState, useEffect, FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api, { ApiError } from '@/lib/api';
import type { Project } from '@/types';
import { FaSpinner } from 'react-icons/fa';
import { FiChevronLeft } from 'react-icons/fi';
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
            <Header />

            <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/projects/${id}`} className="text-gray-400 hover:text-white transition">
                        <FiChevronLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Edit Project</h1>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                                Project Name *
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="context" className="block text-sm font-medium text-gray-200 mb-2">
                                Technical Context
                            </label>
                            <textarea
                                id="context"
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-3 bg-white/5 p-4 rounded-lg border border-white/10">
                            <input
                                id="allowPmManage"
                                type="checkbox"
                                checked={allowPmManage}
                                onChange={(e) => setAllowPmManage(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-700"
                            />
                            <div>
                                <label htmlFor="allowPmManage" className="block text-sm font-medium text-white">
                                    Allow Project Managers to Manage Decisions
                                </label>
                                <p className="text-xs text-gray-400">
                                    If enabled, Product Managers can approve, reject, delete, and edit design decisions.
                                </p>
                            </div>
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
                                disabled={isSaving}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
