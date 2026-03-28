require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

async function check() {
    const { data, error } = await sb.from('authorized_teachers').select('*').limit(1);
    console.log(JSON.stringify({ data, error }, null, 2));
}
check();
