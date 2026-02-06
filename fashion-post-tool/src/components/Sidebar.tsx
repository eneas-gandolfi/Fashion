'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

// Menu organized by categories
const menuCategories = [
    {
        label: 'Conteúdo',
        items: [
            {
                label: 'Dashboard',
                href: '/',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                ),
            },
            {
                label: 'Criar Post',
                href: '/criar-post',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                ),
            },
            {
                label: 'Histórico',
                href: '/historico',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12,6 12,12 16,14" />
                    </svg>
                ),
            },
        ],
    },
    {
        label: 'Inteligência',
        items: [
            {
                label: 'Radar',
                href: '/radar',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        <polyline points="17 6 23 6 23 12" />
                    </svg>
                ),
            },
            {
                label: 'Descobertas',
                href: '/descobertas',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" />
                        <path d="M12 22V12" />
                        <path d="M12 12L4 7" />
                        <path d="M12 12l8-5" />
                    </svg>
                ),
            },
            {
                label: 'Inspirações',
                href: '/inspiracoes',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                ),
            },
        ],
    },
    {
        label: 'Sistema',
        items: [
            {
                hidden: true,
                label: 'Saúde',
                href: '/saude',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12h4l3 8 4-16 3 8h4" />
                    </svg>
                ),
            },
            {
                label: 'Tutorial',
                href: '/tutorial',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 17H20V5a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 5.5v14" />
                        <path d="M8 7h8" />
                        <path d="M8 11h6" />
                    </svg>
                ),
            },
            {
                label: 'Sobre',
                href: '/sobre',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                ),
            },
        ],
    },
];

interface SidebarProps {
    isExpanded: boolean;
    onHover: (expanded: boolean) => void;
}

export default function Sidebar({ isExpanded, onHover }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    };

    return (
        <aside
            className={`app-sidebar sidebar-shell fixed left-0 top-0 h-screen bg-[var(--surface)] border-r border-[var(--border)] flex flex-col transition-[width,padding] duration-300 ease-in-out z-50 overflow-hidden ${isExpanded ? 'w-64 px-6' : 'w-[72px] px-3'
                }`}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
        >
            {/* Logo */}
            <div className={`sidebar-logo flex items-center mb-6 overflow-hidden whitespace-nowrap px-0 transition-all duration-300 ${isExpanded ? 'justify-start' : 'justify-center'}`}>
                <div className={`flex items-center transition-all duration-300 ${isExpanded ? 'gap-3' : 'gap-0'}`}>
                    {/* Logo Mark */}
                    <div className="w-9 h-9 bg-[var(--secondary)] rounded-lg flex items-center justify-center text-white font-bold text-sm tracking-tighter shrink-0">
                        FC
                    </div>

                    {/* Logo Text */}
                    <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100 max-w-[200px] translate-x-0' : 'opacity-0 max-w-0 translate-x-2'}`}>
                        <h1 className="text-base font-bold text-[var(--text-primary)] leading-tight tracking-tight">
                            Fashion Center
                        </h1>
                        <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">
                            Marketing Hub
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation Categories */}
            <nav className="sidebar-nav flex-1 overflow-y-auto overflow-x-hidden">
                {menuCategories.map((category) => (
                    <div key={category.label} className="sidebar-group mb-5">
                        {/* Category Label */}
                        <div className={`sidebar-group-label px-3 mb-2 transition-all duration-200 overflow-hidden ${isExpanded ? 'opacity-100 h-auto delay-100' : 'opacity-0 h-0 delay-0'}`}>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                {category.label}
                            </span>
                        </div>

                        {/* Category Items */}
                        <ul className="sidebar-links flex flex-col gap-0.5">
                            {category.items.filter((item: any) => !item.hidden).map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`sidebar-link flex items-center h-10 px-3 rounded-lg transition-all duration-200 decoration-0 ${isActive
                                                ? 'bg-[var(--primary-light)] text-[var(--primary)] border-l-2 border-[var(--primary)] -ml-[2px] font-semibold'
                                                : 'text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--text-primary)] border-l-2 border-transparent'
                                                } ${isExpanded ? 'justify-start gap-3' : 'justify-center gap-0'}`}
                                        >
                                            <div className="w-8 flex items-center justify-center shrink-0">
                                                {item.icon}
                                            </div>
                                            <span className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${isExpanded ? 'opacity-100 max-w-[200px] translate-x-0 delay-100' : 'opacity-0 max-w-0 translate-x-2 delay-0'
                                                }`}>
                                                {item.label}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* User Section */}
            <div className={`mt-auto sidebar-footer bg-[var(--background)] rounded-xl transition-all duration-300 flex flex-col ${isExpanded ? 'p-3 items-stretch' : 'p-2 items-center'
                }`}>
                {/* User Email */}
                {user && (
                    <div className={`flex items-center ${isExpanded ? 'mb-2.5 pb-2.5 border-b border-[var(--border)] justify-start' : 'mb-2 justify-center'
                        }`}>
                        <div className={`flex items-center ${isExpanded ? 'gap-2' : 'gap-0'}`}>
                            <div className="w-7 h-7 bg-[var(--primary-light)] rounded-md flex items-center justify-center text-[var(--primary)] text-[11px] font-bold shrink-0">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[140px] delay-100' : 'opacity-0 max-w-0 delay-0'
                                }`}>
                                <p className="text-xs text-[var(--text-primary)] font-medium truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Connection Status */}
                <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 h-auto mb-2.5 pl-1 delay-100' : 'opacity-0 h-0 mb-0 delay-0'
                    }`}>
                    <div className="w-1.5 h-1.5 bg-[var(--success)] rounded-full" />
                    <span className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                        Conectado
                    </span>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleSignOut}
                    className={`flex items-center justify-center rounded-lg border border-[var(--border)] cursor-pointer text-[var(--text-secondary)] hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-all duration-200 ${isExpanded ? 'w-full h-9 px-3 gap-2 text-xs font-medium' : 'w-9 h-9 p-0 gap-0 text-[0px]'
                        }`}
                    title="Sair"
                >
                    <LogOut size={16} />
                    <span className={`transition-opacity duration-200 ${isExpanded ? 'block opacity-100 delay-100' : 'hidden opacity-0 delay-0'}`}>
                        Sair
                    </span>
                </button>
            </div>
        </aside>
    );
}
