import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://exryasirnrgwzjxkmwme.supabase.co';
const supabaseKey = 'sb_publishable_6TjHFbdehfcWxEkJvt7dlw_8420PRmE';

export const supabase = createClient(supabaseUrl, supabaseKey);
