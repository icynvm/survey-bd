import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import type { GetStaticPaths, GetStaticProps } from 'next';
import * as DB from '@/lib/db';
import { DEFAULT_LIKERT_SCALE } from '@/lib/utils';
import type { Survey, SurveyResponse } from '@/types';

export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' });
export const getStaticProps: GetStaticProps = async () => ({ props: {} });

function Checkbox({ checked }: { checked: boolean }) {
    return (
        <span style={{
            display: 'inline-block', width: 14, height: 14,
            border: '1.5px solid #333', background: checked ? '#333' : 'white',
            position: 'relative', flexShrink: 0,
        }}>
            {checked && <span style={{ position: 'absolute', top: -3, left: 1, color: 'white', fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
        </span>
    );
}

export default function PrintSurveyPage() {
    const router = useRouter();
    const { id, responseId } = router.query;
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [response, setResponse] = useState<SurveyResponse | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!id) return;
        const sv = DB.getSurveyById(id as string);
        setSurvey(sv);
        if (sv) {
            const allResponses = DB.getResponsesBySurvey(id as string);
            if (responseId) {
                setResponse(allResponses.find(r => r.id === responseId) ?? allResponses[allResponses.length - 1] ?? null);
            } else {
                setResponse(allResponses[allResponses.length - 1] ?? null);
            }
        }
        setReady(true);
    }, [id, responseId]);

    if (!ready || !survey) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial', fontSize: 16 }}>Loading...</div>
    );

    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const ans = (qId: string) => response?.answers?.[qId];

    return (
        <>
            <Head>
                <title>{survey.title} — Print Preview</title>
                <meta name="robots" content="noindex" />
            </Head>

            {/* Screen toolbar — hidden on print */}
            <div className="print-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => router.back()} style={{ padding: '6px 14px', border: '1px solid #ccc', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 13 }}>← Back</button>
                    <span style={{ fontSize: 13, color: '#555' }}><strong>Print Preview</strong> — {survey.title}</span>
                </div>
                <button onClick={() => window.print()} style={{ padding: '8px 22px', background: '#1a1a3e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                    🖨 Print / Save PDF
                </button>
            </div>

            {/* Document */}
            <div className="print-page">
                <div className="print-doc">

                    {/* Header */}
                    <div className="print-doc-header">
                        <div>
                            <div className="print-doc-title">{survey.title}</div>
                            {survey.titleTh && <div style={{ fontSize: '11pt', color: '#555', marginTop: 2 }}>{survey.titleTh}</div>}
                            {survey.description && <div className="print-doc-desc" style={{ marginTop: 6 }}>{survey.description}</div>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 20 }}>
                            <div className="print-doc-code">FM-{survey.id.slice(0, 6).toUpperCase()}</div>
                            <div style={{ fontSize: '9pt', marginTop: 6, color: '#555' }}>{today}</div>
                        </div>
                    </div>

                    {survey.questions.some(q => q.type === 'likert' || q.type === 'rating' || q.type === 'scale') && (
                        <div className="print-scale-note">
                            Rating Scale: 5 = Very Satisfied, 4 = Satisfied, 3 = Moderate, 2 = Need Improvement, 1 = Dissatisfied, N/A = Not Applicable
                        </div>
                    )}

                    {/* ── Render each question ── */}
                    {survey.questions.map((q, qi) => {
                        const qTitle = q.title;
                        const a = ans(q.id);

                        /* ── LIKERT ── */
                        if (q.type === 'likert') {
                            const scale = q.likertScale ?? DEFAULT_LIKERT_SCALE;
                            const rows = q.likertRows ?? [];
                            const likertAns = (a && typeof a === 'object' && !Array.isArray(a))
                                ? a as Record<string, string>
                                : {};
                            return (
                                <div key={q.id} className="print-section" style={{ marginBottom: 16 }}>
                                    {/* Section header with question title + scale columns */}
                                    <div className="print-section-header">
                                        <span>{qi + 1}. {qTitle}</span>
                                        <div className="scale-cols">
                                            {scale.map((s, si) => (
                                                <div key={si} className="print-scale-col" style={{ minWidth: 48, textAlign: 'center', fontSize: 9 }}>{s}</div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Each sub-question row */}
                                    {rows.map((row, ri) => (
                                        <div key={ri} className="print-question-row">
                                            <div className="print-question-num">{ri + 1}</div>
                                            <div className="print-question-text">{row}</div>
                                            <div className="print-check-cols">
                                                {scale.map((s, si) => (
                                                    <div key={si} className="print-check-cell">
                                                        <Checkbox checked={likertAns[row] === s} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {q.description && (
                                        <div className="print-text-row">
                                            <em>{q.description}</em>
                                            <div className="print-text-answer" />
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        /* ── RATING (star) — show as 5-column table ── */
                        if (q.type === 'rating') {
                            const num = typeof a === 'number' ? a : null;
                            return (
                                <div key={q.id} className="print-section" style={{ marginBottom: 16 }}>
                                    <div className="print-section-header">
                                        <span>{qi + 1}. {qTitle}</span>
                                        <div className="scale-cols">
                                            {[5, 4, 3, 2, 1].map(v => <div key={v} className="print-scale-col">{v}</div>)}
                                            <div className="print-scale-col">N/A</div>
                                        </div>
                                    </div>
                                    <div className="print-question-row">
                                        <div className="print-question-text" />
                                        <div className="print-check-cols">
                                            {[5, 4, 3, 2, 1].map(v => (
                                                <div key={v} className="print-check-cell"><Checkbox checked={num === v} /></div>
                                            ))}
                                            <div className="print-check-cell"><Checkbox checked={num === null} /></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        /* ── SCALE (linear) ── */
                        if (q.type === 'scale') {
                            const num = typeof a === 'number' ? a : null;
                            const min = q.minValue ?? 1; const max = q.maxValue ?? 10;
                            const vals = Array.from({ length: max - min + 1 }, (_, i) => min + i);
                            return (
                                <div key={q.id} className="print-section" style={{ marginBottom: 16 }}>
                                    <div className="print-section-header">
                                        <span>{qi + 1}. {qTitle}</span>
                                        <div className="scale-cols">
                                            {vals.map(v => <div key={v} className="print-scale-col" style={{ minWidth: 28 }}>{v}</div>)}
                                        </div>
                                    </div>
                                    <div className="print-question-row">
                                        <div className="print-question-text" style={{ fontSize: '8.5pt', color: '#555' }}>
                                            {q.minLabel && <span>{min} = {q.minLabel}</span>}
                                            {q.maxLabel && <span style={{ marginLeft: 16 }}>{max} = {q.maxLabel}</span>}
                                        </div>
                                        <div className="print-check-cols">
                                            {vals.map(v => (
                                                <div key={v} className="print-check-cell" style={{ minWidth: 28 }}><Checkbox checked={num === v} /></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        /* ── MULTIPLE CHOICE / DROPDOWN ── */
                        if (q.type === 'multiple_choice' || q.type === 'dropdown') {
                            const opts = q.options ?? [];
                            return (
                                <div key={q.id} className="print-section" style={{ marginBottom: 16 }}>
                                    <div className="print-section-header"><span>{qi + 1}. {qTitle}</span></div>
                                    {opts.map((opt, oi) => (
                                        <div key={oi} className="print-question-row">
                                            <div className="print-question-num"><Checkbox checked={a === opt} /></div>
                                            <div className="print-question-text">{opt}</div>
                                        </div>
                                    ))}
                                    {q.hasOther && (
                                        <div className="print-question-row">
                                            <div className="print-question-num"><Checkbox checked={false} /></div>
                                            <div className="print-question-text">Other: <span style={{ borderBottom: '1px solid #999', display: 'inline-block', minWidth: 160 }}>&nbsp;</span></div>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        /* ── CHECKBOXES ── */
                        if (q.type === 'checkboxes') {
                            const opts = q.options ?? [];
                            const checked = Array.isArray(a) ? a as string[] : [];
                            return (
                                <div key={q.id} className="print-section" style={{ marginBottom: 16 }}>
                                    <div className="print-section-header"><span>{qi + 1}. {qTitle}</span></div>
                                    {opts.map((opt, oi) => (
                                        <div key={oi} className="print-question-row">
                                            <div className="print-question-num"><Checkbox checked={checked.includes(opt)} /></div>
                                            <div className="print-question-text">{opt}</div>
                                        </div>
                                    ))}
                                    {q.hasOther && (
                                        <div className="print-question-row">
                                            <div className="print-question-num"><Checkbox checked={false} /></div>
                                            <div className="print-question-text">Other: <span style={{ borderBottom: '1px solid #999', display: 'inline-block', minWidth: 160 }}>&nbsp;</span></div>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        /* ── YES / NO ── */
                        if (q.type === 'yes_no') {
                            return (
                                <div key={q.id} style={{ marginBottom: 14 }}>
                                    <div style={{ fontWeight: 700, fontSize: '10pt', marginBottom: 6 }}>{qi + 1}. {qTitle}</div>
                                    <div style={{ display: 'flex', gap: 24 }}>
                                        {['yes', 'no'].map(v => (
                                            <label key={v} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '10pt' }}>
                                                <Checkbox checked={a === v} />
                                                <span>{v === 'yes' ? '✓ Yes' : '✗ No'}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        /* ── SHORT / LONG TEXT ── */
                        if (q.type === 'short_text' || q.type === 'long_text') {
                            return (
                                <div key={q.id} style={{ marginBottom: 14 }}>
                                    <div style={{ fontWeight: 700, fontSize: '10pt', marginBottom: 4 }}>{qi + 1}. {qTitle}</div>
                                    {q.description && <div style={{ fontSize: '8.5pt', color: '#666', marginBottom: 4, fontStyle: 'italic' }}>{q.description}</div>}
                                    <div className="print-text-answer" style={{ minHeight: q.type === 'long_text' ? 60 : 22 }}>
                                        {a ? String(a) : ''}
                                    </div>
                                </div>
                            );
                        }

                        /* ── DATE ── */
                        if (q.type === 'date') {
                            return (
                                <div key={q.id} style={{ marginBottom: 14 }}>
                                    <div style={{ fontWeight: 700, fontSize: '10pt', marginBottom: 4 }}>{qi + 1}. {qTitle}</div>
                                    <div className="print-text-answer">{a ? String(a) : ''}</div>
                                </div>
                            );
                        }

                        return null;
                    })}

                    {/* Footer */}
                    <div className="print-footer">
                        <div>
                            <span>Survey: <strong>{survey.title}</strong></span><br />
                            <span style={{ fontSize: '8pt' }}>Submitted: {response?.submittedAt ? new Date(response.submittedAt).toLocaleString() : '—'}</span>
                        </div>
                        <div className="print-sign-box">
                            <div className="print-sign-line">Respondent Signature</div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
