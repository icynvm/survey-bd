import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useApp } from '@/contexts/AppContext';
import { LangToggle } from '@/components/ui';
import * as Auth from '@/lib/auth';

const DEMO = [
    { role: '🔑 Admin', email: 'admin@survey.com', pw: 'admin123' },
    { role: '✏️ Creator', email: 'creator@survey.com', pw: 'creator123' },
    { role: '👤 Respondent', email: 'user@survey.com', pw: 'user123' },
];

export default function LoginPage() {
    const { user, t, ready } = useApp();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (ready && user) router.replace('/dashboard');
    }, [ready, user, router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        const result = Auth.login(email, password);
        if (result.success) {
            router.push('/dashboard');
        } else {
            setError(t('login.invalidCred')); setLoading(false);
        }
    };

    const fillDemo = (e: string, p: string) => { setEmail(e); setPassword(p); setError(''); };

    return (
        <>
            <Head><title>Login | SurveyBD</title></Head>
            <div className="auth-page">
                <div className="auth-bg">
                    <div className="auth-orb orb1" /><div className="auth-orb orb2" /><div className="auth-orb orb3" />
                </div>
                <div style={{ position: 'absolute', top: 16, right: 16 }}><LangToggle /></div>
                <div className="auth-card glass fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div className="sidebar-logo" style={{ width: 48, height: 48, fontSize: 24 }}>📊</div>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 800, background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('app.name')}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('app.tagline')}</div>
                        </div>
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{t('login.welcome')}</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>{t('login.subtitle')}</p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">{t('login.email')}</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>✉</span>
                                <input className="form-input" style={{ paddingLeft: 36 }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('login.email')} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('login.password')}</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔒</span>
                                <input className="form-input" style={{ paddingLeft: 36, paddingRight: 40 }} type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('login.password')} required />
                                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showPw ? '🙈' : '👁'}</button>
                            </div>
                        </div>
                        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{error}</div>}
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 700 }} disabled={loading}>
                            {loading ? t('common.loading') : t('login.loginBtn')}
                        </button>
                    </form>
                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>{t('login.demoAccounts')}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                            {DEMO.map(d => (
                                <button key={d.email} onClick={() => fillDemo(d.email, d.pw)} className="btn btn-secondary btn-sm" style={{ flexDirection: 'column', gap: 2, padding: '10px 8px', textAlign: 'center' }}>
                                    <div style={{ fontWeight: 700, fontSize: 12 }}>{d.role}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{d.email}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
