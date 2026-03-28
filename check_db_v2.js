require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

async function check() {
    console.log("Checking authorized_teachers...");
    const { data: auth, error: e1 } = await sb.from('authorized_teachers').select('email, is_active');
    if (e1) console.error("Error auth:", e1);
    else console.log("All Auth Teachers:", auth);

    console.log("Checking users table (teachers)...");
    const { data: users, error: e2 } = await sb.from('users').select('email, name, role, is_active').eq('role', 'teacher');
    if (e2) console.error("Error users:", e2);
    else console.log("All User Teachers:", users);
}
check();
