import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useApp } from '@/contexts/AppContext';
import { useToast, Toast, ConfirmModal, useConfirm, StatusBadge } from '@/components/ui';
import { LangToggle } from '@/components/ui';
import { QUESTION_TYPE_INFO, uid, DEFAULT_LIKERT_SCALE, DEFAULT_LIKERT_SCALE_TH } from '@/lib/utils';
import * as DB from '@/lib/db';
import * as Auth from '@/lib/auth';
import type { Survey, Question, QuestionType } from '@/types';
import { FiGrid, FiList, FiCheckSquare, FiType, FiAlignLeft, FiStar, FiSliders, FiChevronDown, FiCalendar, FiToggleRight, FiMenu, FiX } from 'react-icons/fi';

const ICON_MAP: Record<QuestionType, React.ReactNode> = {
    likert: <FiGrid size={16} />,
    multiple_choice: <FiList size={16} />,
    checkboxes: <FiCheckSquare size={16} />,
    short_text: <FiType size={16} />,
    long_text: <FiAlignLeft size={16} />,
    rating: <FiStar size={16} />,
    scale: <FiSliders size={16} />,
    dropdown: <FiChevronDown size={16} />,
    date: <FiCalendar size={16} />,
    yes_no: <FiToggleRight size={16} />
};

const Q_TYPES: QuestionType[] = [
    'likert', 'multiple_choice', 'checkboxes', 'short_text', 'long_text',
    'rating', 'scale', 'dropdown', 'date', 'yes_no',
];

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
    borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
};

