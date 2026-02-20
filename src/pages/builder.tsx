import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useApp } from '@/contexts/AppContext';
import { useToast, Toast, ConfirmModal, useConfirm, StatusBadge } from '@/components/ui';
import { LangToggle } from '@/components/ui';
import { QUESTION_TYPE_INFO, uid } from '@/lib/utils';
import * as DB from '@/lib/db';
import * as Auth from '@/lib/auth';
import type { Survey, Question, QuestionType } from '@/types';

const Q_TYPES: QuestionType[] = ['multiple_choice', 'checkboxes', 'short_text', 'long_text', 'rating', 'scale', 'dropdown', 'date', 'yes_no'];

export default function BuilderPage() {
    const { user, t, lang, ready } = useApp();
    const router = useRouter();
    const toast = useToast();
    const { confirmState, confirm, onConfirm, onCancel } = useConfirm();
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [selectedQId, setSelectedQId] = useState<string | null>(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
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

    if (!ready || !user || !survey) return null;

    const updateSurvey = (upd: Partial<Survey>) => setSurvey(s => s ? { ...s, ...upd } : s);
    const updateQ = (qId: string, upd: Partial<Question>) =>
        setSurvey(s => s ? { ...s, questions: s.questions.map(q => q.id === qId ? { ...q, ...upd } : q) } : s);
    const selectedQ = survey.questions.find(q => q.id === selectedQId) ?? null;

    const addQuestion = (type: QuestionType) => {
        const q: Question = {
            id: uid(), type, title: '', titleTh: '', required: false,
            ...(['multiple_choice', 'checkboxes', 'dropdown'].includes(type) ? { options: ['Option 1', 'Option 2', 'Option 3'], optionsTh: ['ตัวเลือก 1', 'ตัวเลือก 2', 'ตัวเลือก 3'] } : {}),
            ...(type === 'scale' ? { minValue: 1, maxValue: 10, minLabel: 'Low', maxLabel: 'High' } : {}),
        };
        setSurvey(s => s ? { ...s, questions: [...s.questions, q] } : s);
        setSelectedQId(q.id);
    };

    const deleteQ = async (id: string) => {
        const ok = await confirm('Delete this question?');
        if (ok) { setSurvey(s => s ? { ...s, questions: s.questions.filter(q => q.id !== id) } : s); if (selectedQId === id) setSelectedQId(null); }
    };

    const duplicateQ = (id: string) => {
        const q = survey.questions.find(q => q.id === id); if (!q) return;
        const copy = { ...JSON.parse(JSON.stringify(q)), id: uid() };
        const idx = survey.questions.findIndex(q => q.id === id);
        setSurvey(s => s ? { ...s, questions: [...s.questions.slice(0, idx + 1), copy, ...s.questions.slice(idx + 1)] } : s);
        toast.show('Question duplicated');
    };

    const saveSurvey = () => {
        const updated = { ...survey, title: survey.title || t('builder.untitled'), updatedAt: new Date().toISOString() };
        DB.saveSurvey(updated); setSurvey(updated); toast.show(t('builder.saveSuccess'));
        if (!router.query.id) router.replace(`/builder?id=${updated.id}`, undefined, { shallow: true });
    };

    const publishSurvey = async () => {
        if (survey.status === 'published') {
            const ok = await confirm(t('survey.closeConfirm'));
            if (ok) { const upd = { ...survey, status: 'closed' as const, updatedAt: new Date().toISOString() }; DB.saveSurvey(upd); setSurvey(upd); toast.show('Survey closed'); }
        } else {
            if (!survey.questions.length) { toast.show('Add at least one question before publishing!', 'warning'); return; }
            const ok = await confirm(t('survey.publishConfirm'));
            if (ok) { const upd = { ...survey, status: 'published' as const, publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; DB.saveSurvey(upd); setSurvey(upd); toast.show(t('builder.publishSuccess')); }
        }
    };

    const surveyUrl = typeof window !== 'undefined' ? `${window.location.origin}/survey/${survey.id}` : '';

    return (
        <>
            <Head><title>{survey.title || t('builder.untitled')} | Builder | SurveyBD</title></Head>
            <div className="app-layout">
                <aside className="sidebar">
                    <div className="sidebar-brand"><div className="sidebar-logo">📊</div><div><div className="sidebar-title">{t('app.name')}</div></div></div>
                    <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{t('builder.questionTypes')}</div>
                        {Q_TYPES.map(type => {
                            const info = QUESTION_TYPE_INFO[type];
                            return (
                                <button key={type} onClick={() => addQuestion(type)} className="q-type-btn" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', border: '1px solid transparent', marginBottom: 4, background: 'none', width: '100%', textAlign: 'left', transition: 'var(--transition)', color: 'var(--text-secondary)' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-hover)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}>
                                    <div style={{ width: 30, height: 30, borderRadius: 6, background: `${info.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{info.icon}</div>
                                    <span style={{ fontSize: 13, fontWeight: 500 }}>{lang === 'th' ? info.th : info.en}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="sidebar-footer">
                        <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => router.push('/dashboard')}>← {t('nav.dashboard')}</button>
                    </div>
                </aside>
                <div className="main-content">
                    {/* Topbar */}
                    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 'var(--topbar-h)', background: 'rgba(7,7,20,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 15, fontWeight: 700 }}>{survey.title || t('builder.untitled')}</span>
                            <StatusBadge status={survey.status} lang={lang} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <LangToggle />
                            <button className="btn btn-secondary btn-sm" onClick={() => setPreviewMode(!previewMode)}>👁 {previewMode ? t('builder.editMode') : t('common.preview')}</button>
                            <button className="btn btn-secondary btn-sm" onClick={saveSurvey}>💾 {t('common.save')}</button>
                            <button className="btn btn-primary btn-sm" onClick={publishSurvey}>🚀 {survey.status === 'published' ? t('common.close') : t('common.publish')}</button>
                            {survey.status === 'published' && <button className="btn btn-secondary btn-sm" onClick={() => setShareOpen(true)}>🔗</button>}
                        </div>
                    </header>

                    {/* Builder layout */}
                    <div style={{ display: 'grid', gridTemplateColumns: previewMode ? '1fr' : '1fr 280px', height: 'calc(100vh - var(--topbar-h))', overflow: 'hidden' }}>
                        {/* Canvas */}
                        <div style={{ overflowY: 'auto', padding: 20, background: 'rgba(0,0,0,0.2)' }}>
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                                <input value={survey.title} onChange={e => updateSurvey({ title: e.target.value })} placeholder={t('survey.title')} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, width: '100%', padding: 0, outline: 'none' }} />
                                <textarea value={survey.description} onChange={e => updateSurvey({ description: e.target.value })} placeholder={t('survey.description')} rows={2} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 14, width: '100%', padding: 0, marginTop: 6, resize: 'none', fontFamily: 'inherit', outline: 'none' }} />
                            </div>
                            {survey.questions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{t('builder.noQuestions')}</div>
                                    <div style={{ fontSize: 13 }}>{t('builder.noQuestionsDesc')}</div>
                                </div>
                            ) : survey.questions.map((q, i) => {
                                const info = QUESTION_TYPE_INFO[q.type];
                                const title = lang === 'th' && q.titleTh ? q.titleTh : q.title || `Question ${i + 1}`;
                                return (
                                    <div key={q.id}
                                        onClick={() => setSelectedQId(q.id)}
                                        draggable
                                        onDragStart={() => { dragSrcRef.current = q.id; }}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={() => {
                                            if (!dragSrcRef.current || dragSrcRef.current === q.id) return;
                                            const src = dragSrcRef.current;
                                            setSurvey(s => { if (!s) return s; const qs = [...s.questions]; const si = qs.findIndex(x => x.id === src); const ti = qs.findIndex(x => x.id === q.id); const [r] = qs.splice(si, 1); qs.splice(ti, 0, r); return { ...s, questions: qs }; });
                                            dragSrcRef.current = null;
                                        }}
                                        style={{ background: 'var(--bg-card)', border: `1px solid ${selectedQId === q.id ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 12, padding: 16, marginBottom: 12, cursor: 'pointer', transition: 'var(--transition)', boxShadow: selectedQId === q.id ? '0 0 0 1px var(--primary)' : 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                            <span style={{ color: 'var(--text-muted)', cursor: 'grab', fontSize: 14 }}>⠿</span>
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 15, fontWeight: 600 }}>{title}{q.required && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{info.icon} {lang === 'th' ? info.th : info.en}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={e => { e.stopPropagation(); duplicateQ(q.id); }} style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-card-hover)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>⧉</button>
                                                <button onClick={e => { e.stopPropagation(); deleteQ(q.id); }} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>🗑</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Settings panel */}
                        {!previewMode && (
                            <div style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)', padding: 16, overflowY: 'auto' }}>
                                {!selectedQ ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        <div style={{ fontSize: 40, marginBottom: 12 }}>👆</div>
                                        <div style={{ fontSize: 14, fontWeight: 600 }}>{t('builder.clickToEdit')}</div>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>{t('builder.questionSettings')}</div>
                                        <div className="form-group"><label className="form-label">{t('builder.questionTitle')} (EN)</label>
                                            <textarea className="form-input" rows={2} value={selectedQ.title} onChange={e => updateQ(selectedQ.id, { title: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">{t('builder.questionTitle')} (TH)</label>
                                            <textarea className="form-input" rows={2} value={selectedQ.titleTh} onChange={e => updateQ(selectedQ.id, { titleTh: e.target.value })} /></div>
                                        {['multiple_choice', 'checkboxes', 'dropdown'].includes(selectedQ.type) && (
                                            <div className="form-group">
                                                <label className="form-label">{t('builder.options')}</label>
                                                {(selectedQ.options ?? []).map((opt, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                                                        <input style={{ flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }} value={opt} onChange={e => { const o = [...(selectedQ.options ?? [])]; o[i] = e.target.value; updateQ(selectedQ.id, { options: o }); }} />
                                                        <button onClick={() => { const o = (selectedQ.options ?? []).filter((_, j) => j !== i); const oth = (selectedQ.optionsTh ?? []).filter((_, j) => j !== i); updateQ(selectedQ.id, { options: o, optionsTh: oth }); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 18 }}>×</button>
                                                    </div>
                                                ))}
                                                <button onClick={() => { const n = (selectedQ.options ?? []).length + 1; updateQ(selectedQ.id, { options: [...(selectedQ.options ?? []), `Option ${n}`], optionsTh: [...(selectedQ.optionsTh ?? []), `ตัวเลือก ${n}`] }); }} style={{ color: 'var(--primary-light)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>+ {t('builder.addOption')}</button>
                                            </div>
                                        )}
                                        {selectedQ.type === 'scale' && ['minValue', 'maxValue', 'minLabel', 'maxLabel'].map(field => (
                                            <div key={field} className="form-group">
                                                <label className="form-label">{t(`builder.${field}`)}</label>
                                                <input className="form-input" type={field.includes('Value') ? 'number' : 'text'} value={(selectedQ as Record<string, string | number | undefined>)[field] ?? ''} onChange={e => updateQ(selectedQ.id, { [field]: field.includes('Value') ? parseInt(e.target.value) : e.target.value })} />
                                            </div>
                                        ))}
                                        <label className="form-check"><input type="checkbox" checked={selectedQ.required} onChange={e => updateQ(selectedQ.id, { required: e.target.checked })} /><span>{t('builder.isRequired')}</span></label>
                                        <div className="divider" />
                                        <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => deleteQ(selectedQ.id)}>🗑 Delete Question</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            {shareOpen && (
                <div className="modal-overlay open">
                    <div className="modal">
                        <div className="modal-header"><div className="modal-title">🔗 {t('survey.shareLink')}</div><button className="modal-close" onClick={() => setShareOpen(false)}>×</button></div>
                        <div className="form-group">
                            <label className="form-label">{t('survey.shareLink')}</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input className="form-input" value={surveyUrl} readOnly style={{ fontSize: 12 }} />
                                <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(surveyUrl); toast.show(t('common.copied')); }}>📋</button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('survey.settings')}</label>
                            <label className="form-check" style={{ marginBottom: 8 }}><input type="checkbox" checked={survey.settings.allowMultiple} onChange={e => updateSurvey({ settings: { ...survey.settings, allowMultiple: e.target.checked } })} /><span>{t('survey.allowMultiple')}</span></label>
                            <label className="form-check" style={{ marginBottom: 8 }}><input type="checkbox" checked={survey.settings.showProgress} onChange={e => updateSurvey({ settings: { ...survey.settings, showProgress: e.target.checked } })} /><span>{t('survey.showProgress')}</span></label>
                            <label className="form-check"><input type="checkbox" checked={survey.settings.anonymous} onChange={e => updateSurvey({ settings: { ...survey.settings, anonymous: e.target.checked } })} /><span>{t('survey.anonymous')}</span></label>
                        </div>
                        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShareOpen(false)}>{t('common.close')}</button><button className="btn btn-primary" onClick={saveSurvey}>💾 {t('common.save')}</button></div>
                    </div>
                </div>
            )}
            <ConfirmModal open={confirmState.open} message={confirmState.msg} onConfirm={onConfirm} onCancel={onCancel} lang={lang} />
            <Toast messages={toast.messages} remove={toast.remove} />
        </>
    );
}
