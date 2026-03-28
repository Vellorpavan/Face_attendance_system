const fs = require('fs');

// Fix face_capture.html
let capture = fs.readFileSync('face_capture.html', 'utf8');
let cChanged = false;
let lines = capture.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('face_descriptor:')) {
        lines[i] = Object.hasOwn(lines, i) ? '' : ''; // dirty way to empty line
        cChanged = true;
    }
}
if (cChanged) {
    fs.writeFileSync('face_capture.html', lines.join('\n'));
    console.log("Fixed face_descriptor in face_capture.html by removing lines");
}

// Fix verifier_dashboard.html
let verifier = fs.readFileSync('verifier_dashboard.html', 'utf8');
let vChanged = false;
lines = verifier.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('face_descriptor:')) {
        lines[i] = ''; 
        vChanged = true;
    }
}
if (vChanged) {
    fs.writeFileSync('verifier_dashboard.html', lines.join('\n'));
    console.log("Fixed face_descriptor in verifier_dashboard.html by removing lines");
}
