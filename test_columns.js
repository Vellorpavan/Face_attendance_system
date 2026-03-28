require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
    let log = "";
    try {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
        if (!SUPABASE_URL || !SUPABASE_ANON) {
            console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
            return;
        }
        const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
        
        log += "--- Testing user_id/read_status ---\n";
        const { error: err1 } = await sb.from('notifications').insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            title: 'Test',
            message: 'Test',
            type: 'approval',
            read_status: false
        });
        if (err1) log += "user_id/read_status FAILED: " + err1.message + "\n";
        else log += "user_id/read_status SUCCEEDED\n";

        log += "--- Testing target_user_id/is_read ---\n";
        const { error: err2 } = await sb.from('notifications').insert({
            target_user_id: '00000000-0000-0000-0000-000000000000',
            title: 'Test',
            message: 'Test',
            type: 'approval',
            is_read: false
        });
        if (err2) log += "target_user_id/is_read FAILED: " + err2.message + "\n";
        else log += "target_user_id/is_read SUCCEEDED\n";

        fs.writeFileSync('schema_test_results.txt', log);
    } catch(e) {
        fs.writeFileSync('schema_test_results.txt', "Script Error: " + e.message);
    }
}
run();
