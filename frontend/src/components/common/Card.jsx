import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Card = ({ className, children, hoverEffect = false, ...props }) => {
    return (
        <div
            className={twMerge(
                'glass-card p-6 relative overflow-hidden group bg-bg-elevated/80',
                hoverEffect && 'hover:-translate-y-1 hover:shadow-xl hover:bg-bg-elevated',
                className
            )}
            {...props}
        >
            {/* Glow effect on hover */}
            <div className="absolute -inset-px bg-gradient-to-r from-primary-500/0 via-primary-500/0 to-primary-500/0 opacity-0 group-hover:opacity-100 group-hover:via-primary-500/10 transition-opacity duration-500 rounded-2xl pointer-events-none" />

            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};
