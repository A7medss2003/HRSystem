const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeeList.tsx', 'utf8');
content = content.replace(/\{ label: 'ممتاز 95%', val: 95 \},\n                    \{ label: 'جيد جداً 85%', val: 85 \},\n                    \{ label: 'جيد 75%', val: 75 \},\n                    \{ label: 'مقبول 65%', val: 65 \},/, "{ label: 'ممتاز 9.5', val: 9.5 },\n                    { label: 'جيد جداً 8.5', val: 8.5 },\n                    { label: 'جيد 7.5', val: 7.5 },\n                    { label: 'مقبول 6.5', val: 6.5 },");
fs.writeFileSync('src/pages/EmployeeList.tsx', content);
