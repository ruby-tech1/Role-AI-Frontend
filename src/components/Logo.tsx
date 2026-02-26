import React from "react";

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export function Logo({ className = "", showText = true }: LogoProps) {
    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            <div className="relative flex h-8 w-8 items-center justify-center">
                {/* Animated glowing backdrop */}
                <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-sm animate-pulse" />
                {/* Core shape */}
                <svg
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="relative h-8 w-8 text-blue-500 dark:text-blue-400"
                >
                    {/* Top Diamond */}
                    <path
                        d="M16 2L4 9L16 16L28 9L16 2Z"
                        fill="currentColor"
                        fillOpacity="0.9"
                        className="transition-all duration-300 group-hover:fill-blue-400"
                    />
                    {/* Bottom base */}
                    <path
                        d="M4 23L16 30L28 23V9L16 16L4 9V23Z"
                        fill="currentColor"
                        fillOpacity="0.4"
                        className="transition-all duration-300 group-hover:fillOpacity-0.6"
                    />
                    {/* AI Core (pulsing dot) */}
                    <circle cx="16" cy="16" r="3" fill="#ffffff" className="animate-pulse shadow-glow" />
                </svg>
            </div>
            {showText && (
                <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50">
                    Role Ai
                </span>
            )}
        </div>
    );
}
