'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordInput } from '@/components/ui/PasswordInput';
import api, { ApiError } from '@/lib/api';
import { FiRefreshCcw } from 'react-icons/fi';
import Header from '@/components/common/Header';

export default function ProfilePage() {
    const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
        if (user) {
            setFullName(user.full_name);
            setEmail(user.email);
        }
    }, [authLoading, isAuthenticated, router, user]);

    const handleProfileUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setProfileError(null);
        setProfileSuccess(false);
        setProfileLoading(true);

        try {
            await api.patch('/users/me', { full_name: fullName, email });
            setProfileSuccess(true);
        } catch (err) {
            if (err instanceof ApiError) {
                setProfileError(err.message);
            } else {
                setProfileError('Failed to update profile');
            }
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e: FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);

        if (newPassword !== confirmNewPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }

        setPasswordLoading(true);

        try {
            await api.patch('/users/me/password', {
                current_password: currentPassword,
                new_password: newPassword,
            });
            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err) {
            if (err instanceof ApiError) {
                setPasswordError(err.message);
            } else {
                setPasswordError('Failed to change password');
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-6">
                    <FiRefreshCcw className="animate-spin h-10 w-10 text-white/20" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Loading...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-black text-foreground antialiased font-sans">
            <Header />
            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 py-12 pt-32">
                <div className="mb-16">
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">My Profile</h1>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] opacity-40">Update your personal information and password</p>
                </div>

                {/* Profile Update Form */}
                <div className="glass-panel border-white/5 rounded-[2.5rem] p-12 mb-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.02] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />

                    <div className="flex items-center gap-4 mb-12 relative z-10">
                        <div className="w-1.5 h-6 bg-white rounded-full" />
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Personal Information</h2>
                    </div>

                    {profileSuccess && (
                        <div className="mb-10 p-5 bg-white/5 border border-white/10 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                            <p className="text-white text-[10px] font-black uppercase tracking-widest text-center">Profile updated successfully</p>
                        </div>
                    )}
                    {profileError && (
                        <div className="mb-10 p-5 bg-destructive/10 border border-destructive/20 rounded-2xl animate-in shake duration-500">
                            <p className="text-destructive text-[10px] font-black uppercase tracking-widest text-center leading-relaxed">{profileError}</p>
                        </div>
                    )}
                    <form onSubmit={handleProfileUpdate} className="space-y-8 relative z-10">
                        <div className="space-y-1.5">
                            <label htmlFor="fullName" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium"
                                placeholder="Enter your full name..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={profileLoading}
                            className="px-10 py-4 bg-white text-black font-black rounded-2xl shadow-2xl shadow-white/5 hover:bg-white/90 transition-all duration-300 disabled:opacity-50 uppercase text-[10px] tracking-widest"
                        >
                            {profileLoading ? (
                                <span className="flex items-center gap-3">
                                    <FiRefreshCcw className="animate-spin w-4 h-4" />
                                    SAVING...
                                </span>
                            ) : (
                                'Update Profile'
                            )}
                        </button>
                    </form>
                </div>

                {/* Password Change Form */}
                <div className="glass-panel border-white/5 rounded-[2.5rem] p-12 mb-24 relative overflow-hidden group">
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/[0.01] rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-50" />

                    <div className="flex items-center gap-4 mb-12 relative z-10">
                        <div className="w-1.5 h-6 bg-white rounded-full opacity-40" />
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Change Password</h2>
                    </div>

                    {passwordSuccess && (
                        <div className="mb-10 p-5 bg-white/5 border border-white/10 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                            <p className="text-white text-[10px] font-black uppercase tracking-widest text-center">Password changed successfully</p>
                        </div>
                    )}
                    {passwordError && (
                        <div className="mb-10 p-5 bg-destructive/10 border border-destructive/20 rounded-2xl animate-in shake duration-500">
                            <p className="text-destructive text-[10px] font-black uppercase tracking-widest text-center leading-relaxed">{passwordError}</p>
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-6 relative z-10">
                        <PasswordInput
                            id="currentPassword"
                            label="Current Password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />

                        <PasswordInput
                            id="newPassword"
                            label="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />

                        <PasswordInput
                            id="confirmNewPassword"
                            label="Confirm New Password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />

                        <button
                            type="submit"
                            disabled={passwordLoading}
                            className="w-full py-5 px-6 bg-white text-black font-black rounded-2xl shadow-2xl shadow-white/5 hover:bg-white/90 transition-all duration-300 disabled:opacity-50 uppercase text-[10px] tracking-[0.2em] mt-4"
                        >
                            {passwordLoading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <FiRefreshCcw className="animate-spin h-4 w-4" />
                                    CHANGING PASSWORD...
                                </span>
                            ) : (
                                'Change Password'
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
