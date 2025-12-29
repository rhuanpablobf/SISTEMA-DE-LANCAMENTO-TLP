import React from 'react';

export const Card = ({ children, className = '', style = {} }: { children: React.ReactNode; className?: string, style?: React.CSSProperties }) => {
    return (
        <div
            className={`card ${className}`}
            style={{
                backgroundColor: 'var(--bg-surface)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid rgba(0,0,0,0.05)',
                ...style
            }}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ children }: { children: React.ReactNode }) => (
    <div style={{ marginBottom: '1rem' }}>{children}</div>
);

export const CardTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{children}</h3>
);

export const CardContent = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
);
