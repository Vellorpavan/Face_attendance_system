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

        const { data, error } = await sb.from('attendance').select('*').limit(1);
        if (error) {
            console.error("Error fetching attendance:", error);
            const { data: cols, error: err2 } = await sb.rpc('get_columns', { table_name: 'attendance' });
            if (err2) console.error("RPC error:", err2);
            else console.log("Columns via RPC:", cols);
        } else if (data && data.length > 0) {
            console.log("Attendance columns:", Object.keys(data[0]));
        } else {
            console.log("No records in attendance table.");
        }
    } catch (e) {
        console.error("Script error:", e);
    }
}
run();
