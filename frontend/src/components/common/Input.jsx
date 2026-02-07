import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Input = React.forwardRef(({ className, label, error, icon: Icon, ...props }, ref) => {
    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <label className="block text-sm font-medium text-text-secondary ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary-500 transition-colors">
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                <input
                    ref={ref}
                    className={twMerge(
                        'w-full bg-bg-secondary text-text-primary rounded-xl border border-border-subtle px-4 py-2.5 outline-none transition-all duration-200 placeholder:text-text-tertiary focus:border-primary-500/50 focus:bg-bg-elevated focus:ring-1 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed',
                        Icon && 'pl-10',
                        error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50',
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-xs text-red-500 ml-1 mt-1 animate-in slide-in-from-top-1 fade-in duration-200">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export const Select = React.forwardRef(({ className, label, error, icon: Icon, children, ...props }, ref) => {
    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <label className="block text-sm font-medium text-text-secondary ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary-500 transition-colors">
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                <select
                    ref={ref}
                    className={twMerge(
                        'w-full bg-bg-secondary text-text-primary rounded-xl border border-border-subtle px-4 py-2.5 outline-none transition-all duration-200 focus:border-primary-500/50 focus:bg-bg-elevated focus:ring-1 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed appearance-none',
                        Icon && 'pl-10',
                        error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50',
                        className
                    )}
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
            </div>
            {error && (
                <p className="text-xs text-red-500 ml-1 mt-1 animate-in slide-in-from-top-1 fade-in duration-200">{error}</p>
            )}
        </div>
    );
});

Select.displayName = 'Select';
