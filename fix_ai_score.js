const fs = require('fs');
const files = ['verifier_dashboard.html', 'face_capture.html'];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    // In verifier_dashboard.html
    if (file === 'verifier_dashboard.html') {
        if (content.includes('ai_score: student.ai_score')) {
            content = content.replace(/ai_score:\s*student\.ai_score/g, '');
            // fix dangling commas
            content = content.replace(/,\s*\n\s*}/g, '\n                }');
            changed = true;
        }
    }
    
    // In face_capture.html
    if (file === 'face_capture.html') {
        if (content.includes('ai_score:')) {
            content = content.replace(/ai_score:\s*([^,}]+)[,}]?/g, function(match) {
                return '';
            });
            content = content.replace(/,\s*}/g, '}');
            changed = true;
        }
    }
    
    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Removed ai_score from ${file}`);
    } else {
        console.log(`No ai_score found to remove in ${file}`);
    }
}
