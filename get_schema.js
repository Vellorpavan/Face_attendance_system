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
        
        const { data: att, error } = await sb.from('attendance').select('*').limit(1);
        if (error) console.error(error);
        if (att && att.length > 0) {
            console.log("Attendance schema:", Object.keys(att[0]));
        } else {
            console.log("No records found in attendance table.");
        }
    } catch(e) {
        console.error("Error", e);
    }
}
run();
