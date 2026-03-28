require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
    let log = "";
    try {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
        if (!SUPABASE_URL || !SUPABASE_ANON) {
            fs.writeFileSync('schema_log.txt', "Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
            return;
        }
        const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
        
        log += "--- Checking student_requests table ---\n";
        const { data: s, error: se } = await sb.from('student_requests').select('*').limit(1);
        if (se) log += "Error student_requests: " + se.message + "\n";
        else if (s && s.length > 0) log += "student_requests Columns: " + Object.keys(s[0]).join(', ') + "\n";
        else log += "No records found in student_requests table.\n";

        log += "--- Checking notifications table ---\n";
        const { data: n, error: ne } = await sb.from('notifications').select('*').limit(1);
        if (ne) log += "Error notifications: " + ne.message + "\n";
        else if (n && n.length > 0) log += "notifications Columns: " + Object.keys(n[0]).join(', ') + "\n";
        else log += "No records found in notifications table.\n";

        fs.writeFileSync('schema_log.txt', log);
    } catch(e) {
        fs.writeFileSync('schema_log.txt', "Script Error: " + e.message);
    }
}
run();
