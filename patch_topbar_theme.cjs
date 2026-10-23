const fs = require('fs');
let file = fs.readFileSync('src/components/Topbar.tsx', 'utf8');

file = file.replace(
  /<header className="h-16 bg-white\/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-8" dir="rtl">/,
  '<header className="h-[76px] bg-white/90 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50 flex items-center justify-between px-8 shadow-sm" dir="rtl">'
);

fs.writeFileSync('src/components/Topbar.tsx', file);
