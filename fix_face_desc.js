const fs = require('fs');

// Fix face_capture.html
let capture = fs.readFileSync('face_capture.html', 'utf8');
let cChanged = false;
if (capture.includes('face_descriptor:')) {
    capture = capture.replace(/,\s*face_descriptor:\s*result\.descriptor/g, '');
    cChanged = true;
}

if (cChanged) {
    fs.writeFileSync('face_capture.html', capture);
    console.log("Fixed face_capture.html");
}

// Fix verifier_dashboard.html
let verifier = fs.readFileSync('verifier_dashboard.html', 'utf8');
let vChanged = false;
if (verifier.includes('face_descriptor:')) {
    verifier = verifier.replace(/,\s*face_descriptor:\s*student\.face_descriptor/g, '');
    vChanged = true;
}

if (vChanged) {
    fs.writeFileSync('verifier_dashboard.html', verifier);
    console.log("Fixed verifier_dashboard.html");
}
