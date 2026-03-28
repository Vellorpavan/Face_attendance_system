const fs = require('fs');

function cleanFile(file, stringToRemove) {
    if (!fs.existsSync(file)) return;
    let lines = fs.readFileSync(file, 'utf8').split('\n');
    let changed = false;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(stringToRemove)) {
            lines[i] = Object.hasOwn(lines, i) ? '' : ''; // remove line
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(file, lines.join('\n'));
        console.log("Fixed " + stringToRemove + " in " + file);
    }
}

cleanFile('face_capture.html', 'face_descriptor:');
cleanFile('verifier_dashboard.html', 'face_descriptor:');
