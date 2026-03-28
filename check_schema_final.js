require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function run() {
    try {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
        if (!SUPABASE_URL || !SUPABASE_ANON) {
            console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
            return;
        }
        const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
        
        console.log("--- Checking notifications table ---");
        const { data: n, error: ne } = await sb.from('notifications').select('*').limit(1);
        if (ne) console.error("Error notifications:", ne);
        else if (n && n.length > 0) console.log("Columns:", Object.keys(n[0]));
        else console.log("No records found in notifications table.");

        console.log("--- Checking student_requests table ---");
        const { data: s, error: se } = await sb.from('student_requests').select('*').limit(1);
        if (se) console.error("Error student_requests:", se);
        else if (s && s.length > 0) console.log("Columns:", Object.keys(s[0]));
        else console.log("No records found in student_requests table.");

        console.log("--- Checking students table ---");
        const { data: st, error: ste } = await sb.from('students').select('*').limit(1);
        if (ste) console.error("Error students:", ste);
        else if (st && st.length > 0) console.log("Columns:", Object.keys(st[0]));
        else console.log("No records found in students table.");

    } catch(e) {
        console.error("Error", e);
    }
}
run();
