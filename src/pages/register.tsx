import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useApp } from '@/contexts/AppContext';
import { LangToggle } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { uid } from '@/lib/utils';

export default function RegisterPage() {
    const { t, lang, ready, user } = useApp();
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Redirect if already logged in
    React.useEffect(() => {
        if (ready && user) router.replace('/dashboard');
    }, [ready, user, router]);

    // Cooldown timer
    React.useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown(c => c - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const sendOTP = async () => {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError(lang === 'th' ? 'กรุณากรอกอีเมลที่ถูกต้อง' : 'Please enter a valid email');
            return;
        }
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                setStep(2);
                setCooldown(60);
            } else if (data.error === 'EMAIL_EXISTS') {
                setError(lang === 'th' ? 'อีเมลนี้ถูกใช้แล้ว' : 'This email is already registered');
            } else if (data.error === 'RATE_LIMIT') {
                setError(lang === 'th' ? 'กรุณารอ 60 วินาที' : 'Please wait 60 seconds');
                setCooldown(60);
            } else {
                setError(data.error || (lang === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'));
            }
        } catch {
            setError(lang === 'th' ? 'เกิดข้อผิดพลาด' : 'Network error');
        }
        setLoading(false);
    };

    const verifyOTP = async () => {
        if (otp.length !== 6) {
            setError(lang === 'th' ? 'กรุณากรอกรหัส 6 หลัก' : 'Please enter the 6-digit code');
            return;
        }
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: otp })
            });
            const data = await res.json();
            if (data.valid) {
                setStep(3);
            } else if (data.error === 'EXPIRED') {
                setError(lang === 'th' ? 'รหัสหมดอายุแล้ว กรุณาขอใหม่' : 'Code expired. Please request a new one.');
            } else {
                setError(lang === 'th' ? 'รหัสไม่ถูกต้อง' : 'Invalid code');
            }
        } catch {
            setError(lang === 'th' ? 'เกิดข้อผิดพลาด' : 'Network error');
        }
        setLoading(false);
    };

    const createAccount = async () => {
        if (!name.trim()) { setError(lang === 'th' ? 'กรุณากรอกชื่อ' : 'Name is required'); return; }
        if (password.length < 6) { setError(lang === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters'); return; }
        if (password !== confirmPw) { setError(lang === 'th' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match'); return; }

        setLoading(true); setError('');
        try {
            const { error: dbErr } = await supabase.from('users').insert({
                id: uid(),
                name: name.trim(),
                email,
                password,
                role: 'creator',
                is_active: true,
                created_at: new Date().toISOString()
            });

            if (dbErr) {
                setError(lang === 'th' ? 'ไม่สามารถสร้างบัญชีได้' : 'Could not create account');
                setLoading(false);
                return;
            }

            router.push('/?registered=1');
        } catch {
            setError(lang === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred');
        }
        setLoading(false);
    };

    if (!ready) return null;

    const stepTitles = {
        1: lang === 'th' ? 'สมัครสมาชิก' : 'Create Account',
        2: lang === 'th' ? 'ยืนยัน OTP' : 'Verify OTP',
        3: lang === 'th' ? 'ตั้งค่าบัญชี' : 'Set Up Account'
    };

    const stepDescs = {
        1: lang === 'th' ? 'กรอกอีเมลเพื่อรับรหัสยืนยัน' : 'Enter your email to receive a verification code',
        2: lang === 'th' ? `เราส่งรหัส 6 หลักไปที่ ${email}` : `We sent a 6-digit code to ${email}`,
        3: lang === 'th' ? 'ตั้งชื่อและรหัสผ่านสำหรับบัญชีของคุณ' : 'Set your name and password'
    };

    return (
        <>
            <Head><title>{lang === 'th' ? 'สมัครสมาชิก' : 'Register'} | SurveyBD</title></Head>
            <div className="auth-page">
                <div className="auth-bg">
                    <div className="auth-orb orb1" /><div className="auth-orb orb2" /><div className="auth-orb orb3" />
                </div>
                <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}><LangToggle /></div>
                <div className="auth-card glass fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div className="sidebar-logo" style={{ width: 48, height: 48, fontSize: 22, background: 'rgba(255,255,255,0.08)' }}>⬡</div>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 800, background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('app.name')}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('app.tagline')}</div>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                        {[1, 2, 3].map(s => (
                            <div key={s} style={{
                                flex: 1, height: 4, borderRadius: 2,
                                background: s <= step ? 'var(--gradient)' : 'rgba(255,255,255,0.1)',
                                transition: 'background 0.3s'
                            }} />
                        ))}
                    </div>

                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{stepTitles[step]}</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>{stepDescs[step]}</p>

                    {/* Step 1: Email */}
                    {step === 1 && (
                        <div>
                            <div className="form-group">
                                <label className="form-label">{lang === 'th' ? 'อีเมล' : 'Email Address'}</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>✉</span>
                                    <input className="form-input" style={{ paddingLeft: 36 }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
                                </div>
                            </div>
                            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{error}</div>}
                            <button onClick={sendOTP} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 700 }} disabled={loading}>
                                {loading ? '⏳ ...' : `📧 ${lang === 'th' ? 'ส่งรหัสยืนยัน' : 'Send Verification Code'}`}
                            </button>
                        </div>
                    )}

                    {/* Step 2: OTP */}
                    {step === 2 && (
                        <div>
                            <div className="form-group">
                                <label className="form-label">{lang === 'th' ? 'รหัสยืนยัน 6 หลัก' : '6-Digit Verification Code'}</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, letterSpacing: 12, padding: '16px' }}
                                    autoFocus
                                />
                            </div>
                            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{error}</div>}
                            <button onClick={verifyOTP} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 700, marginBottom: 12 }} disabled={loading}>
                                {loading ? '⏳ ...' : `✅ ${lang === 'th' ? 'ยืนยัน' : 'Verify Code'}`}
                            </button>
                            <div style={{ textAlign: 'center' }}>
                                <button onClick={sendOTP} disabled={cooldown > 0 || loading} style={{ background: 'none', border: 'none', color: cooldown > 0 ? 'var(--text-muted)' : 'var(--primary)', cursor: cooldown > 0 ? 'default' : 'pointer', fontSize: 13 }}>
                                    {cooldown > 0 ? `${lang === 'th' ? 'ส่งใหม่ใน' : 'Resend in'} ${cooldown}s` : (lang === 'th' ? 'ส่งรหัสใหม่' : 'Resend Code')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Name + Password */}
                    {step === 3 && (
                        <div>
                            <div className="form-group">
                                <label className="form-label">{lang === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'}</label>
                                <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder={lang === 'th' ? 'ชื่อของคุณ' : 'Your name'} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{lang === 'th' ? 'รหัสผ่าน' : 'Password'}</label>
                                <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{lang === 'th' ? 'ยืนยันรหัสผ่าน' : 'Confirm Password'}</label>
                                <input className="form-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
                            </div>
                            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{error}</div>}
                            <button onClick={createAccount} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 700 }} disabled={loading}>
                                {loading ? '⏳ ...' : `🚀 ${lang === 'th' ? 'สร้างบัญชี' : 'Create Account'}`}
                            </button>
                        </div>
                    )}

                    {/* Back to Login */}
                    <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {lang === 'th' ? 'มีบัญชีอยู่แล้ว?' : 'Already have an account?'}{' '}
                        <a href="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>
                            {lang === 'th' ? 'เข้าสู่ระบบ' : 'Sign In'}
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
