require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const sb = createClient(supabaseUrl, supabaseKey);

async function checkInsert() {
    const { data: tchs } = await sb.from('authorized_teachers').select('id').limit(1);
    if (!tchs || tchs.length === 0) {
        console.log("No teachers found");
        return;
    }
    const tid = tchs[0].id;
    console.log("Using teacher id:", tid);

    const payload = {
        teacher_id: tid,
        subject: "Test Subj",
        branch: "CSE",
        year: 1,
        semester: 1,
        day: "MON",
        period: "P1"
    };

    const { data, error } = await sb.from('timetable').insert([payload]);
    console.log("Insert result data:", data);
    console.log("Insert result error:", error ? error.message : "Success");

    if (!error) {
        await sb.from('timetable').delete().match(payload);
        console.log("Cleaned up test row.");
    }
}

checkInsert();
