const fs = require('fs');
let html = fs.readFileSync('verifier_dashboard.html', 'utf8');

// I am going to make sure that the badges render the actual count. 
// Right now, if window.systemCounts.year[y] is undefined, it shows 0.
// Let's check what the types of year, semester, section are.
// Usually, groupedData[y].count has the EXACT count of items inside that year!
// I should just use groupedData instead of window.systemCounts so it's guaranteed to be accurate.

html = html.replace(/\window\.systemCounts\.year\[y\]/g, "groupedData[y].count");
html = html.replace(/\window\.systemCounts\.semester\[\x60\$\{selectedYear\}-\$\{sem\}\x60\]/g, "sems[sem].count");
html = html.replace(/\window\.systemCounts\.section\[\x60\$\{selectedYear\}-\$\{selectedSemester\}-\$\{sec\}\x60\]/g, "secs[sec].length");

fs.writeFileSync('verifier_dashboard.html', html);
console.log('Fixed counts to use groupedData directly');
