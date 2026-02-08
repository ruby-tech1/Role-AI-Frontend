'use client';

interface SpinnerProps {
    className?: string;
    size?: number;
}

/**
 * Standard rotating spinner consistent with the project's monochrome theme.
 * Matches the arc style requested in the design reference.
 */
export function Spinner({ className = "h-5 w-5", size }: SpinnerProps) {
    const finalSize = size || '1.25rem';

    return (
        <svg
            className={`animate-spin ${className}`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={size ? { width: size, height: size } : undefined}
        >
            <path
                d="M12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.03904 16.4539"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

/**
 * Full-page loader with glassmorphism and blur effects.
 * Best used for initial page loads or blocking transitions.
 */
export function PageLoader({ message = "Loading..." }: { message?: string }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 blur-2xl bg-white/20 rounded-full animate-pulse"></div>
                    <Spinner className="h-12 w-12 text-white relative z-10" />
                </div>
                <span className="text-xl font-bold text-white tracking-widest uppercase animate-in fade-in duration-1000">
                    {message}
                </span>
            </div>
        </div>
    );
}

/**
 * Subtle bouncing dots for small inline loading states.
 */
export function LoadingDots({ className = "" }: { className?: string }) {
    return (
        <div className={`flex gap-1.5 ${className}`}>
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
        </div>
    );
}

/**
 * Loading text with optional subtext.
 */
export function LoadingText({ text, subtext }: { text: string; subtext?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-1">
                <Spinner className="h-4 w-4 text-white/40" />
                <span className="text-sm font-bold text-white/60 uppercase tracking-widest">{text}</span>
            </div>
            {subtext && <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{subtext}</p>}
        </div>
    );
}
