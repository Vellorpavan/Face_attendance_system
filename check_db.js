require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

async function check() {
    const { data: auth } = await sb.from('authorized_teachers').select('email').eq('is_active', true);
    const { data: users } = await sb.from('users').select('email, name').eq('role', 'teacher').eq('is_active', true);

    console.log("AUTHORIZED ACTIVE EMAILS:", auth.map(a => a.email));
    console.log("USERS ACTIVE TEACHERS:", users.map(u => `${u.name} (${u.email})`));
}
check();
