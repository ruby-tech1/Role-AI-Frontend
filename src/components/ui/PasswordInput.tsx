'use client';

import { useState, InputHTMLAttributes } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
}

export function PasswordInput({ label, id, className, ...props }: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-200 mb-2">
                {label}
            </label>
            <div className="relative group/input">
                <input
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full px-4 py-3 pr-14 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition ${className || ''}`}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300 group-hover/input:text-white/40"
                >
                    {showPassword ? (
                        <FiEyeOff className="w-5 h-5" />
                    ) : (
                        <FiEye className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    );
}
