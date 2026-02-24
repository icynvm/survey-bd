import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApp } from '@/contexts/AppContext';
import { LangToggle, RoleBadge } from './ui';
import { FiMenu, FiLogOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface LayoutProps { children: React.ReactNode; active?: string; }

const Layout: React.FC<LayoutProps> = ({ children, active }) => {
    const { user, t, lang, logout } = useApp();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);

    if (!user) return null;

    const isAdmin = user.role === 'admin';
    const isCreator = user.role === 'creator' || isAdmin;

    const handleLogout = () => { logout(); router.push('/'); };

    const NavItem = ({ href, icon, label, name }: { href: string; icon: string; label: string; name: string }) => (
        <Link href={href} className={`nav-item ${active === name ? 'active' : ''}`}>
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
        </Link>
    );

    return (
        <div className={`app-layout ${desktopCollapsed ? 'sidebar-collapsed' : ''}`}>
            {sidebarOpen && <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${desktopCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-logo" style={{ background: 'rgba(255,255,255,0.08)', fontSize: 18, width: desktopCollapsed ? 32 : 36, height: desktopCollapsed ? 32 : 36 }}>⬡</div>
                    {!desktopCollapsed && (
                        <div>
                            <div className="sidebar-title">{t('app.name')}</div>
                            <div className="sidebar-subtitle">{t('app.tagline')}</div>
                        </div>
                    )}
                </div>
                <nav className="sidebar-nav">
                    <NavItem href="/dashboard" icon="▣" label={t('nav.dashboard')} name="dashboard" />
                    {isCreator && <>
                        <NavItem href="/builder" icon="□" label={isAdmin ? t('nav.allSurveys') : t('nav.surveys')} name="surveys" />
                        <NavItem href="/builder" icon="+" label={t('nav.create')} name="builder" />
                        <NavItem href="/results" icon="≡" label={t('nav.results')} name="results" />
                    </>}
                    {isAdmin && <>
                        <div className="nav-section-title">Admin</div>
                        <NavItem href="/admin" icon="⊙" label={t('nav.users')} name="admin" />
                    </>}
                </nav>
                <div className="sidebar-footer">
                    <div className="user-card">
                        <div className="user-avatar">{user.name[0].toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0, display: desktopCollapsed ? 'none' : 'block' }}>
                            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                            <RoleBadge role={user.role} lang={lang} />
                        </div>
                        <button onClick={handleLogout} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiLogOut />
                        </button>
                    </div>
                </div>
            </aside>
            <div className="main-content">
                <header className="topbar">
                    <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="hide-on-mobile btn btn-secondary btn-sm" onClick={() => setDesktopCollapsed(!desktopCollapsed)} style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {desktopCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
                        </button>
                        <button className="show-on-mobile btn btn-secondary btn-sm" onClick={() => setSidebarOpen(true)} style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiMenu size={18} />
                        </button>
                        <div className="topbar-title">{t(`nav.${active ?? 'dashboard'}`)}</div>
                    </div>
                    <div className="topbar-right">
                        <LangToggle />
                    </div>
                </header>
                <main className="page-content fade-in">{children}</main>
            </div>
        </div>
    );
};

export default Layout;
