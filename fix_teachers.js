require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;

const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

async function fixTeachers() {
    console.log("Fetching all users...");
    const { data: users, error: fErr } = await sb.from('users').select('*');
    if (fErr) {
        console.error("Failed to fetch users", fErr);
        return;
    }

    console.log(`Found ${users.length} users. Checking for invalid teacher roles.`);

    let updatedCount = 0;
    for (const user of users) {
        if (!user.role) continue;
        const currentRole = user.role;
        const lowered = currentRole.toLowerCase().trim();

        if ((lowered === 'teacher' && currentRole !== 'teacher') || lowered === 'faculty') {
            console.log(`Updating role for user ${user.name || user.id} from '${currentRole}' to 'teacher'`);

            const { error: uErr } = await sb.from('users')
                .update({ role: 'teacher' })
                .eq('id', user.id);

            if (uErr) {
                console.error(`Failed to update user ${user.id}:`, uErr);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`Fixed ${updatedCount} teachers.`);
}

fixTeachers();
