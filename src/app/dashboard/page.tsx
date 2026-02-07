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
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="flex items-center gap-3 text-white">
                    <FaSpinner className="animate-spin h-8 w-8 text-white/20" />
                    <span className="text-xl font-light tracking-wide">Loading...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-black overflow-x-hidden">
            <Header />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Welcome Card */}
                <div className="glass-card p-8 mb-8 border-white/5">
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                        Welcome back, {user?.full_name?.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-muted-foreground font-medium">
                        Your AI engineering assistant is ready to help you with your architecture and design.
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
                        description="Ask questions and get AI insights"
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
                        className="block p-6 glass-card border-white/5 hover:border-accent/40 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent transition-colors group-hover:bg-accent/20">
                                <FiGrid className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">View All Projects</h3>
                                <p className="text-sm text-muted-foreground">Manage your projects and engineering context</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/chat"
                        className="block p-6 glass-card border-white/5 hover:border-accent/40 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent transition-colors group-hover:bg-accent/20">
                                <BsChatDots className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">AI Chat</h3>
                                <p className="text-sm text-muted-foreground">Get AI-driven engineering insights from your context</p>
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
            className="block p-6 glass-card border-white/5 hover:border-accent/40 group"
        >
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent group-hover:bg-accent/20 transition mb-4">
                {icon}
            </div>
            <h4 className="text-white font-semibold mb-1">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
        </Link>
    );
}
