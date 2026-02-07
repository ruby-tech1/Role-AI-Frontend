'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { FaSpinner } from 'react-icons/fa';
import { FiPlus, FiFolderPlus, FiUser, FiGrid } from 'react-icons/fi';
import { BsChatDots } from 'react-icons/bs';
import Header from '@/components/common/Header';

export default function DashboardPage() {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="flex items-center gap-3 text-white">
                    <FaSpinner className="animate-spin h-8 w-8 text-white/50" />
                    <span className="text-xl">Loading...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <Header />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Welcome Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Welcome back, {user?.full_name?.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-gray-300">
                        Your role-aware AI assistant is ready to help you with your projects.
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <QuickActionCard
                        title="New Project"
                        description="Create a new project and start collaborating"
                        icon={
                            <FiPlus className="w-6 h-6" />
                        }
                        href="/projects/new"
                    />
                    <QuickActionCard
                        title="Start Chat"
                        description="Ask questions with role-specific context"
                        icon={
                            <BsChatDots className="w-6 h-6" />
                        }
                        href="/chat"
                    />
                    <QuickActionCard
                        title="My Profile"
                        description="Update your account settings"
                        icon={
                            <FiUser className="w-6 h-6" />
                        }
                        href="/profile"
                    />
                </div>

                {/* Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link
                        href="/projects"
                        className="block p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                                <FiGrid className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">View All Projects</h3>
                                <p className="text-sm text-gray-400">Manage your projects and team members</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/chat"
                        className="block p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
                                <BsChatDots className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Role-Aware Chat</h3>
                                <p className="text-sm text-gray-400">Get AI responses tailored to your role</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
}

function QuickActionCard({
    title,
    description,
    icon,
    href,
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="block p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 group"
        >
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 group-hover:bg-purple-500/30 transition mb-4">
                {icon}
            </div>
            <h4 className="text-white font-semibold mb-1">{title}</h4>
            <p className="text-sm text-gray-400">{description}</p>
        </Link>
    );
}
