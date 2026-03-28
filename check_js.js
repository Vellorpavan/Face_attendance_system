const fs = require('fs');

function checkFile(path) {
    try {
        const html = fs.readFileSync(path, 'utf8');
        const jsMatches = html.match(/<script>([\s\S]+?)<\/script>/g);
        if(!jsMatches) {
            console.log(path + ": No JS found");
            return;
        }
        
        jsMatches.forEach((scriptBlock, idx) => {
            const js = scriptBlock.replace(/<\/?script>/g, '');
            try {
                // Using new Function to catch basic syntax errors
                new Function(js);
                console.log(path + " script " + idx + ": OK");
            } catch (e) {
                console.error(path + " script " + idx + ": SYNTAX ERROR");
                console.error(e.message);
                
                // Write out the bad js for debugging
                fs.writeFileSync('bad_js_' + idx + '.js', js);
            }
        });
    } catch (e) {
        console.error("Error reading " + path + ": " + e.message);
    }
}

checkFile('/Users/pavan/Desktop/collage face/attendance_session.html');
checkFile('/Users/pavan/Desktop/collage face/teacher_face_capture.html');
