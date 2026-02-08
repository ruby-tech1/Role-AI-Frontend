'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import type { Project } from '@/types';
import { PageLoader } from '@/components/common/Loading';
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
        return <PageLoader message="Fetching Projects..." />;
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-black text-foreground antialiased font-sans">
            <Header />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12 pt-28">
                <div className="flex items-center justify-between mb-12">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Projects</h1>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Manage your projects</p>
                    </div>
                    <Link
                        href="/projects/new"
                        className="px-6 py-3.5 bg-white text-black hover:bg-white/90 font-black rounded-2xl shadow-2xl shadow-white/5 transition-all duration-300 flex items-center gap-2 uppercase text-xs tracking-widest active:scale-95"
                    >
                        <FiPlus className="w-4 h-4" />
                        New Project
                    </Link>
                </div>

                {projects.length === 0 ? (
                    <div className="glass-panel rounded-3xl p-16 border-white/5 text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                            <FiFolder className="w-8 h-8 text-white/20" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">No Projects Found</h3>
                        <p className="text-muted-foreground mb-10 max-w-sm mx-auto font-medium">Create your first project to start collaborating with the AI assistant.</p>
                        <Link
                            href="/projects/new"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black hover:bg-white/90 font-black rounded-2xl shadow-2xl shadow-white/5 transition-all duration-500 uppercase text-xs tracking-widest active:scale-95"
                        >
                            <FiPlus className="w-5 h-5" />
                            Create Project
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {projects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="block p-7 glass-card border-white/5 hover:border-white/20 rounded-3xl transition-all duration-500 group animate-in slide-in-from-bottom-4 duration-500"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-14 h-14 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:bg-white/10 group-hover:text-white transition-all duration-500">
                                        <FiFolder className="w-7 h-7" />
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:translate-x-1 transition-transform duration-300">{project.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium mb-6">
                                    {project.description || 'No description provided for this project.'}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-white/60 transition-colors duration-500">
                                    View Details <FiPlus className="w-2.5 h-2.5" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
