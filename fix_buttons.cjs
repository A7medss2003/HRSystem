const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

// The generic mistake was replacing EVERYTHING that matched.
// Let's first restore all of them to just have their own delete button.

content = content.replace(
  /<button type="button" onClick=\{\(\) => printHandoverReceipt\(eq\.name, eq\.details\)\} className="absolute top-2 left-10 p-1\.5 text-slate-500 hover:bg-slate-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="طباعة إيصال الاستلام"><Printer size=\{16\}\/><\/button>\\n\s*\{!readOnly && <button type="button" onClick=\{\(\) => handleDeleteEquipment\(eq\.id\)\} className="absolute top-2 left-2 p-1\.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size=\{16\}\/><\/button>\}\s*<button type="button" onClick=\{\(\) => printHandoverReceipt\(eq\.name, eq\.details\)\} className="absolute top-2 left-10 p-1\.5 text-slate-500 hover:bg-slate-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="طباعة إيصال الاستلام">\s*<Printer size=\{16\} \/>\s*<\/button>/g,
  ""
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', content);
