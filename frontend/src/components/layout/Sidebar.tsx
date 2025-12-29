'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Simulações', href: '/simulacoes' },
    { label: 'Lotes de Lançamento', href: '/lotes' },
    { label: 'Auditoria', href: '/auditoria' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside style={{ width: '280px', backgroundColor: 'var(--bg-sidebar)', height: '100vh', position: 'fixed', left: 0, top: 0, color: 'white', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                    SISTEMA <span style={{ color: 'var(--primary-500)' }}>TLP</span>
                </h1>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>Gestão Tributária</p>
            </div>

            <nav style={{ flex: 1, padding: '1.5rem 1rem' }}>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    style={{
                                        display: 'block',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: isActive ? 'var(--primary-700)' : 'transparent',
                                        color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                                        fontWeight: isActive ? 600 : 400,
                                        transition: 'all 0.2s',
                                        textDecoration: 'none'
                                    }}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        U
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Usuário Fiscal</p>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Auditor</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