export default function BuilderPage() {
    const { user, t, lang, ready } = useApp();
    const router = useRouter();
    const toast = useToast();
    const { confirmState, confirm, onConfirm, onCancel } = useConfirm();
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [selectedQId, setSelectedQId] = useState<string | null>(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const dragSrcRef = useRef<string | null>(null);

    const newSurvey = useCallback((): Survey => ({
        id: uid(), title: '', titleTh: '', description: '', descriptionTh: '',
        creatorId: user?.id ?? '', status: 'draft', questions: [],
        settings: { allowMultiple: false, showProgress: true, anonymous: false },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), publishedAt: null,
    }), [user]);

    useEffect(() => {
        if (!ready) return;
        if (!user) { router.replace('/'); return; }
        if (!Auth.can(user, 'create_survey')) { router.replace('/dashboard'); return; }
        const id = router.query.id as string | undefined;
        setSurvey(id ? (DB.getSurveyById(id) ?? newSurvey()) : newSurvey());
    }, [ready, user, router.query.id, router, newSurvey]);

    /* ── Unsaved changes prompt ── */
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) { e.preventDefault(); e.returnValue = ''; }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    useEffect(() => {
        const handleRouteChange = (url: string) => {
            if (isDirty) {
                if (!window.confirm("You have unsaved changes! Are you sure you want to leave without saving?")) {
                    router.events.emit('routeChangeError');
                    throw 'routeChange aborted.';
                }
            }
        };
        router.events.on('routeChangeStart', handleRouteChange);
        return () => router.events.off('routeChangeStart', handleRouteChange);
    }, [isDirty, router.events]);

    if (!ready || !user || !survey) return null;

    const updateSurvey = (upd: Partial<Survey>) => { setSurvey(s => s ? { ...s, ...upd } : s); setIsDirty(true); };
    const updateQ = (qId: string, upd: Partial<Question>) => {
        setSurvey(s => s ? { ...s, questions: s.questions.map(q => q.id === qId ? { ...q, ...upd } : q) } : s);
        setIsDirty(true);
    };
    const selectedQ = survey.questions.find(q => q.id === selectedQId) ?? null;

    const addQuestion = (type: QuestionType) => {
        const q: Question = {
            id: uid(), type, title: '', titleTh: '', description: '', descriptionTh: '', required: false,
            ...(['multiple_choice', 'checkboxes', 'dropdown'].includes(type)
                ? { options: ['Option 1', 'Option 2', 'Option 3'], optionsTh: ['ตัวเลือก 1', 'ตัวเลือก 2', 'ตัวเลือก 3'], hasOther: false }
                : {}),
            ...(type === 'scale' ? { minValue: 1, maxValue: 10, minLabel: 'Low', maxLabel: 'High' } : {}),
            ...(type === 'likert' ? {
                likertRows: ['Sub-question 1', 'Sub-question 2'],
                likertRowsTh: ['คำถามย่อย 1', 'คำถามย่อย 2'],
                likertScale: [...DEFAULT_LIKERT_SCALE],
                likertScaleTh: [...DEFAULT_LIKERT_SCALE_TH],
            } : {}),
        };
        setSurvey(s => s ? { ...s, questions: [...s.questions, q] } : s);
        setSelectedQId(q.id);
        setIsDirty(true);
    };

    const deleteQ = async (id: string) => {
        const ok = await confirm('Delete this question?');
        if (ok) {
            setSurvey(s => s ? { ...s, questions: s.questions.filter(q => q.id !== id) } : s);
            if (selectedQId === id) setSelectedQId(null);
            setIsDirty(true);
        }
    };

    const duplicateQ = (id: string) => {
        const q = survey.questions.find(q => q.id === id); if (!q) return;
        const copy = { ...JSON.parse(JSON.stringify(q)), id: uid() };
        const idx = survey.questions.findIndex(q => q.id === id);
        setSurvey(s => s ? { ...s, questions: [...s.questions.slice(0, idx + 1), copy, ...s.questions.slice(idx + 1)] } : s);
        setIsDirty(true);
        toast.show('Question duplicated');
    };

    const saveSurvey = () => {
        const updated = { ...survey, title: survey.title || t('builder.untitled'), updatedAt: new Date().toISOString() };
        DB.saveSurvey(updated); setSurvey(updated); toast.show(t('builder.saveSuccess'));
        setIsDirty(false);
        if (!router.query.id) router.replace(`/builder?id=${updated.id}`, undefined, { shallow: true });
    };

    const publishSurvey = async () => {
        if (survey.status === 'published') {
            const ok = await confirm(t('survey.closeConfirm'));
            if (ok) { const upd = { ...survey, status: 'closed' as const, updatedAt: new Date().toISOString() }; DB.saveSurvey(upd); setSurvey(upd); setIsDirty(false); toast.show('Survey closed'); }
        } else {
            if (!survey.questions.length) { toast.show('Add at least one question before publishing!', 'warning'); return; }
            if (!survey.title) { toast.show('Survey needs a title!', 'warning'); return; }
            const ok = await confirm(t('survey.publishConfirm'));
            if (ok) { const upd = { ...survey, status: 'published' as const, publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; DB.saveSurvey(upd); setSurvey(upd); setIsDirty(false); toast.show('Survey published!'); }
        }
    };

    const handleDeleteSurvey = async () => {
        const ok = await confirm('Are you sure you want to delete this entire survey? This action cannot be undone.');
        if (ok) {
            DB.deleteSurvey(survey.id);
            toast.show('Survey deleted.', 'success');
            router.push('/dashboard');
        }
    };

    const surveyUrl = typeof window !== 'undefined' ? `${window.location.origin}/survey/${survey.id}` : '';
    /* ── Settings panel content ── */
    const renderSettings = () => {
        if (!selectedQ) return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👆</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t('builder.clickToEdit')}</div>
            </div>
        );

        const isChoice = ['multiple_choice', 'checkboxes', 'dropdown'].includes(selectedQ.type);

        return (
            <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {ICON_MAP[selectedQ.type]} {QUESTION_TYPE_INFO[selectedQ.type].en}
                </div>

                {/* Title */}
                <div className="form-group">
                    <label className="form-label">Question Title (EN)</label>
                    <textarea style={inputStyle} rows={2} value={selectedQ.title} onChange={e => updateQ(selectedQ.id, { title: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">Question Title (TH)</label>
                    <textarea style={inputStyle} rows={2} value={selectedQ.titleTh} onChange={e => updateQ(selectedQ.id, { titleTh: e.target.value })} />
                </div>

                {/* Description / Label */}
                <div className="form-group">
                    <label className="form-label">Description / Label (EN) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>optional</span></label>
                    <textarea style={inputStyle} rows={2} value={selectedQ.description ?? ''} placeholder="Extra instructions shown below title..." onChange={e => updateQ(selectedQ.id, { description: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">Description / Label (TH)</label>
                    <textarea style={inputStyle} rows={2} value={selectedQ.descriptionTh ?? ''} placeholder="คำอธิบายเพิ่มเติม..." onChange={e => updateQ(selectedQ.id, { descriptionTh: e.target.value })} />
                </div>

                {/* Options for choice types */}
                {isChoice && (
                    <div className="form-group">
                        <label className="form-label">Options</label>
                        {(selectedQ.options ?? []).map((opt, i) => (
                            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                                <input style={{ ...inputStyle, flex: 1 }} value={opt} onChange={e => { const o = [...(selectedQ.options ?? [])]; o[i] = e.target.value; updateQ(selectedQ.id, { options: o }); }} />
                                <button onClick={() => { const o = (selectedQ.options ?? []).filter((_, j) => j !== i); const oth = (selectedQ.optionsTh ?? []).filter((_, j) => j !== i); updateQ(selectedQ.id, { options: o, optionsTh: oth }); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>×</button>
                            </div>
                        ))}
                        {/* Other toggle */}
                        <label className="form-check" style={{ marginTop: 10 }}>
                            <input type="checkbox" checked={!!selectedQ.hasOther} onChange={e => updateQ(selectedQ.id, { hasOther: e.target.checked })} />
                            <span style={{ fontSize: 13 }}>Enable "Other (please specify)" option</span>
                        </label>
                    </div>
                )}

                {/* Scale */}
                {selectedQ.type === 'scale' && (['minValue', 'maxValue', 'minLabel', 'maxLabel'] as const).map(field => (
                    <div key={field} className="form-group">
                        <label className="form-label">{field}</label>
                        <input style={inputStyle} type={field.includes('Value') ? 'number' : 'text'} value={(selectedQ as unknown as Record<string, string | number | undefined>)[field] ?? ''} onChange={e => updateQ(selectedQ.id, { [field]: field.includes('Value') ? parseInt(e.target.value) : e.target.value })} />
                    </div>
                ))}

                {/* Likert */}
                {selectedQ.type === 'likert' && (<>
                    <div className="form-group">
                        <label className="form-label">Scale Labels (comma-separated)</label>
                        <input style={inputStyle} value={(selectedQ.likertScale ?? DEFAULT_LIKERT_SCALE).join(', ')} onChange={e => updateQ(selectedQ.id, { likertScale: e.target.value.split(',').map(s => s.trim()) })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Sub-Questions (rows)</label>
                        {(selectedQ.likertRows ?? []).map((row, i) => (
                            <div key={i} style={{ marginBottom: 12, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                                    <input style={{ ...inputStyle, flex: 1 }} value={row} onChange={e => { const r = [...(selectedQ.likertRows ?? [])]; r[i] = e.target.value; updateQ(selectedQ.id, { likertRows: r }); }} />
                                    <button onClick={() => {
                                        const r = (selectedQ.likertRows ?? []).filter((_, j) => j !== i);
                                        const ho = (selectedQ.likertRowHasOther ?? []).filter((_, j) => j !== i);
                                        updateQ(selectedQ.id, { likertRows: r, likertRowHasOther: ho });
                                    }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 18 }}>×</button>
                                </div>
                                <label className="form-check" style={{ marginTop: 4 }}>
                                    <input type="checkbox" checked={!!(selectedQ.likertRowHasOther ?? [])[i]} onChange={e => {
                                        const ho = [...(selectedQ.likertRowHasOther ?? [])];
                                        ho[i] = e.target.checked;
                                        updateQ(selectedQ.id, { likertRowHasOther: ho });
                                    }} />
                                    <span style={{ fontSize: 12 }}>Add 'Please specify' field</span>
                                </label>
                            </div>
                        ))}
                        <button onClick={() => {
                            const q = selectedQ; const n = (q.likertRows ?? []).length + 1;
                            updateQ(q.id, {
                                likertRows: [...(q.likertRows ?? []), `Sub-question ${n}`],
                                likertRowsTh: [...(q.likertRowsTh ?? []), `คำถามย่อย ${n}`],
                                likertRowHasOther: [...(q.likertRowHasOther ?? []), false],
                            });
                        }} style={{ color: 'var(--primary-light)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', marginTop: 4 }}>+ Add Row</button>
                    </div>
                </>)}

                <label className="form-check">
                    <input type="checkbox" checked={selectedQ.required} onChange={e => updateQ(selectedQ.id, { required: e.target.checked })} />
                    <span>Required</span>
                </label>
                <div className="divider" />
                <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => deleteQ(selectedQ.id)}>🗑 Delete Question</button>
            </div>
        );
    };

    if (!survey) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <>
            <Head><title>{survey.title || t('builder.untitled')} | Builder | SurveyBD</title></Head>
            <div className="app-layout">
                <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-brand">
                        <div className="sidebar-logo" style={{ background: 'rgba(255,255,255,0.08)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⬡</div>
                        <div><div className="sidebar-title">{t('app.name')}</div></div>
                        <button className="show-on-mobile" onClick={() => setSidebarOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 24, padding: 4 }}><FiX /></button>
                    </div>
                    <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Question Types</div>
                        {Q_TYPES.map(type => {
                            const info = QUESTION_TYPE_INFO[type];
                            return (
                                <button key={type} onClick={() => addQuestion(type)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%', marginBottom: 6 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{ICON_MAP[type]}</div>
                                    <div style={{ flex: 1 }}>                                     <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{lang === 'th' ? info.th : info.en}</div>
                                        {type === 'likert' && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>5-point satisfaction table</div>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="sidebar-footer">
                        <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => router.push('/dashboard')}>← Dashboard</button>
                    </div>
                </aside>
                <div className="main-content">
                    <header style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', padding: '0 20px', height: 'var(--topbar-h)', background: 'rgba(7,7,20,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button className="show-on-mobile" onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 24, padding: '4px 8px 4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><FiMenu /></button>
                            <span style={{ fontSize: 15, fontWeight: 700 }}>{survey.title || t('builder.untitled')}</span>
                            <StatusBadge status={survey.status} lang={lang} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                            <div className="hide-on-mobile"><LangToggle /></div>
                            <button className="btn btn-secondary btn-sm" onClick={saveSurvey}>💾<span className="hide-on-mobile"> Save</span></button>
                            <button className="btn btn-primary btn-sm" onClick={publishSurvey}>🚀<span className="hide-on-mobile"> {survey.status === 'published' ? 'Close' : 'Publish'}</span></button>
                            {survey.status === 'published' && <button className="btn btn-secondary btn-sm hide-on-mobile" onClick={() => setShareOpen(true)}>🔗 Share</button>}

                            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
                            <button
                                className="btn btn-sm"
                                onClick={handleDeleteSurvey}
                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                            >
                                🗑 Delete
                            </button>
                        </div>
                    </header>
                    {/* Add overlay to close sidebar when clicking outside on mobile */}
                    {sidebarOpen && <div className="show-on-mobile" onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }} />}

                    <div className="builder-layout">
                        {/* Editor Layout on Desktop (flex row), stacks on Mobile (flex col) */}
                        {/* Canvas */}
                        <div className="builder-canvas">
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                                <input value={survey.title} onChange={e => updateSurvey({ title: e.target.value })} placeholder="Survey Title (EN)" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 28, fontWeight: 800, width: '100%', padding: 0, outline: 'none' }} />
                                <textarea value={survey.description} onChange={e => updateSurvey({ description: e.target.value })} placeholder="Description / Instructions" rows={2} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 15, width: '100%', padding: 0, marginTop: 8, resize: 'none', fontFamily: 'inherit', outline: 'none' }} />
                            </div>
                            {survey.questions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No questions yet</div>
                                    <div style={{ fontSize: 13 }}>Click a question type on the left to add your first question</div>
                                </div>
                            ) : survey.questions.map((q, i) => {
                                const info = QUESTION_TYPE_INFO[q.type];
                                const title = lang === 'th' && q.titleTh ? q.titleTh : q.title || `Question ${i + 1}`;
                                const desc = lang === 'th' && q.descriptionTh ? q.descriptionTh : q.description;
                                return (
                                    <div
                                        key={q.id}
                                        draggable
                                        onDragStart={() => { dragSrcRef.current = q.id; }}
                                        onDragEnd={e => { e.currentTarget.style.opacity = '1'; }}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={() => {
                                            if (!dragSrcRef.current || dragSrcRef.current === q.id) return;
                                            const src = dragSrcRef.current;
                                            setSurvey(s => { if (!s) return s; const qs = [...s.questions]; const si = qs.findIndex(x => x.id === src); const ti = qs.findIndex(x => x.id === q.id); const [r] = qs.splice(si, 1); qs.splice(ti, 0, r); return { ...s, questions: qs }; });
                                            dragSrcRef.current = null;
                                        }}
                                        onClick={() => { setSelectedQId(q.id); setSettingsOpen(true); }}
                                        style={{
                                            background: selectedQId === q.id ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                                            border: `1px solid ${selectedQId === q.id ? 'var(--primary)' : 'var(--border)'}`,
                                            borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: '16px',
                                            cursor: 'pointer', position: 'relative', transition: 'var(--transition)',
                                            boxShadow: selectedQId === q.id ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : '0 4px 20px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                            <span style={{ color: 'var(--text-muted)', cursor: 'grab', fontSize: 14, marginTop: 2 }}>⠿</span>
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 15, fontWeight: 600 }}>{title}{q.required && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}</div>
                                                {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    {ICON_MAP[q.type]} {lang === 'th' ? info.th : info.en}{q.type === 'likert' && ` · ${(q.likertRows ?? []).length} rows`}{q.hasOther && ' · +Other'}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={e => { e.stopPropagation(); duplicateQ(q.id); }} style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-card-hover)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>⧉</button>
                                                <button onClick={e => { e.stopPropagation(); deleteQ(q.id); }} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>🗑</button>
                                            </div>
                                        </div>
                                        {/* Likert preview */}
                                        {q.type === 'likert' && (q.likertRows ?? []).length > 0 && (
                                            <div style={{ marginTop: 10, marginLeft: 36, padding: 10, background: 'rgba(99,102,241,0.06)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.15)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sub-questions</span>
                                                    <div style={{ display: 'flex', gap: 6 }}>{(q.likertScale ?? DEFAULT_LIKERT_SCALE).map((s, si) => <span key={si} style={{ fontSize: 10, color: 'var(--primary-light)', whiteSpace: 'nowrap' }}>{s}</span>)}</div>
                                                </div>
                                                {(q.likertRows ?? []).map((row, ri) => <div key={ri} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '3px 0', borderTop: ri > 0 ? '1px solid var(--border)' : 'none' }}>• {row}</div>)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {/* Settings panel */}
                    {settingsOpen && <div className="sidebar-overlay open show-on-mobile" onClick={() => setSettingsOpen(false)} />}
                    <div className={`builder-settings ${settingsOpen ? 'open' : ''}`}>
                        <div className="show-on-mobile" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                            <button className="icon-btn" onClick={() => setSettingsOpen(false)} style={{ border: 'none', background: 'var(--bg-card)', width: 32, height: 32, boxShadow: 'var(--shadow-sm)' }}>
                                <FiX size={18} />
                            </button>
                        </div>
                        {renderSettings()}
                    </div>
                </div>
            </div>
            {/* Share Modal */}
            {shareOpen && (
                <div className="modal-overlay open">
                    <div className="modal">
                        <div className="modal-header"><div className="modal-title">🔗 Share Survey</div><button className="modal-close" onClick={() => setShareOpen(false)}>×</button></div>
                        <div className="form-group">
                            <label className="form-label">Survey Link</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input className="form-input" value={surveyUrl} readOnly style={{ fontSize: 12 }} />
                                <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(surveyUrl); toast.show('Link copied!'); }}>📋</button>
                            </div>
                        </div>
                        <div style={{ padding: '12px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                            Share this link with respondents. Anyone with the link can fill out this survey — no login required.
                        </div>
                        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShareOpen(false)}>Close</button></div>
                    </div>
                </div>
            )}
            <ConfirmModal open={confirmState.open} message={confirmState.msg} onConfirm={onConfirm} onCancel={onCancel} lang={lang} />
            <Toast messages={toast.messages} remove={toast.remove} />
        </>
    );
}
