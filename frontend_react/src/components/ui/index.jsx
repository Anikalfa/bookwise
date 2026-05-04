import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function Button({ className, variant = 'primary', size = 'md', children, ...props }) {
    const variants = {
        primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus:ring-brand-500',
        secondary: 'bg-surface-alt text-brand-600 border border-brand-200 hover:bg-brand-50 focus:ring-brand-200',
        ghost: 'bg-transparent text-secondary hover:bg-primary/10 hover:text-primary focus:ring-secondary',
        outline: 'bg-transparent text-white border-2 border-white/50 hover:bg-white/10 active:bg-white/20',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs font-medium',
        md: 'px-6 py-3 text-sm font-semibold',
        lg: 'px-8 py-4 text-base font-bold',
        pill: 'px-6 py-2 rounded-full text-sm font-medium',
    };

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

export function Badge({ children, className, variant = 'default' }) {
    const variants = {
        default: 'bg-secondary/10 text-secondary',
        brand: 'bg-brand-100 text-brand-700',
        accent: 'bg-amber-100 text-amber-800',
        success: 'bg-emerald-100 text-emerald-800',
    };

    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider', variants[variant], className)}>
            {children}
        </span>
    );
}

export function Card({ children, className, hover = true, ...props }) {
    return (
        <div
            className={cn(
                'bg-surface-alt rounded-xl border border-border overflow-hidden transition-all duration-300',
                hover && 'hover:shadow-xl hover:shadow-brand-900/5 hover:-translate-y-1',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn('animate-pulse rounded-md bg-secondary/20', className)}
            {...props}
        />
    );
}
