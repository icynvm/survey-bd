import React, { useState, useCallback, useEffect } from 'react';
import type { ToastMessage } from '@/types';

// ── Toast ────────────────────────────────────────────────────────
export const Toast: React.FC<{ messages: ToastMessage[]; remove: (id: string) => void }> = ({ messages, remove }) => (
    <div id="toast-container">
        {messages.map(m => (
            <div key={m.id} className={`toast ${m.type}`}>
                <span className="toast-icon">
                    {{ success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }[m.type]}
                </span>
                <span className="toast-msg">{m.msg}</span>
                <button onClick={() => remove(m.id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: 8 }}>×</button>
            </div>
        ))}
    </div>
);

export const useToast = () => {
    const [messages, setMessages] = useState<ToastMessage[]>([]);
    const show = useCallback((msg: string, type: ToastMessage['type'] = 'success', duration = 3000) => {
        const id = Date.now().toString();
        setMessages(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), duration);
    }, []);
    const remove = useCallback((id: string) => setMessages(prev => prev.filter(m => m.id !== id)), []);
    return { messages, show, remove };
};

// ── Confirm Modal ─────────────────────────────────────────────────
interface ConfirmModalProps {
    open: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    lang?: string;
}
export const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, message, onConfirm, onCancel, lang = 'en' }) => {
    if (!open) return null;
    return (
        <div className="modal-overlay open">
            <div className="modal" style={{ maxWidth: 400 }}>
                <div className="modal-header">
                    <span className="modal-title">⚠️ {lang === 'th' ? 'ยืนยัน' : 'Confirm'}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{message}</p>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onCancel}>{lang === 'th' ? 'ยกเลิก' : 'Cancel'}</button>
                    <button className="btn btn-danger" onClick={onConfirm}>{lang === 'th' ? 'ยืนยัน' : 'Confirm'}</button>
                </div>
            </div>
        </div>
    );
};

export const useConfirm = () => {
    const [state, setState] = useState<{ open: boolean; msg: string; resolve?: (v: boolean) => void }>({ open: false, msg: '' });
    const confirm = (msg: string): Promise<boolean> =>
        new Promise(resolve => setState({ open: true, msg, resolve }));
    const onConfirm = () => { state.resolve?.(true); setState({ open: false, msg: '' }); };
    const onCancel = () => { state.resolve?.(false); setState({ open: false, msg: '' }); };
    return { confirmState: state, confirm, onConfirm, onCancel };
};

// ── Badge Components ──────────────────────────────────────────────
import { getStatusClass, getStatusLabel, getRoleClass, getRoleLabel } from '@/lib/utils';
import type { SurveyStatus, Role, Lang } from '@/types';

export const StatusBadge: React.FC<{ status: SurveyStatus; lang: Lang }> = ({ status, lang }) => (
    <span className={`badge ${getStatusClass(status)}`}>{getStatusLabel(status, lang)}</span>
);

export const RoleBadge: React.FC<{ role: Role; lang: Lang }> = ({ role, lang }) => (
    <span className={`badge ${getRoleClass(role)}`}>{getRoleLabel(role, lang)}</span>
);

// ── Lang Toggle ───────────────────────────────────────────────────
import { useApp } from '@/contexts/AppContext';

export const LangToggle: React.FC = () => {
    const { lang, setLang } = useApp();
    return (
        <div className="lang-toggle">
            <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
            <button className={`lang-btn${lang === 'th' ? ' active' : ''}`} onClick={() => setLang('th')}>TH</button>
        </div>
    );
};
