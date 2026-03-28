// ─────────────────────────────────────────────
//  Supabase client — shared across all pages
//  SVPP ATTENDANCE (FACE RECOGNITION)
// ─────────────────────────────────────────────

const SUPABASE_URL = window.CONFIG?.SUPABASE_URL || '';
const SUPABASE_ANON = window.CONFIG?.SUPABASE_ANON || '';

if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.error('Missing Supabase config. Run: node setup.js (after configuring .env)');
}

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

/**
 * Simple HTML escaping to prevent XSS.
 * Use this when you must use innerHTML for rendering user-provided data.
 */
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Detect role for a signed-in Supabase user.
 * Returns: 'admin' | 'teacher' | 'verifier' | 'student'
 */
async function getUserRole(user) {
    const email = (user.email || '').toLowerCase().trim();

    // 1. Admin check (Database driven)
    const { data: adminData } = await sb
        .from('admins')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (adminData) return 'admin';

    // 3. Verifier check
    if (email === 'mohammed.shohel9@gmail.com') return 'verifier';
    const { data: vData } = await sb
        .from('verifiers')
        .select('id')
        .eq('email', email)
        .maybeSingle();
    if (vData) return 'verifier';

    // 4. Teacher check
    const { data: tData } = await sb
        .from('authorized_teachers')
        .select('id')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (tData) return 'teacher';
    
    // 5. Default: student
    return 'student';
}

/**
 * Global route protection helper.
 * Ensures session exists and user has an allowed role.
 * @param {string[]} allowedRoles 
 */
async function protectRoute(allowedRoles = []) {
    const { data: { session }, error: sessionErr } = await sb.auth.getSession();
    
    if (sessionErr || !session) {
        console.warn("No session found. Redirecting...");
        window.location.href = 'index.html';
        return { session: null, user: null, role: null };
    }

    const user = session.user;
    const role = await getUserRole(user);

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        console.error(`Access Denied: '${role}' is not in [${allowedRoles.join(', ')}]`);
        alert("Access Denied: You don't have permission to access this page.");
        window.location.href = 'index.html';
        return { session: null, user: null, role: null };
    }

    return { session, user, role };
}

