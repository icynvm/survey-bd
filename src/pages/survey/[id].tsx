import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { useApp } from '@/contexts/AppContext';
import { useToast, Toast } from '@/components/ui';
import * as DB from '@/lib/db';
import { uid, DEFAULT_LIKERT_SCALE, DEFAULT_LIKERT_SCALE_TH } from '@/lib/utils';
import type { Survey, Question, AnswerValue, SurveyResponse } from '@/types';

export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' });
export const getStaticProps: GetStaticProps = async () => ({ props: {} });

type LikertAns = Record<string, string>;

export default function SurveyPage() {
    const { t, lang, ready } = useApp();
    const router = useRouter();
    const toast = useToast();
    const { id } = router.query;
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
    const [otherText, setOtherText] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [submitted, setSubmitted] = useState(false);
    const [startTime] = useState(Date.now());
    const [draftSaved, setDraftSaved] = useState(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [step, setStep] = useState(0); // 0=Intro, 1=Questions, 2=Done

    // Draft key for localStorage
    const draftKey = id ? `survey_draft_${id}` : null;

    useEffect(() => {
        if (!ready || !id) return;
        const load = async () => {
            setLoading(true);
            const sv = await DB.getSurveyById(id as string);
            if (!sv) { setNotFound(true); setLoading(false); return; }
            setSurvey(sv);
            // Load saved draft
            const key = `survey_draft_${id}`;
            try {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const draft = JSON.parse(raw);
                    if (draft.answers) setAnswers(draft.answers);
                    if (draft.otherText) setOtherText(draft.otherText);
                }
            } catch { /* ignore */ }
            setLoading(false);
        };
        load();
    }, [ready, id]);

    // Auto-save draft to localStorage (debounced)
    const scheduleDraftSave = useCallback((ans: Record<string, AnswerValue>, other: Record<string, string>) => {
        if (!draftKey) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            try {
                localStorage.setItem(draftKey, JSON.stringify({ answers: ans, otherText: other }));
                setDraftSaved(true);
                setTimeout(() => setDraftSaved(false), 2000);
            } catch { /* quota exceeded */ }
        }, 500);
    }, [draftKey]);


    if (!ready || loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
            <div className="spinner"></div>
        </div>
    );
    if (notFound) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12, color: 'var(--text-muted)', background: 'var(--bg-primary)' }}>
            <div style={{ fontSize: 64 }}>🔍</div><div style={{ fontSize: 20, fontWeight: 700 }}>{t('survey.surveyNotFound')}</div>
        </div>
    );
    if (!survey) return null; // Should not happen if notFound is handled
    if (survey.status !== 'published') return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12, background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 64 }}>🔒</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{survey.status === 'closed' ? t('survey.surveyClosed') : t('survey.surveyNotPublished')}</div>
        </div>
    );

    const title = lang === 'th' && survey.titleTh ? survey.titleTh : survey.title;
    const desc = lang === 'th' && survey.descriptionTh ? survey.descriptionTh : survey.description;

    const setAnswer = (qId: string, val: AnswerValue) => {
        setAnswers(a => {
            const updated = { ...a, [qId]: val };
            scheduleDraftSave(updated, otherText);
            return updated;
        });
        setErrors(e => ({ ...e, [qId]: false }));
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, boolean> = {};
        let valid = true;
        survey.questions.forEach(q => {
            if (q.type === 'section') return;
            if (q.required) {
                const ans = answers[q.id];
                if (q.type === 'likert') {
                    const rows = q.likertRows ?? [];
                    const likertAns = (ans as LikertAns) ?? {};
                    if (rows.some(r => !likertAns[r])) { newErrors[q.id] = true; valid = false; }
                } else if (!ans || (Array.isArray(ans) && (ans as string[]).length === 0) || ans === '') {
                    newErrors[q.id] = true; valid = false;
                }
            }
        });
        setErrors(newErrors);
        if (!valid) { toast.show(t('survey.fillRequired'), 'warning'); return; }
        // Merge in "Other" text
        const finalAnswers = { ...answers };
        Object.entries(otherText).forEach(([qId, txt]) => {
            if (txt) {
                const existing = finalAnswers[qId];
                if (Array.isArray(existing)) finalAnswers[qId] = [...(existing as string[]), `Other: ${txt}`];
                else finalAnswers[qId] = `Other: ${txt}`;
            }
        });
        const resp: SurveyResponse = {
            id: uid(),
            surveyId: survey.id,
            respondentId: null, // Assuming no user context for now, as per original code
            respondentName: 'Anonymous',
            answers: finalAnswers,
            submittedAt: new Date().toISOString(),
            completionTime: Math.round((Date.now() - startTime) / 1000),
        };
        await DB.saveResponse(resp);
        // Clear draft after successful submit
        if (draftKey) { try { localStorage.removeItem(draftKey); } catch { /* ignore */ } }
        setSubmitted(true);
        setStep(2); // Set step to 2 for completion screen
        window.scrollTo(0, 0);
    };

    const qCount = survey.questions.filter(q => q.type !== 'section').length;
    const progress = survey.settings.showProgress
        ? Math.round(Object.keys(answers).length / Math.max(qCount, 1) * 100) : 0;

    const renderQuestion = (q: Question, i: number) => {
        const qtitle = lang === 'th' && q.titleTh ? q.titleTh : q.title;
        const qdesc = lang === 'th' && q.descriptionTh ? q.descriptionTh : q.description;
        const options = (lang === 'th' && q.optionsTh ? q.optionsTh : q.options) ?? [];
        const err = errors[q.id];

        if (q.type === 'section') {
            return (
                <div key={q.id} style={{ margin: '40px 0 20px', padding: '12px 0', borderBottom: '2px solid var(--primary)', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, bottom: -2, width: 40, height: 2, background: 'var(--primary-light)' }}></div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{qtitle || '(Untitled Section)'}</h2>
                    {qdesc && <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>{qdesc}</p>}
                </div>
            );
        }

        const qNum = survey.questions.slice(0, i).filter(qu => qu.type !== 'section').length + 1;

        const scale = lang === 'th' ? (q.likertScaleTh ?? DEFAULT_LIKERT_SCALE_TH) : (q.likertScale ?? DEFAULT_LIKERT_SCALE);
        const rows = lang === 'th' ? (q.likertRowsTh ?? q.likertRows ?? []) : (q.likertRows ?? []);

        return (
            <div key={q.id} style={{ background: 'var(--bg-card)', border: `1px solid ${err ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                {/* Question header */}
                <div style={{ display: 'flex', gap: 10, marginBottom: qdesc ? 4 : 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{qNum}</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{qtitle}{q.required && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}</div>
                        {err && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 2 }}>⚠ {t('common.required')}</div>}
                    </div>
                </div>
                {/* Description label */}
                {qdesc && (
                    <div style={{ marginLeft: 36, marginBottom: 14, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, borderLeft: '3px solid var(--primary)' }}>
                        {qdesc}
                    </div>
                )}

                {/* ── Likert Scale ── */}
                {q.type === 'likert' && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12, borderBottom: '1px solid var(--border)', minWidth: 180 }}>Statement</th>
                                    {scale.map((s, si) => (
                                        <th key={si} style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--primary-light)', fontWeight: 600, fontSize: 11, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', minWidth: 72 }}>{s}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, ri) => {
                                    const likertAns = (answers[q.id] as LikertAns) ?? {};
                                    return (
                                        <tr key={ri} style={{ background: ri % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <div style={{ fontWeight: 500 }}>{row}</div>
                                                {q.likertRowHasOther?.[ri] && (
                                                    <div style={{ marginTop: 8 }}>
                                                        <input type="text" value={otherText[`${q.id}_${ri}`] ?? ''} onChange={e => {
                                                            const val = e.target.value;
                                                            setOtherText(o => {
                                                                const updated = { ...o, [`${q.id}_${ri}`]: val };
                                                                scheduleDraftSave(answers, updated);
                                                                return updated;
                                                            });
                                                        }} placeholder="Please specify..." style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', outline: 'none', fontSize: 13, padding: '6px 10px', fontFamily: 'inherit' }} />
                                                    </div>
                                                )}
                                            </td>
                                            {scale.map((s, si) => (
                                                <td key={si} style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <input type="radio" name={`${q.id}_${ri}`} value={s}
                                                            checked={likertAns[row] === s}
                                                            onChange={() => {
                                                                const updated: LikertAns = { ...likertAns, [row]: s };
                                                                setAnswer(q.id, updated as unknown as AnswerValue);
                                                            }}
                                                            style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }} />
                                                    </label>
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Multiple Choice ── */}
                {
                    q.type === 'multiple_choice' && (<>
                        {options.map((opt: string) => (
                            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1px solid ${answers[q.id] === opt ? 'var(--primary)' : 'var(--border)'}`, background: answers[q.id] === opt ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)', marginBottom: 8, cursor: 'pointer' }}>
                                <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswer(q.id, opt)} style={{ accentColor: 'var(--primary)' }} />{opt}
                            </label>
                        ))}
                        {q.hasOther && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1px solid ${answers[q.id] === '__other__' ? 'var(--primary)' : 'var(--border)'}`, marginBottom: 8 }}>
                                <input type="radio" name={q.id} value="__other__" checked={answers[q.id] === '__other__'} onChange={() => setAnswer(q.id, '__other__')} style={{ accentColor: 'var(--primary)', flexShrink: 0 }} />
                                <span style={{ flexShrink: 0 }}>Other:</span>
                                <input type="text" value={otherText[q.id] ?? ''} onChange={e => { setOtherText(o => ({ ...o, [q.id]: e.target.value })); setAnswer(q.id, '__other__'); }} placeholder="Please specify..." style={{ flex: 1, background: 'none', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontSize: 14, padding: '2px 0' }} />
                            </div>
                        )}
                    </>)
                }

                {/* ── Checkboxes ── */}
                {
                    q.type === 'checkboxes' && (<>
                        {options.map((opt: string) => {
                            const checked = Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt);
                            return (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1px solid ${checked ? 'var(--primary)' : 'var(--border)'}`, background: checked ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)', marginBottom: 8, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={checked} onChange={ev => { const arr = Array.isArray(answers[q.id]) ? [...(answers[q.id] as string[])] : []; if (ev.target.checked) arr.push(opt); else arr.splice(arr.indexOf(opt), 1); setAnswer(q.id, arr); }} style={{ accentColor: 'var(--primary)' }} />{opt}
                                </label>
                            );
                        })}
                        {q.hasOther && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8 }}>
                                <input type="checkbox" checked={!!(otherText[q.id])} onChange={e => { if (!e.target.checked) setOtherText(o => ({ ...o, [q.id]: '' })); }} style={{ accentColor: 'var(--primary)', flexShrink: 0 }} />
                                <span style={{ flexShrink: 0 }}>Other:</span>
                                <input type="text" value={otherText[q.id] ?? ''} onChange={e => setOtherText(o => ({ ...o, [q.id]: e.target.value }))} placeholder="Please specify..." style={{ flex: 1, background: 'none', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontSize: 14, padding: '2px 0' }} />
                            </div>
                        )}
                    </>)
                }

                {q.type === 'short_text' && <input className="form-input" value={(answers[q.id] as string) ?? ''} onChange={e => setAnswer(q.id, e.target.value)} placeholder="Your answer..." />}
                {q.type === 'long_text' && <textarea className="form-input" rows={4} value={(answers[q.id] as string) ?? ''} onChange={e => setAnswer(q.id, e.target.value)} placeholder="Your answer..." style={{ resize: 'vertical' }} />}
                {
                    q.type === 'rating' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[1, 2, 3, 4, 5].map(n => (
                                <button key={n} type="button" onClick={() => setAnswer(q.id, n)} style={{ fontSize: 32, background: 'none', border: 'none', cursor: 'pointer', opacity: (answers[q.id] as number) >= n ? 1 : 0.3, filter: (answers[q.id] as number) >= n ? 'drop-shadow(0 0 6px #f59e0b)' : 'none' }}>⭐</button>
                            ))}
                        </div>
                    )
                }
                {
                    q.type === 'scale' && (
                        <div>
                            <input type="range" min={q.minValue ?? 1} max={q.maxValue ?? 10} value={(answers[q.id] as number) ?? q.minValue ?? 1} onChange={e => setAnswer(q.id, parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                <span>{q.minValue ?? 1} {q.minLabel && `(${q.minLabel})`}</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: 16 }}>{(answers[q.id] as number) ?? q.minValue ?? 1}</span>
                                <span>{q.maxValue ?? 10} {q.maxLabel && `(${q.maxLabel})`}</span>
                            </div>
                        </div>
                    )
                }
                {
                    q.type === 'dropdown' && (<>
                        <select className="form-input" value={(answers[q.id] as string) === '__other__' ? '__other__' : ((answers[q.id] as string) ?? '')} onChange={e => {
                            if (e.target.value !== '__other__') setAnswer(q.id, e.target.value);
                            else setAnswer(q.id, '__other__');
                        }}>
                            <option value="">-- Select --</option>
                            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            {q.hasOther && <option value="__other__">Other (please specify)</option>}
                        </select>
                        {q.hasOther && answers[q.id] === '__other__' && (
                            <div style={{ marginTop: 8 }}>
                                <input type="text" value={otherText[q.id] ?? ''} onChange={e => { setOtherText(o => ({ ...o, [q.id]: e.target.value })); setAnswer(q.id, '__other__'); }} placeholder="Please specify..." style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontSize: 14, padding: '6px 0' }} />
                            </div>
                        )}
                    </>)
                }
                {q.type === 'date' && <input className="form-input" type="date" value={(answers[q.id] as string) ?? ''} onChange={e => setAnswer(q.id, e.target.value)} />}
                {
                    q.type === 'yes_no' && (
                        <div style={{ display: 'flex', gap: 12 }}>
                            {['yes', 'no'].map(v => (
                                <button key={v} type="button" onClick={() => setAnswer(q.id, v)} className={`btn ${answers[q.id] === v ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '12px', fontSize: 16, fontWeight: 700 }}>
                                    {v === 'yes' ? `✓ ${t('common.yes')}` : `✗ ${t('common.no')}`}
                                </button>
                            ))}
                        </div>
                    )
                }
            </div >
        );
    };

    return (
        <>
            <Head><title>{title} | SurveyBD</title></Head>
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0 0 80px' }}>
                <div style={{ background: 'rgba(7,7,20,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⬡</div>
                    <span style={{ fontWeight: 700 }}>SurveyBD</span>
                    {draftSaved && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', opacity: 0.7, transition: 'opacity 0.3s' }}>✓ Draft saved</span>}
                </div>
                <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
                    {submitted ? (
                        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
                            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{t('survey.thankYou')}</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>{t('survey.thankYouDesc')}</p>
                        </div>
                    ) : (<>
                        {survey.settings.showProgress && (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 16, height: 6 }}>
                                <div style={{ height: '100%', background: 'var(--gradient)', width: `${progress}%`, transition: 'width 0.3s ease' }} />
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
                    </>)}
                </div>
                <Toast messages={toast.messages} remove={toast.remove} />
            </div>
        </>
    );
}
