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
        
        const query = `
            ALTER TABLE public.student_requests
            ADD COLUMN ai_score integer;
        `;
        
        console.log("Schema test script loaded. Use MCP or SQL editor to run:", query);
    } catch(e) {
        console.error("Runtime Error", e);
    }
}
run();
