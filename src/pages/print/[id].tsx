import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import type { GetStaticPaths, GetStaticProps } from 'next';
import * as DB from '@/lib/db';
import type { Survey, SurveyResponse, AnswerValue } from '@/types';

export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' });
export const getStaticProps: GetStaticProps = async () => ({ props: {} });

const SCALE = [5, 4, 3, 2, 1];
const SCALE_LABELS = ['Very Satisfied', 'Satisfied', 'Moderate', 'Need Improvement', 'Dissatisfied', 'N/A'];

function PrintCheckbox({ checked }: { checked: boolean }) {
    return <span className={`print-checkbox${checked ? ' checked' : ''}`} />;
}

function ScaleColumns({ answer }: { answer: AnswerValue | undefined }) {
    const num = typeof answer === 'number' ? answer : null;
    return (
        <div className="print-check-cols">
            {SCALE.map(v => (
                <div key={v} className="print-check-cell">
                    <PrintCheckbox checked={num === v} />
                </div>
            ))}
            {/* N/A column */}
            <div className="print-check-cell">
                <PrintCheckbox checked={answer === 'N/A' || answer === undefined || answer === null || answer === ''} />
            </div>
        </div>
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
        if (responseId) {
            const responses = DB.getResponsesBySurvey(id as string);
            setResponse(responses.find(r => r.id === responseId) ?? responses[responses.length - 1] ?? null);
        }
        setReady(true);
    }, [id, responseId]);

    if (!ready || !survey) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial', fontSize: 16 }}>
            Loading...
        </div>
    );

    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const hasScaleQ = (q: Survey['questions'][0]) => ['rating', 'scale', 'yes_no'].includes(q.type);

    // Group questions: rating/scale questions shown as table rows, text questions as text blocks
    const ratingQuestions = survey.questions.filter(q => q.type === 'rating' || q.type === 'scale');
    const textQuestions = survey.questions.filter(q => !hasScaleQ(q));

    return (
        <>
            <Head>
                <title>{survey.title} — Print Preview</title>
                <meta name="robots" content="noindex" />
            </Head>
            <div className="print-page">
                {/* Screen-only toolbar */}
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
                <div className="print-doc">
                    {/* Header */}
                    <div className="print-doc-header">
                        <div>
                            <div className="print-doc-title">{survey.title}</div>
                            {survey.titleTh && <div style={{ fontSize: '11pt', color: '#444', marginTop: 2 }}>{survey.titleTh}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="print-doc-code">FM-{survey.id.slice(0, 6).toUpperCase()}</div>
                            <div style={{ fontSize: '9pt', marginTop: 6, color: '#555' }}>{today}</div>
                        </div>
                    </div>

                    {survey.description && (
                        <div className="print-doc-desc">{survey.description}</div>
                    )}

                    {ratingQuestions.length > 0 && (
                        <div className="print-scale-note">
                            Rating Scale: 5 = Very Satisfied, 4 = Satisfied, 3 = Moderate, 2 = Need Improvement, 1 = Dissatisfied, N/A = Not Applicable
                        </div>
                    )}

                    {/* Rating/Scale questions as Likert table */}
                    {ratingQuestions.length > 0 && (
                        <div className="print-section" style={{ marginBottom: 16 }}>
                            <div className="print-section-header">
                                <span>Questions</span>
                                <div className="scale-cols">
                                    {SCALE.map(v => <div key={v} className="print-scale-col">{v}</div>)}
                                    <div className="print-scale-col">N/A</div>
                                </div>
                            </div>
                            {ratingQuestions.map((q, i) => {
                                const ans = response?.answers?.[q.id];
                                const qtitle = q.title;
                                const qtitleTh = q.titleTh;
                                return (
                                    <div key={q.id}>
                                        <div className="print-question-row">
                                            <div className="print-question-num">{i + 1}</div>
                                            <div className="print-question-text">
                                                {qtitle}
                                                {qtitleTh && <div style={{ fontSize: '8.5pt', color: '#555' }}>{qtitleTh}</div>}
                                            </div>
                                            <ScaleColumns answer={ans} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Multiple choice / checkboxes / dropdown as table */}
                    {survey.questions.filter(q => ['multiple_choice', 'checkboxes', 'dropdown'].includes(q.type)).map((q, i) => {
                        const ans = response?.answers?.[q.id];
                        const opts = q.options ?? [];
                        return (
                            <div key={q.id} className="print-section" style={{ marginBottom: 16 }}>
                                <div className="print-section-header"><span>{i + 1}. {q.title}</span></div>
                                {opts.map(opt => {
                                    const checked = Array.isArray(ans) ? (ans as string[]).includes(opt) : ans === opt;
                                    return (
                                        <div key={opt} className="print-question-row">
                                            <div className="print-question-num"><PrintCheckbox checked={checked} /></div>
                                            <div className="print-question-text">{opt}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}

                    {/* Text / open-ended questions */}
                    {textQuestions.filter(q => ['short_text', 'long_text'].includes(q.type)).map((q, i) => {
                        const ans = response?.answers?.[q.id];
                        return (
                            <div key={q.id} style={{ marginBottom: 14 }}>
                                <div style={{ fontWeight: 700, fontSize: '10pt', marginBottom: 4 }}>{q.title}</div>
                                <div className="print-text-answer" style={{ minHeight: q.type === 'long_text' ? 60 : 22 }}>
                                    {ans ? String(ans) : ''}
                                </div>
                            </div>
                        );
                    })}

                    {/* Yes/No */}
                    {survey.questions.filter(q => q.type === 'yes_no').map(q => {
                        const ans = response?.answers?.[q.id];
                        return (
                            <div key={q.id} style={{ marginBottom: 14 }}>
                                <div style={{ fontWeight: 700, fontSize: '10pt', marginBottom: 6 }}>{q.title}</div>
                                <div style={{ display: 'flex', gap: 24 }}>
                                    {['yes', 'no'].map(v => (
                                        <label key={v} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '10pt' }}>
                                            <PrintCheckbox checked={ans === v} />
                                            <span>{v === 'yes' ? '✓ Yes' : '✗ No'}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Signature / Footer */}
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
