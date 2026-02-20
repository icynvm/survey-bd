import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { useToast, Toast } from '@/components/ui';
import * as DB from '@/lib/db';
import { formatDate, formatTime, timeAgo, exportToCSV } from '@/lib/utils';
import type { Survey, SurveyResponse } from '@/types';

// Lazy load Chart to avoid SSR issues
const Doughnut = dynamic(() => import('react-chartjs-2').then(m => m.Doughnut), { ssr: false });

export default function ResultsPage() {
    const { user, t, lang, ready } = useApp();
    const router = useRouter();
    const toast = useToast();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [responses, setResponses] = useState<SurveyResponse[]>([]);
    const [tab, setTab] = useState<'summary' | 'individual'>('summary');
    const chartRegistered = useRef(false);

    useEffect(() => {
        if (!ready) return;
        if (!user) { router.replace('/'); return; }
        const isAdmin = user.role === 'admin';
        const allSurveys = DB.getSurveys();
        setSurveys(isAdmin ? allSurveys : allSurveys.filter(s => s.creatorId === user.id));
    }, [ready, user, router]);

    useEffect(() => {
        // Register Chart.js on client side only
        if (typeof window !== 'undefined' && !chartRegistered.current) {
            import('chart.js').then(({ Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend }) => {
                Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
                chartRegistered.current = true;
            });
        }
    }, []);

    useEffect(() => {
        if (selectedId) setResponses(DB.getResponsesBySurvey(selectedId));
    }, [selectedId]);

    if (!ready || !user) return null;

    const selectedSurvey = surveys.find(s => s.id === selectedId) ?? null;
    const avgTime = responses.length ? Math.round(responses.reduce((a, r) => a + r.completionTime, 0) / responses.length) : 0;
    const lastResponse = responses.length ? [...responses].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0] : null;

    const doExport = () => {
        if (!selectedSurvey) return;
        const headers = ['Respondent', 'Submitted At', ...selectedSurvey.questions.map(q => q.title)];
        const rows = responses.map(r => [r.respondentName || 'Anonymous', r.submittedAt, ...selectedSurvey.questions.map(q => { const a = r.answers[q.id]; return Array.isArray(a) ? a.join(', ') : String(a ?? ''); })]);
        exportToCSV(headers, rows, `survey-${selectedSurvey.id}-results.csv`);
        toast.show('CSV exported!');
    };

    const getChartData = (q: Survey['questions'][0]) => {
        if (!['multiple_choice', 'checkboxes', 'dropdown'].includes(q.type)) return null;
        const opts = q.options ?? [];
        const counts = opts.map(opt => responses.filter(r => { const a = r.answers[q.id]; return Array.isArray(a) ? a.includes(opt) : a === opt; }).length);
        const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#f97316', '#14b8a6'];
        return { labels: opts, datasets: [{ data: counts, backgroundColor: colors.slice(0, opts.length), borderWidth: 0 }] };
    };

    return (
        <>
            <Head><title>Results | SurveyBD</title></Head>
            <Layout active="results">
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: 'calc(100vh - var(--topbar-h) - 1px)', overflow: 'hidden' }}>
                    {/* Survey picker */}
                    <div style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', overflowY: 'auto', padding: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>RECENT SURVEYS</div>
                        {surveys.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}><div style={{ fontSize: 32 }}>📋</div><div style={{ fontSize: 13, marginTop: 8 }}>No surveys yet</div></div>
                        ) : surveys.map(sv => {
                            const rCount = DB.getResponsesBySurvey(sv.id).length;
                            const svTitle = lang === 'th' && sv.titleTh ? sv.titleTh : sv.title;
                            return (
                                <div key={sv.id} onClick={() => { setSelectedId(sv.id); setTab('summary'); }}
                                    style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${selectedId === sv.id ? 'var(--primary)' : 'var(--border)'}`, background: selectedId === sv.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svTitle || '(Untitled)'}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{rCount} responses · <span className={`badge ${sv.status === 'published' ? 'badge-success' : 'badge-muted'}`} style={{ fontSize: 10, padding: '2px 6px' }}>{sv.status}</span></div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Results area */}
                    <div style={{ overflowY: 'auto', padding: 24 }}>
                        {!selectedSurvey ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
                                <div style={{ fontSize: 18, fontWeight: 700 }}>{t('results.selectSurvey')}</div>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <div>
                                        <div style={{ fontSize: 22, fontWeight: 800 }}>{lang === 'th' && selectedSurvey.titleTh ? selectedSurvey.titleTh : selectedSurvey.title}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{responses.length} responses</div>
                                    </div>
                                    <button className="btn btn-secondary btn-sm" onClick={doExport}>📥 {t('results.exportCSV')}</button>
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
                                    {[{ icon: '📨', label: t('results.totalResponses'), value: responses.length },
                                    { icon: '⏱', label: t('results.avgTime'), value: formatTime(avgTime) },
                                    { icon: '🕐', label: t('results.lastResponse'), value: lastResponse ? timeAgo(lastResponse.submittedAt) : '—' }
                                    ].map((s, i) => (
                                        <div key={i} className="stat-card">
                                            <div className="stat-icon">{s.icon}</div>
                                            <div className="stat-value">{s.value}</div>
                                            <div className="stat-label">{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Tabs */}
                                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                                    {(['summary', 'individual'] as const).map(tabName => (
                                        <button key={tabName} onClick={() => setTab(tabName)} className={`btn ${tab === tabName ? 'btn-primary' : 'btn-secondary'} btn-sm`}>{tabName === 'summary' ? t('results.summary') : t('results.responses')}</button>
                                    ))}
                                </div>

                                {tab === 'summary' ? (
                                    responses.length === 0 ? (
                                        <div className="empty-state"><div className="empty-icon">📭</div><div className="empty-title">{t('results.noResponses')}</div><div className="empty-desc">{t('results.noResponsesDesc')}</div></div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                                            {selectedSurvey.questions.map(q => {
                                                const qTitle = lang === 'th' && q.titleTh ? q.titleTh : q.title;
                                                const chartData = getChartData(q);
                                                const textAnswers = responses.map(r => r.answers[q.id]).filter(Boolean);
                                                return (
                                                    <div key={q.id} className="card">
                                                        <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>{qTitle}</div>
                                                        {chartData ? (
                                                            <div style={{ maxHeight: 200, display: 'flex', justifyContent: 'center' }}>
                                                                <Doughnut data={chartData} options={{ plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 12 } } } }, maintainAspectRatio: false }} />
                                                            </div>
                                                        ) : q.type === 'rating' ? (
                                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                                                Avg: <strong style={{ color: 'var(--primary-light)', fontSize: 20 }}>
                                                                    {(textAnswers.reduce((a, v) => a + (v as number), 0) / Math.max(textAnswers.length, 1)).toFixed(1)}
                                                                </strong> / 5 ⭐
                                                            </div>
                                                        ) : q.type === 'scale' ? (
                                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                                                Avg: <strong style={{ color: 'var(--primary-light)', fontSize: 20 }}>
                                                                    {(textAnswers.reduce((a, v) => a + (v as number), 0) / Math.max(textAnswers.length, 1)).toFixed(1)}
                                                                </strong>
                                                            </div>
                                                        ) : q.type === 'yes_no' ? (
                                                            <div style={{ display: 'flex', gap: 12 }}>
                                                                {['yes', 'no'].map(v => {
                                                                    const count = textAnswers.filter(a => a === v).length;
                                                                    const pct = textAnswers.length ? Math.round(count / textAnswers.length * 100) : 0;
                                                                    return <div key={v} style={{ flex: 1, padding: 12, background: v === 'yes' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 8, textAlign: 'center' }}>
                                                                        <div style={{ fontSize: 24, fontWeight: 800 }}>{pct}%</div>
                                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v === 'yes' ? '✓ Yes' : '✗ No'} ({count})</div>
                                                                    </div>;
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                {textAnswers.slice(0, 5).map((a, i) => (
                                                                    <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 13, color: 'var(--text-secondary)' }}>"{String(a)}"</div>
                                                                ))}
                                                                {textAnswers.length > 5 && <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>+{textAnswers.length - 5} more</div>}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                ) : (
                                    <div className="card">
                                        <div className="table-wrap">
                                            <table>
                                                <thead><tr>
                                                    <th>{t('results.respondent')}</th>
                                                    {selectedSurvey.questions.map(q => <th key={q.id} style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</th>)}
                                                    <th>{t('results.submittedAt')}</th>
                                                </tr></thead>
                                                <tbody>{responses.map(r => (
                                                    <tr key={r.id}>
                                                        <td><strong>{r.respondentName || t('results.anonymous')}</strong></td>
                                                        {selectedSurvey.questions.map(q => <td key={q.id} style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{Array.isArray(r.answers[q.id]) ? (r.answers[q.id] as string[]).join(', ') : String(r.answers[q.id] ?? '—')}</td>)}
                                                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(r.submittedAt, lang)}</td>
                                                    </tr>
                                                ))}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <Toast messages={toast.messages} remove={toast.remove} />
            </Layout>
        </>
    );
}
