import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    className = '',
    disabled,
    ...props
}: ButtonProps) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
        outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm rounded-md',
        md: 'px-4 py-2 text-sm rounded-lg',
        lg: 'px-6 py-3 text-base rounded-lg',
    };

    // Mapeamento manual para styles inline caso Tailwind não esteja totalmente configurado ou desejemos garantir styles puros
    // Mas como o projeto foi criado com --no-tailwind, vamos usar estilos inline ou CSS modules.
    // Vou usar CSS-in-JS inline style mapeado por prop para garantir funcionamento imediato sem configurar CSS modules por enquanto.

    const getStyle = () => {
        let style: React.CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 500,
            cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
            opacity: disabled || isLoading ? 0.6 : 1,
            transition: 'all 0.2s',
            border: 'none',
        };

        // Size
        if (size === 'sm') { style = { ...style, padding: '0.375rem 0.75rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)' }; }
        if (size === 'md') { style = { ...style, padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)' }; }
        if (size === 'lg') { style = { ...style, padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: 'var(--radius-lg)' }; }

        // Variant
        if (variant === 'primary') { style = { ...style, backgroundColor: 'var(--primary-600)', color: 'white' }; }
        if (variant === 'secondary') { style = { ...style, backgroundColor: 'var(--primary-100)', color: 'var(--primary-900)' }; }
        if (variant === 'outline') { style = { ...style, backgroundColor: 'transparent', border: '1px solid #e2e8f0', color: 'var(--text-primary)' }; }
        if (variant === 'danger') { style = { ...style, backgroundColor: 'var(--error)', color: 'white' }; }

        return style;
    };

    return (
        <button style={getStyle()} disabled={disabled || isLoading} {...props}>
            {isLoading ? (
                <span style={{ marginRight: '0.5rem' }}>...</span>
            ) : null}
            {children}
        </button>
    );
};
