import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useApp } from '@/contexts/AppContext';
import { useToast, Toast } from '@/components/ui';
import * as DB from '@/lib/db';
import { uid } from '@/lib/utils';
import type { Survey, Question, AnswerValue } from '@/types';

export default function SurveyPage() {
    const { t, lang, ready } = useApp();
    const router = useRouter();
    const toast = useToast();
    const { id } = router.query;
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [submitted, setSubmitted] = useState(false);
    const [startTime] = useState(Date.now());

    useEffect(() => {
        if (!ready || !id) return;
        const sv = DB.getSurveyById(id as string);
        setSurvey(sv);
    }, [ready, id]);

    if (!ready) return null;
    if (!survey) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)', fontSize: 18 }}>Survey not found.</div>;
    if (survey.status !== 'published') return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}><div style={{ fontSize: 48 }}>🔒</div><div style={{ fontSize: 18, fontWeight: 700 }}>{survey.status === 'closed' ? t('survey.surveyClosed') : t('survey.surveyNotPublished')}</div></div>;

    const title = lang === 'th' && survey.titleTh ? survey.titleTh : survey.title;
    const desc = lang === 'th' && survey.descriptionTh ? survey.descriptionTh : survey.description;

    const setAnswer = (qId: string, val: AnswerValue) => {
        setAnswers(a => ({ ...a, [qId]: val }));
        setErrors(e => ({ ...e, [qId]: false }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, boolean> = {};
        let valid = true;
        survey.questions.forEach(q => {
            if (q.required) {
                const ans = answers[q.id];
                if (!ans || (Array.isArray(ans) && ans.length === 0) || ans === '') { newErrors[q.id] = true; valid = false; }
            }
        });
        setErrors(newErrors);
        if (!valid) { toast.show(t('survey.fillRequired'), 'warning'); return; }
        DB.saveResponse({ id: uid(), surveyId: survey.id, respondentId: null, respondentName: 'Anonymous', answers, submittedAt: new Date().toISOString(), completionTime: Math.round((Date.now() - startTime) / 1000) });
        setSubmitted(true);
    };

    const progress = survey.settings.showProgress ? Math.round(Object.keys(answers).length / Math.max(survey.questions.length, 1) * 100) : 0;

    const renderQuestion = (q: Question, i: number) => {
        const qtitle = lang === 'th' && q.titleTh ? q.titleTh : q.title;
        const options = lang === 'th' && q.optionsTh ? q.optionsTh : q.options ?? [];
        const err = errors[q.id];
        return (
            <div key={q.id} style={{ background: 'var(--bg-card)', border: `1px solid ${err ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 12, padding: 20, marginBottom: 16, transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.4 }}>{qtitle}{q.required && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}</div>
                        {err && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>⚠ {t('common.required')}</div>}
                    </div>
                </div>
                {q.type === 'multiple_choice' && options.map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1px solid ${answers[q.id] === opt ? 'var(--primary)' : 'var(--border)'}`, background: answers[q.id] === opt ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswer(q.id, opt)} style={{ accentColor: 'var(--primary)' }} />{opt}
                    </label>
                ))}
                {q.type === 'checkboxes' && options.map(opt => {
                    const checked = Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt);
                    return (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1px solid ${checked ? 'var(--primary)' : 'var(--border)'}`, background: checked ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                            <input type="checkbox" checked={checked} onChange={e => { const arr = Array.isArray(answers[q.id]) ? [...(answers[q.id] as string[])] : []; if (e.target.checked) arr.push(opt); else arr.splice(arr.indexOf(opt), 1); setAnswer(q.id, arr); }} style={{ accentColor: 'var(--primary)' }} />{opt}
                        </label>
                    );
                })}
                {q.type === 'short_text' && <input className="form-input" value={(answers[q.id] as string) ?? ''} onChange={e => setAnswer(q.id, e.target.value)} placeholder="Your answer..." />}
                {q.type === 'long_text' && <textarea className="form-input" rows={4} value={(answers[q.id] as string) ?? ''} onChange={e => setAnswer(q.id, e.target.value)} placeholder="Your answer..." style={{ resize: 'vertical' }} />}
                {q.type === 'rating' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[1, 2, 3, 4, 5].map(n => (
                            <button key={n} type="button" onClick={() => setAnswer(q.id, n)} style={{ fontSize: 32, background: 'none', border: 'none', cursor: 'pointer', opacity: (answers[q.id] as number) >= n ? 1 : 0.3, transition: 'opacity 0.15s', filter: (answers[q.id] as number) >= n ? 'drop-shadow(0 0 6px #f59e0b)' : 'none' }}>⭐</button>
                        ))}
                    </div>
                )}
                {q.type === 'scale' && (
                    <div>
                        <input type="range" min={q.minValue ?? 1} max={q.maxValue ?? 10} value={(answers[q.id] as number) ?? q.minValue ?? 1} onChange={e => setAnswer(q.id, parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                            <span>{q.minValue ?? 1} {q.minLabel && `(${q.minLabel})`}</span>
                            <span style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: 16 }}>{(answers[q.id] as number) ?? q.minValue ?? 1}</span>
                            <span>{q.maxValue ?? 10} {q.maxLabel && `(${q.maxLabel})`}</span>
                        </div>
                    </div>
                )}
                {q.type === 'dropdown' && (
                    <select className="form-input" value={(answers[q.id] as string) ?? ''} onChange={e => setAnswer(q.id, e.target.value)}>
                        <option value="">-- Select --</option>
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                )}
                {q.type === 'date' && <input className="form-input" type="date" value={(answers[q.id] as string) ?? ''} onChange={e => setAnswer(q.id, e.target.value)} />}
                {q.type === 'yes_no' && (
                    <div style={{ display: 'flex', gap: 12 }}>
                        {['yes', 'no'].map(v => (
                            <button key={v} type="button" onClick={() => setAnswer(q.id, v)} className={`btn ${answers[q.id] === v ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '12px', fontSize: 16, fontWeight: 700 }}>
                                {v === 'yes' ? `✓ ${t('common.yes')}` : `✗ ${t('common.no')}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Head><title>{title} | SurveyBD</title></Head>
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0 0 80px' }}>
                {/* Header bar */}
                <div style={{ background: 'rgba(7,7,20,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
                    <div className="sidebar-logo" style={{ width: 32, height: 32, fontSize: 16 }}>📊</div>
                    <span style={{ fontWeight: 700 }}>SurveyBD</span>
                </div>

                <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
                    {submitted ? (
                        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
                            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{t('survey.thankYou')}</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>{t('survey.thankYouDesc')}</p>
                        </div>
                    ) : (
                        <>
                            {survey.settings.showProgress && (
                                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 16, height: 6 }}>
                                    <div style={{ height: '100%', background: 'var(--gradient)', width: `${progress}%`, transition: 'width 0.3s ease', borderRadius: 8 }} />
                                </div>
                            )}
                            <div className="card" style={{ marginBottom: 20, padding: 28 }}>
                                <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{title}</h1>
                                {desc && <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{desc}</p>}
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>{survey.questions.length} {t('survey.questions')}</div>
                            </div>
                            <form onSubmit={handleSubmit}>
                                {survey.questions.map((q, i) => renderQuestion(q, i))}
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 16, fontSize: 16, fontWeight: 700 }}>
                                    🚀 {t('survey.submitResponse')}
                                </button>
                            </form>
                        </>
                    )}
                </div>
                <Toast messages={toast.messages} remove={toast.remove} />
            </div>
        </>
    );
}
