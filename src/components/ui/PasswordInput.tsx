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
            <label htmlFor={id} className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                {label}
            </label>
            <div className="relative group/input">
                <input
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full px-5 py-4 pr-14 bg-black/40 border border-white/5 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium ${className || ''}`}
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
