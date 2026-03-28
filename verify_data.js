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

        console.log("--- Checking teacher_subject_assignments ---");
        const { data: assignments, error: err1 } = await sb.from('teacher_subject_assignments').select('*').limit(5);
        if (err1) console.error(err1);
        console.log("Assignments Sample:", JSON.stringify(assignments, null, 2));
        if (assignments && assignments.length > 0) {
            console.log("Columns:", Object.keys(assignments[0]));
        }

        console.log("\n--- Checking for NULL teacher_id ---");
        const { data: nullTeachers, error: err2 } = await sb.from('teacher_subject_assignments').select('*').is('teacher_id', null);
        if (err2) console.error(err2);
        console.log("Rows with NULL teacher_id:", nullTeachers?.length || 0);

        console.log("\n--- Checking authorized_teachers ---");
        const { data: teachers, error: err3 } = await sb.from('authorized_teachers').select('*').limit(5);
        if (err3) console.error(err3);
        console.log("Teachers Sample:", JSON.stringify(teachers, null, 2));
        if (teachers && teachers.length > 0) {
            console.log("Columns:", Object.keys(teachers[0]));
        }

    } catch (e) {
        console.error("Error", e);
    }
}
run();
