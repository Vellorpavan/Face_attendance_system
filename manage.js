/**
 * SVPP ATTENDANCE (FACE RECOGNITION) — Management Utility
 * 
 * Usage:
 *  node manage.js --status  : Check Git and Supabase status
 *  node manage.js --push    : Sync changes to GitHub
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function log(msg) {
    console.log(`[MANAGE] ${msg}`);
}

function checkGitStatus() {
    try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
        const status = execSync('git status --short').toString().trim();
        log(`Current Branch: ${branch}`);
        if (status) {
            log('Ungit committed changes found:');
            console.log(status);
        } else {
            log('Working directory clean.');
        }
    } catch (err) {
        log('Error checking Git status: ' + err.message);
    }
}

async function checkSupabaseStatus() {
    log('Checking Supabase configuration...');
    const configPath = path.join(__dirname, 'supabase_config.js');
    if (fs.existsSync(configPath)) {
        log('supabase_config.js found.');
        // Basic static check or we could try a ping if we had a node-compatible client here
    } else {
        log('WARNING: supabase_config.js is missing!');
    }
}

if (args.includes('--status')) {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    checkGitStatus();
    checkSupabaseStatus();
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
} else if (args.includes('--push')) {
    log('Syncing to GitHub...');
    try {
        execSync('git add .');
        execSync('git commit -m "chore: sync project state"');
        log('Changes committed. Run push_to_github.sh to finalize upload with token.');
    } catch (err) {
        log('Git sync failed (maybe no changes?): ' + err.message);
    }
} else {
    log('Welcome to SVPP AI Management Utility');
    log('Run with --status to check project health.');
}
