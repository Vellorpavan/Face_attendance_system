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
        
        console.log("--- Checking notifications table schema via dummy insert ---");
        
        const { data, error } = await sb.from('notifications').select('*').limit(1);
        
        if (error) {
            console.error("Error selecting from notifications:", error.message);
        } else if (data && data.length > 0) {
            console.log("ACTUAL COLUMNS:", Object.keys(data[0]));
        } else {
            console.log("No rows in notifications. Attempting dummy insert to detect schema.");
            const { error: insError } = await sb.from('notifications').insert({
                user_id: '00000000-0000-0000-0000-000000000000',
                title: 'Test',
                message: 'Test',
                type: 'approval',
                read_status: false
            });
            if (insError) {
                console.log("INSERT with user_id/read_status FAILED:", insError.message);
            } else {
                console.log("INSERT with user_id/read_status SUCCEEDED!");
            }
        }
    } catch(e) {
        console.error("Script Error:", e);
    }
}
run();
