'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import type { Project } from '@/types';
import { FaSpinner } from 'react-icons/fa';
import { FiPlus, FiFolder } from 'react-icons/fi';
import Header from '@/components/common/Header';

export default function ProjectsPage() {
    const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!isAuthenticated) return;

            try {
                const response = await api.get<Project[]>('/projects');
                if (response.success && response.data) {
                    setProjects(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch projects:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, [isAuthenticated]);

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="flex items-center gap-3 text-white">
                    <div className="flex items-center gap-3 text-white">
                        <FaSpinner className="animate-spin h-8 w-8 text-white/50" />
                        <span className="text-xl">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <Header />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white">Projects</h1>
                    <Link
                        href="/projects/new"
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2"
                    >
                        <FiPlus className="w-5 h-5" />
                        New Project
                    </Link>
                </div>

                {projects.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
                        <FiFolder className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                        <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
                        <p className="text-gray-400 mb-6">Create your first project to get started with the AI assistant.</p>
                        <Link
                            href="/projects/new"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-300"
                        >
                            <FiPlus className="w-5 h-5" />
                            Create Project
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="block p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 group-hover:bg-purple-500/30 transition">
                                        <FiFolder className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(project.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
                                <p className="text-sm text-gray-400 line-clamp-2">
                                    {project.description || 'No description'}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
