const fs = require('fs');
let content = fs.readFileSync('src/pages/Attendance.tsx', 'utf8');
console.log(content.split('\n').length);
