const groupedData = {
  "1": {
    "count": 1,
    "semesters": {
      "2": {
        "count": 1,
        "sections": {
          "A": [
            { "id": "uuid", "uid": "uuid", "name": "pavan" }
          ]
        }
      }
    }
  }
};
// UI loop for Years View
console.log("Years View:");
const yearLabels = { '1': 'First Year', '2': 'Second Year', '3': 'Third Year', '4': 'Fourth Year' };
Object.keys(groupedData).sort().forEach(y => {
    const count = groupedData[y].count;
    const label = yearLabels[y] || `${y} Year`;
    console.log(`- ${label} (Count: ${count})`);
});

// UI loop for Semesters View (selectedYear = '1')
console.log("\nSemesters View (Year 1):");
const selectedYear = '1';
const sems = groupedData[selectedYear]?.semesters || {};
Object.keys(sems).sort().forEach(sem => {
    const count = sems[sem].count;
    console.log(`- Semester ${sem} (Count: ${count})`);
});
