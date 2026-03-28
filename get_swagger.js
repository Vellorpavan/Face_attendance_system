const fs = require('fs');
async function run() {
    try {
        const configContent = fs.readFileSync('supabase_config.js', 'utf8');
        const urlMatch = configContent.match(/const SUPABASE_URL = '(.*?)';/);
        const keyMatch = configContent.match(/const SUPABASE_KEY = '(.*?)';/);
        if (!urlMatch || !keyMatch) return;
        
        const url = urlMatch[1] + '/rest/v1/?apikey=' + keyMatch[1];
        const res = await fetch(url);
        const json = await res.json();
        fs.writeFileSync('schema.json', JSON.stringify(json.definitions.attendance.properties, null, 2));
        console.log("Success");
    } catch(e) {
        console.error(e);
    }
}
run();
