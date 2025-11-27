import { createClient } from '@supabase/supabase-js';
import { env } from './env';

if (!env.SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL environment variable');
}

if (!env.SUPABASE_ANON_KEY) {
    throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);