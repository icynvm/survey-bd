import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://exryasirnrgwzjxkmwme.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_KEY || 'sb_publishable_6TjHFbdehfcWxEkJvt7dlw_8420PRmE'
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email' });
    }

    // Check if email already registered
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(409).json({ error: 'EMAIL_EXISTS' });

    // Rate limit: 1 OTP per email per 60 seconds
    const { data: recent } = await supabase
        .from('otp_codes')
        .select('created_at')
        .eq('email', email)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (recent && (Date.now() - new Date(recent.created_at).getTime()) < 60000) {
        return res.status(429).json({ error: 'RATE_LIMIT', wait: 60 });
    }

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // Store OTP
    await supabase.from('otp_codes').insert({ email, code, expires_at: expiresAt });

    // Send email via Resend
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) return res.status(500).json({ error: 'Email service not configured' });

    try {
        const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'SurveyBD <onboarding@resend.dev>',
                to: [email],
                subject: 'Your SurveyBD Verification Code',
                html: `
                    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1a1a2e;color:#e0e0e0;border-radius:16px;">
                        <h2 style="color:#818cf8;margin-bottom:8px;">SurveyBD</h2>
                        <p style="color:#a0a0b0;font-size:14px;margin-bottom:24px;">Your verification code is:</p>
                        <div style="background:#252545;border:1px solid #3b3b5c;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                            <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#818cf8;">${code}</span>
                        </div>
                        <p style="color:#a0a0b0;font-size:13px;">This code expires in <strong>10 minutes</strong>.</p>
                        <p style="color:#666;font-size:11px;margin-top:24px;">If you didn't request this, please ignore this email.</p>
                    </div>
                `
            })
        });

        if (!emailRes.ok) {
            const errBody = await emailRes.text();
            console.error('Resend error:', errBody);
            return res.status(500).json({ error: 'Failed to send email' });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Email send error:', err);
        return res.status(500).json({ error: 'Failed to send email' });
    }
}
