import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/ui';
import * as DB from '@/lib/db';
import { timeAgo, formatDate, uid } from '@/lib/utils';
import type { Survey, SurveyResponse, User, Question } from '@/types';
import { FiClipboard, FiMail, FiSmartphone, FiUsers, FiTrendingUp } from 'react-icons/fi';

export default function DashboardPage() {
    const { user, t, lang, ready } = useApp();
    const router = useRouter();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [responses, setResponses] = useState<SurveyResponse[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!ready) return;
        if (!user) { router.replace('/'); return; }

        const loadData = async () => {
            setLoading(true);
            const [s, r, u] = await Promise.all([
                DB.getSurveys(),
                DB.getResponses(),
                DB.getUsers()
            ]);
            setSurveys(s);
            setResponses(r);
            setUsers(u);
            setLoading(false);
        };

        loadData();
    }, [ready, user, router]);

    const handleDuplicate = async (e: React.MouseEvent, s: Survey) => {
        e.preventDefault();
        const newSurvey: Survey = {
            ...s,
            id: uid(),
            title: s.title ? `${s.title} (Copy)` : 'Copy',
            titleTh: s.titleTh ? `${s.titleTh} (สำเนา)` : '',
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: null,
            creatorId: user?.id || s.creatorId,
            questions: s.questions.map(q => ({ ...q, id: uid() }))
        };
        await DB.saveSurvey(newSurvey);
        const updated = await DB.getSurveys();
        setSurveys(updated);
    };

    if (!ready || !user || loading) return (
        <Layout active="dashboard">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div className="spinner"></div>
            </div>
        </Layout>
    );

    const isAdmin = user.role === 'admin';
    const isCreator = user.role === 'creator' || isAdmin;
    const mySurveys = isAdmin ? surveys : surveys.filter(s => s.creatorId === user.id);
    const activeSurveys = mySurveys.filter(s => s.status === 'published');
    const totalResponses = isAdmin ? responses.length : responses.filter(r => mySurveys.some(s => s.id === r.surveyId)).length;
    const recentSurveys = [...mySurveys].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentActivity = [...responses].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 6);

    const stats = [
        { icon: <FiClipboard size={24} />, color: 'rgba(99,102,241,0.15)', label: t('dashboard.totalSurveys'), value: mySurveys.length, change: '+2' },
        { icon: <FiMail size={22} />, color: 'rgba(16,185,129,0.15)', label: t('dashboard.totalResponses'), value: totalResponses, change: '+12' },
        { icon: <FiSmartphone size={22} />, color: 'rgba(6,182,212,0.15)', label: t('dashboard.activeSurveys'), value: activeSurveys.length, change: '' },
        isAdmin
            ? { icon: <FiUsers size={24} />, color: 'rgba(245,158,11,0.15)', label: t('dashboard.totalUsers'), value: users.length, change: '+1' }
            : { icon: <FiTrendingUp size={24} />, color: 'rgba(168,85,247,0.15)', label: t('dashboard.responseRate'), value: mySurveys.length ? `${Math.round(totalResponses / Math.max(mySurveys.length, 1) * 10)}%` : '0%', change: '' },
    ];

    return (
        <>
            <Head><title>Dashboard | SurveyBD</title></Head>
            <Layout active="dashboard">
                <div className="page-header">
                    <div>
                        <div className="page-title">{t('dashboard.title')}</div>
                        <div className="page-desc">{t('dashboard.welcome')}, <strong>{user.name}</strong> 👋</div>
                    </div>
                    {isCreator && <Link href="/builder" className="btn btn-primary">✨ {t('dashboard.createNew')}</Link>}
                </div>

                {/* Stats */}
                <div className="stat-grid">
                    {stats.map((s, i) => (
                        <div key={i} className="stat-card">
                            <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
                            <div className="stat-value">{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                            {s.change && <div className="stat-change up">↑ {s.change} {t('dashboard.thisMonth')}</div>}
                        </div>
                    ))}
                </div>

                {/* Recent grid */}
                <div className="dashboard-recent-grid">
                    {/* Surveys */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">{t('dashboard.recentSurveys')}</div>
                            {isCreator && <Link href="/builder" className="btn btn-secondary btn-sm">+ {t('common.add')}</Link>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {recentSurveys.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📋</div>
                                    <div className="empty-title">{t('survey.noSurveys')}</div>
                                    <div className="empty-desc">{t('survey.noSurveysDesc')}</div>
                                </div>
                            ) : recentSurveys.map(s => {
                                const title = lang === 'th' && s.titleTh ? s.titleTh : s.title;
                                const rCount = responses.filter(r => r.surveyId === s.id).length;
                                return (
                                    <Link key={s.id} href={`/builder?id=${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', textDecoration: 'none', transition: 'var(--transition)' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📋</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title || '(Untitled)'}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.questions?.length ?? 0} {t('survey.questions')} · {rCount} {t('survey.responses')}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                            <StatusBadge status={s.status} lang={lang} />
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(s.createdAt)}</span>
                                            <button
                                                onClick={(e) => handleDuplicate(e, s)}
                                                title="Duplicate Survey"
                                                style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary-light)'; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                                            >
                                                ⧉
                                            </button>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Activity */}
                    <div className="card">
                        <div className="card-header"><div className="card-title">Recent Activity</div></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {recentActivity.length === 0 ? (
                                <div className="empty-state" style={{ padding: 24 }}>
                                    <div style={{ fontSize: 32 }}>📭</div>
                                    <div className="empty-desc">{t('common.noData')}</div>
                                </div>
                            ) : recentActivity.map(r => {
                                const sv = surveys.find(s => s.id === r.surveyId);
                                const svTitle = sv ? (lang === 'th' && sv.titleTh ? sv.titleTh : sv.title) : 'Unknown';
                                return (
                                    <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>
                                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📨</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700 }}>{r.respondentName || 'Anonymous'}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svTitle}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{timeAgo(r.submittedAt)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    );
}
