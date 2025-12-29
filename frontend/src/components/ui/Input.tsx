import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = ({ label, error, ...props }: InputProps) => {
    return (
        <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {label && (
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {label}
                </label>
            )}
            <input
                style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: error ? '1px solid var(--error)' : '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    backgroundColor: '#fff',
                    color: 'var(--text-primary)'
                }}
                onFocus={(e) => {
                    if (!error) e.target.style.borderColor = 'var(--primary-500)';
                }}
                onBlur={(e) => {
                    if (!error) e.target.style.borderColor = '#e2e8f0';
                }}
                {...props}
            />
            {error && (
                <span style={{ fontSize: '0.75rem', color: 'var(--error)' }}>{error}</span>
            )}
        </div>
    );
};
