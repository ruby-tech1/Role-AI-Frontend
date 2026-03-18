'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass-panel h-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex items-center justify-between h-full">
                    <Link href="/dashboard" className="text-xl font-bold text-white hover:text-white/80 transition tracking-tight">
                        AI Project Manager
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <span className="hidden sm:inline text-muted-foreground text-sm font-medium">{user?.full_name}</span>
                        <button
                            onClick={logout}
                            className="px-3 sm:px-4 py-2 text-sm text-foreground/70 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg transition-all duration-300"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
