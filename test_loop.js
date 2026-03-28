const sampleData = [{
    id: '2e746072-8cf3-45be-a539-6f75c7065901',
    uid: '1193a7c9-f6d2-44bd-b4ba-20144114033f',
    name: 'pavan',
    roll_number: '25G01A4306',
    year: '1',
    semester: '2',
    branch: 'AI',
    section: 'A',
    status: 'pending'
}];

let groupedData = {};
sampleData.forEach(s => {
    const y = s.year || 'Unknown';
    const sem = s.semester || 'Unknown';
    const sec = s.section || 'None';

    if (!groupedData[y]) groupedData[y] = { count: 0, semesters: {} };
    if (!groupedData[y].semesters[sem]) groupedData[y].semesters[sem] = { count: 0, sections: {} };
    if (!groupedData[y].semesters[sem].sections[sec]) groupedData[y].semesters[sem].sections[sec] = [];

    groupedData[y].semesters[sem].sections[sec].push(s);
    groupedData[y].semesters[sem].count++;
    groupedData[y].count++;
});
console.log(JSON.stringify(groupedData, null, 2));
