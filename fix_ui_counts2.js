const fs = require('fs');
let html = fs.readFileSync('verifier_dashboard.html', 'utf8');

// The original implementation used a span with window.systemCounts...
// The logic from previous JS replacement was slightly off because I used a bad regex. Let's do a strict string replace.

html = html.replace(/\<span class="badge" title="Pending"\>\$\{window\.systemCounts\.year\[y\] \|\| 0\}\<\/span\>/g, '<span class="badge" title="Pending">${count}</span>');
html = html.replace(/\<span class="badge" title="Pending"\>\$\{window\.systemCounts\.semester\[\x60\$\{selectedYear\}-\$\{sem\}\x60\] \|\| 0\}\<\/span\>/g, '<span class="badge" title="Pending">${count}</span>');
html = html.replace(/\<span class="badge" title="Pending"\>\$\{window\.systemCounts\.section\[\x60\$\{selectedYear\}-\$\{selectedSemester\}-\$\{sec\}\x60\] \|\| 0\}\<\/span\>/g, '<span class="badge" title="Pending">${count}</span>');

fs.writeFileSync('verifier_dashboard.html', html);
console.log('Fixed counts successfully!');
