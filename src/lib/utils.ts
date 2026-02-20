import type { Lang, QuestionType, QuestionTypeInfo, SurveyStatus, Role } from '@/types';

export const uid = (): string =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const formatDate = (iso: string | null | undefined, lang: Lang = 'en'): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    return lang === 'th'
        ? d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
        : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatTime = (seconds?: number): string => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60), s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

export const timeAgo = (iso: string): string => {
    const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (sec < 60) return 'just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
};

export const copyText = (text: string): void => {
    navigator.clipboard.writeText(text).catch(() => {
        const el = document.createElement('textarea');
        el.value = text; document.body.appendChild(el);
        el.select(); document.execCommand('copy'); document.body.removeChild(el);
    });
};

export const truncate = (str: string | undefined | null, n = 60): string => {
    if (!str) return '';
    return str.length > n ? str.slice(0, n) + '…' : str;
};

export const getStatusClass = (status: SurveyStatus): string => ({
    published: 'badge-success', draft: 'badge-muted', closed: 'badge-danger'
}[status] ?? 'badge-muted');

export const getStatusLabel = (status: SurveyStatus, lang: Lang): string => ({
    en: { published: 'Published', draft: 'Draft', closed: 'Closed' },
    th: { published: 'เผยแพร่แล้ว', draft: 'ร่าง', closed: 'ปิดแล้ว' },
}[lang][status] ?? status);

export const getRoleLabel = (role: Role, lang: Lang): string => ({
    en: { admin: 'Admin', creator: 'Creator', respondent: 'Respondent' },
    th: { admin: 'ผู้ดูแลระบบ', creator: 'ผู้สร้าง', respondent: 'ผู้ตอบ' },
}[lang][role] ?? role);

export const getRoleClass = (role: Role): string => ({
    admin: 'badge-danger', creator: 'badge-primary', respondent: 'badge-muted'
}[role] ?? 'badge-muted');

export const QUESTION_TYPE_INFO: Record<QuestionType, QuestionTypeInfo> = {
    multiple_choice: { icon: '🔘', color: '#6366f1', en: 'Multiple Choice', th: 'ตัวเลือกเดียว' },
    checkboxes: { icon: '☑️', color: '#8b5cf6', en: 'Checkboxes', th: 'หลายตัวเลือก' },
    short_text: { icon: '✏️', color: '#06b6d4', en: 'Short Answer', th: 'คำตอบสั้น' },
    long_text: { icon: '📝', color: '#0ea5e9', en: 'Long Answer', th: 'คำตอบยาว' },
    rating: { icon: '⭐', color: '#f59e0b', en: 'Rating', th: 'คะแนนดาว' },
    scale: { icon: '📊', color: '#10b981', en: 'Linear Scale', th: 'สเกล' },
    dropdown: { icon: '🔽', color: '#ec4899', en: 'Dropdown', th: 'รายการ' },
    date: { icon: '📅', color: '#f97316', en: 'Date', th: 'วันที่' },
    yes_no: { icon: '✅', color: '#14b8a6', en: 'Yes / No', th: 'ใช่ / ไม่' },
};

export const exportToCSV = (headers: string[], rows: (string | number)[][], filename: string): void => {
    const csv = [headers, ...rows]
        .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
};
