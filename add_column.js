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
        
        // Use RPC to add the column, since we can't do DDL from the JS client directly without service role key or RPC
        // If we don't have an RPC, we will need to give instructions to the user.
        console.log("Checking if we have an RPC to execute SQL...");
        const { data, error } = await sb.rpc('exec_sql', { query: 'ALTER TABLE public.student_requests ADD COLUMN IF NOT EXISTS ai_score integer;' });
        
        if (error) {
            console.error("RPC Error:", error.message);
            console.log("---");
            console.log("Cannot add column automatically without service_role key or an RPC function.");
        } else {
            console.log("Successfully added the column!");
        }
    } catch(e) {
        console.error("Runtime Error", e);
    }
}
run();
