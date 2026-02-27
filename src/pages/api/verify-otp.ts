import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://exryasirnrgwzjxkmwme.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_KEY || 'sb_publishable_6TjHFbdehfcWxEkJvt7dlw_8420PRmE'
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

    // Find valid OTP
    const { data: otp } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!otp) return res.status(400).json({ valid: false, error: 'INVALID_CODE' });

    // Check expiry
    if (new Date(otp.expires_at) < new Date()) {
        return res.status(400).json({ valid: false, error: 'EXPIRED' });
    }

    // Mark OTP as used
    await supabase.from('otp_codes').update({ used: true }).eq('id', otp.id);

    return res.status(200).json({ valid: true });
}
