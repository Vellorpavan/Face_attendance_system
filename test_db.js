require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;

const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

async function check() {
  console.log('--- SUBJECTS ---');
  const { data: s } = await sb.from('subjects').select('*');
  console.log(s);

  console.log('\n--- TEACHER_SUBJECT_ASSIGNMENTS ---');
  const { data: tsa } = await sb.from('teacher_subject_assignments').select('*');
  console.log(tsa);

  console.log('\n--- TIMETABLE ---');
  const { data: tt } = await sb.from('timetable').select('*');
  console.log(tt);
}

check();
