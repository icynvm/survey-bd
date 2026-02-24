import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { useToast, Toast, ConfirmModal, useConfirm, StatusBadge, RoleBadge } from '@/components/ui';
import { getRoleLabel, getRoleClass } from '@/lib/utils';
import * as DB from '@/lib/db';
import { uid, formatDate } from '@/lib/utils';
import type { User, Role } from '@/types';

const ROLE_META: { role: Role; icon: string; color: string }[] = [
    { role: 'admin', icon: '🔑', color: 'rgba(239,68,68,0.15)' },
    { role: 'creator', icon: '✏️', color: 'rgba(99,102,241,0.15)' },
];

interface UserFormState { name: string; email: string; role: Role; password: string; password2: string; isActive: boolean; }
const emptyForm = (): UserFormState => ({ name: '', email: '', role: 'creator', password: '', password2: '', isActive: true });

export default function AdminPage() {
    const { user, t, lang, ready } = useApp();
    const router = useRouter();
    const toast = useToast();
    const { confirmState, confirm, onConfirm, onCancel } = useConfirm();
    const [users, setUsers] = useState<User[]>([]);
    const [surveys] = useState(() => DB.getSurveys());
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<UserFormState>(emptyForm());
    const [formError, setFormError] = useState('');

    const reload = useCallback(() => setUsers(DB.getUsers()), []);

    useEffect(() => {
        if (!ready) return;
        if (!user) { router.replace('/'); return; }
        if (user.role !== 'admin') { router.replace('/dashboard'); return; }
        reload();
    }, [ready, user, router, reload]);

    if (!ready || !user) return null;

    const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

    const openAdd = () => { setEditingId(null); setForm(emptyForm()); setFormError(''); setModalOpen(true); };
    const openEdit = (u: User) => { setEditingId(u.id); setForm({ name: u.name, email: u.email, role: u.role, password: '', password2: '', isActive: u.isActive }); setFormError(''); setModalOpen(true); };

    const saveUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password && form.password !== form.password2) { setFormError(t('admin.pwMismatch')); return; }
        const list = DB.getUsers();
        if (list.some(u => u.email === form.email.toLowerCase() && u.id !== editingId)) { setFormError(t('admin.emailExists')); return; }
        if (editingId) {
            const idx = list.findIndex(u => u.id === editingId);
            if (idx >= 0) { list[idx] = { ...list[idx], name: form.name, email: form.email.toLowerCase(), role: form.role, isActive: form.isActive, ...(form.password ? { password: form.password } : {}) }; }
            DB.saveUsers(list); toast.show(t('admin.userUpdated'));
        } else {
            list.push({ id: uid(), name: form.name, email: form.email.toLowerCase(), password: form.password || 'password123', role: form.role, isActive: form.isActive, createdAt: new Date().toISOString() });
            DB.saveUsers(list); toast.show(t('admin.userAdded'));
        }
        setModalOpen(false); reload();
    };

    const deleteUser = async (id: string) => {
        if (id === user.id) { toast.show("Can't delete yourself", 'warning'); return; }
        const ok = await confirm(t('common.confirmDelete'));
        if (ok) { DB.saveUsers(DB.getUsers().filter(u => u.id !== id)); toast.show(t('admin.userDeleted')); reload(); }
    };

    return (
        <>
            <Head><title>User Management | SurveyBD</title></Head>
            <Layout active="admin">
                <div className="page-header">
                    <div>
                        <div className="page-title">{t('admin.title')}</div>
                        <div className="page-desc">{users.length} total users</div>
                    </div>
                    <button className="btn btn-primary" onClick={openAdd}>+ {t('admin.addUser')}</button>
                </div>

                {/* Role cards */}
                <div className="grid grid-3" style={{ marginBottom: 24 }}>
                    {ROLE_META.map(rm => (
                        <div key={rm.role} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: rm.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{rm.icon}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700 }}>{t(`admin.roles.${rm.role}`)}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t(`admin.roleDesc.${rm.role}`)}</div>
                            </div>
                            <div style={{ fontSize: 28, fontWeight: 800, background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{users.filter(u => u.role === rm.role).length}</div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">All Users</div>
                        <div className="search-bar" style={{ minWidth: 200 }}>
                            <i>🔍</i>
                            <input type="text" placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead><tr>
                                <th>User</th><th>{t('admin.email')}</th><th>{t('admin.role')}</th>
                                <th>Surveys</th><th>{t('common.status')}</th><th>{t('common.createdAt')}</th><th>{t('common.actions')}</th>
                            </tr></thead>
                            <tbody>{filtered.map(u => {
                                const sCount = surveys.filter(s => s.creatorId === u.id).length;
                                return (
                                    <tr key={u.id}>
                                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{u.name[0].toUpperCase()}</div>
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{u.name}</div>
                                                {u.id === user.id && <div style={{ fontSize: 11, color: 'var(--primary-light)' }}>● You</div>}
                                            </div>
                                        </div></td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                        <td><RoleBadge role={u.role} lang={lang} /></td>
                                        <td><span className="badge badge-muted">{sCount}</span></td>
                                        <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: u.isActive ? 'var(--success)' : 'var(--text-muted)', boxShadow: u.isActive ? '0 0 6px var(--success)' : 'none' }} />{u.isActive ? t('common.active') : t('common.inactive')}</span></td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(u.createdAt, lang)}</td>
                                        <td><div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>✏️</button>
                                            {u.id !== user.id && <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>🗑</button>}
                                        </div></td>
                                    </tr>
                                );
                            })}</tbody>
                        </table>
                    </div>
                </div>

                {/* Add/Edit Modal */}
                {modalOpen && (
                    <div className="modal-overlay open">
                        <div className="modal">
                            <div className="modal-header">
                                <div className="modal-title">{editingId ? t('admin.editUser') : t('admin.addUser')}</div>
                                <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
                            </div>
                            <form onSubmit={saveUser}>
                                <div className="form-group">
                                    <label className="form-label">{t('admin.name')}</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('admin.email')}</label>
                                    <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('admin.role')}</label>
                                    <div className="role-grid">
                                        {ROLE_META.map(rm => (
                                            <div
                                                key={rm.role}
                                                onClick={() => setForm(f => ({ ...f, role: rm.role }))}
                                                className={`role-card ${form.role === rm.role ? 'active' : ''}`}
                                            >
                                                <div className="role-card-icon">{rm.icon}</div>
                                                <div className="role-card-name">{t(`admin.roles.${rm.role}`)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('admin.password')}</label>
                                    <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editingId ? 'Leave blank to keep current' : 'Min 6 characters'} {...(!editingId ? { required: true } : {})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('admin.confirmPw')}</label>
                                    <input className="form-input" type="password" value={form.password2} onChange={e => setForm(f => ({ ...f, password2: e.target.value }))} />
                                </div>
                                <div style={{ marginBottom: 20 }}>
                                    <label className="form-check" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                                        <span style={{ fontSize: 13, fontWeight: 600 }}>{t('common.active')}</span>
                                    </label>
                                </div>
                                {formError && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px', color: 'var(--danger)', fontSize: 13, marginBottom: 20 }}>{formError}</div>}
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary">💾 {t('common.save')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <ConfirmModal open={confirmState.open} message={confirmState.msg} onConfirm={onConfirm} onCancel={onCancel} lang={lang} />
                <Toast messages={toast.messages} remove={toast.remove} />
            </Layout>
        </>
    );
}
