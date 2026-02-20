import React from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { LangToggle } from '@/components/ui';
import * as Auth from '@/lib/auth';

interface LayoutProps {
    children: React.ReactNode;
    active: 'dashboard' | 'builder' | 'results' | 'admin' | 'surveys';
    title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, active }) => {
    const { user, t } = useApp();
    if (!user) return null;

    const isAdmin = user.role === 'admin';
    const isCreator = user.role === 'creator' || isAdmin;
    const initial = (user.name[0] ?? 'U').toUpperCase();
    const roleLabel = t(`admin.roles.${user.role}`);

    const NavItem = ({ href, icon, label, name }: { href: string; icon: string; label: string; name: string }) => (
        <Link href={href} className={`nav-item${active === name ? ' active' : ''}`}>
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
        </Link>
    );

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-logo">📊</div>
                    <div>
                        <div className="sidebar-title">{t('app.name')}</div>
                        <div className="sidebar-subtitle">{t('app.tagline')}</div>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <NavItem href="/dashboard" icon="📊" label={t('nav.dashboard')} name="dashboard" />
                    {isCreator && <>
                        <NavItem href="/dashboard?tab=surveys" icon="📋" label={t(isAdmin ? 'nav.allSurveys' : 'nav.surveys')} name="surveys" />
                        <NavItem href="/builder" icon="✨" label={t('nav.create')} name="builder" />
                        <NavItem href="/results" icon="📈" label={t('nav.results')} name="results" />
                    </>}
                    {isAdmin && <>
                        <div className="nav-section-title" style={{ marginTop: 12 }}>Admin</div>
                        <NavItem href="/admin" icon="👥" label={t('nav.users')} name="admin" />
                    </>}
                </nav>
                <div className="sidebar-footer">
                    <div className="user-card">
                        <div className="user-avatar">{initial}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                            <div className="user-role">{roleLabel}</div>
                        </div>
                    </div>
                    <button
                        className="btn btn-danger btn-sm"
                        style={{ width: '100%', marginTop: 8 }}
                        onClick={() => Auth.logout()}
                    >
                        🚪 {t('nav.logout')}
                    </button>
                </div>
            </aside>
            <div className="main-content">
                <header className="topbar">
                    <div className="topbar-left">
                        <div className="topbar-title">{t('app.name')}</div>
                    </div>
                    <div className="topbar-right">
                        <LangToggle />
                        <div className="user-avatar" style={{ cursor: 'pointer' }}>{initial}</div>
                    </div>
                </header>
                <main className="page-content fade-in">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
