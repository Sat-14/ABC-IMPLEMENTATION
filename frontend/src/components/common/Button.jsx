import React from 'react';
import { Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export const Button = React.forwardRef(({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    disabled,
    ...props
}, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

    const variants = {
        primary: 'bg-gradient-to-r from-primary-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 border-transparent',
        secondary: 'bg-bg-tertiary text-text-primary hover:bg-bg-secondary border border-border-subtle hover:border-border-hover',
        outline: 'bg-transparent border border-border-subtle text-text-secondary hover:border-primary-500 hover:text-primary-500',
        ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
        danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30',
    };

    const sizes = {
        sm: 'text-xs px-3 py-1.5 gap-1.5',
        md: 'text-sm px-5 py-2.5 gap-2',
        lg: 'text-base px-6 py-3 gap-2.5',
        icon: 'p-2.5',
    };

    return (
        <button
            ref={ref}
            className={twMerge(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = 'Button';
