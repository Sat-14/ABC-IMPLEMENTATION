import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Badge = ({ className, variant = 'default', children, ...props }) => {
    const variants = {
        default: 'bg-bg-tertiary text-text-secondary border-border-subtle',
        primary: 'bg-primary-500/10 text-primary-500 border-primary-500/20',
        success: 'bg-green-500/10 text-green-500 border-green-500/20',
        warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        danger: 'bg-red-500/10 text-red-500 border-red-500/20',
    };

    return (
        <span
            className={twMerge(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};
