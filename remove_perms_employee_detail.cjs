const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

const regex = /\{isAdmin && \(\s*<div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-8 col-span-1 md:col-span-2 lg:col-span-3">[\s\S]*?<\/div>\s*\)\}/;

file = file.replace(regex, "");

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
