const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

if (!content.includes('طباعة الملف')) {
  content = content.replace("Trash2, Star, Gift, Download } from 'lucide-react';", "Trash2, Star, Gift, Download, Printer } from 'lucide-react';");
  
  const printButton = `
            <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm font-medium print:hidden">
              <Printer size={18} />
              طباعة الملف
            </button>`;
            
  content = content.replace(
    /<button onClick=\{onBack\} className="px-5 py-2\.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium">/g,
    printButton + '\n            <button onClick={onBack} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium">'
  );
  
  // also add for readOnly mode. Right now readOnly hides the buttons block. 
  // Let's find: `{!readOnly && (` and change the block to render print always.
  // Actually, there is a better way. Let's find `{!readOnly && (` and make the wrapper div render always, but conditionally render the save/delete/cancel buttons inside.
  
  fs.writeFileSync('src/pages/EmployeeDetail.tsx', content);
}
