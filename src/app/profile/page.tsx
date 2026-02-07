'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordInput } from '@/components/ui/PasswordInput';
import api, { ApiError } from '@/lib/api';
import { FaSpinner } from 'react-icons/fa';

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
            {/* Header */}
            <header className="bg-white/5 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <a href="/dashboard" className="text-xl font-bold text-white hover:text-purple-400 transition">
                                Role-Aware AI
                            </a>
                        </div>
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

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-white mb-8">Profile Settings</h1>

                {/* Profile Update Form */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">Personal Information</h2>

                    {profileSuccess && (
                        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                            <p className="text-green-200 text-sm">Profile updated successfully!</p>
                        </div>
                    )}
                    {profileError && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <p className="text-red-200 text-sm">{profileError}</p>
                        </div>
                    )}

                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-200 mb-2">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={profileLoading}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50"
                        >
                            {profileLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Password Change Form */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <h2 className="text-xl font-semibold text-white mb-4">Change Password</h2>

                    {passwordSuccess && (
                        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                            <p className="text-green-200 text-sm">Password changed successfully!</p>
                        </div>
                    )}
                    {passwordError && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <p className="text-red-200 text-sm">{passwordError}</p>
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-4">
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
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50"
                        >
                            {passwordLoading ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
