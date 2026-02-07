'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 h-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex items-center justify-between h-full">
                    <Link href="/dashboard" className="text-xl font-bold text-white hover:text-purple-400 transition">
                        Role-Aware AI
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-300">{user?.full_name}</span>
                        <button
                            onClick={logout}
                            className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
