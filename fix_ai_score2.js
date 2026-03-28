const fs = require('fs');

// Fix verifier_dashboard.html
let verifier = fs.readFileSync('verifier_dashboard.html', 'utf8');
let vChanged = false;
if (verifier.includes('ai_score:')) {
    verifier = verifier.replace(/,\s*ai_score:\s*student\.ai_score/g, '');
    verifier = verifier.replace(/ai_score:\s*student\.ai_score\s*,?/g, '');
    
    // UI badge
    verifier = verifier.replace(/\$\{st\.ai_score !== undefined.*\}/g, '');
    vChanged = true;
}

if (vChanged) {
    fs.writeFileSync('verifier_dashboard.html', verifier);
    console.log("Fixed verifier_dashboard.html");
}

// Fix face_capture.html
let capture = fs.readFileSync('face_capture.html', 'utf8');
let cChanged = false;
if (capture.includes('ai_score:')) {
    capture = capture.replace(/,\s*ai_score:\s*aiScoreVal/g, '');
    capture = capture.replace(/ai_score:\s*aiScoreVal\s*,?/g, '');
    cChanged = true;
}

if (cChanged) {
    fs.writeFileSync('face_capture.html', capture);
    console.log("Fixed face_capture.html");
}
