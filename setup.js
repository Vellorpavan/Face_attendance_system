#!/usr/bin/env node
/**
 * Setup script — generates config.js from .env for the web frontend.
 * Run: node setup.js
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const configPath = path.join(__dirname, 'config.js');

if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env file not found. Copy .env.example to .env and fill in your values.');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        env[key] = val;
    }
});

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
}

const config = `// AUTO-GENERATED from .env — DO NOT COMMIT
window.CONFIG = {
    SUPABASE_URL: '${env.SUPABASE_URL}',
    SUPABASE_ANON_KEY: '${env.SUPABASE_ANON_KEY}'
};
`;

fs.writeFileSync(configPath, config, 'utf-8');
console.log('config.js generated successfully from .env');
