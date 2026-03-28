require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

sb.from('students').select('*').limit(1).then(({ data, error }) => {
    if (error) {
        console.error("SUPABASE ERROR:", error.message);
    } else {
        console.log("SUPABASE SUCCESS:", data);
    }
});
