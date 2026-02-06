'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';
    const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(false);
    const shellStyle = {
        '--sidebar-width': isSidebarExpanded ? '260px' : '72px',
    } as React.CSSProperties;

    return (
        <AuthProvider>
            {isLoginPage ? (
                // Login page - no sidebar
                <>{children}</>
            ) : (
                // Protected pages - with sidebar
                <ProtectedRoute>
                    <div className="app-shell" style={shellStyle}>
                        <Sidebar
                            isExpanded={isSidebarExpanded}
                            onHover={setIsSidebarExpanded}
                        />
                        <main className="app-main">
                            {children}
                        </main>
                    </div>
                </ProtectedRoute>
            )}
        </AuthProvider>
    );
}
