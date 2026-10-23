const fs = require('fs');
let file = fs.readFileSync('src/components/Layout.tsx', 'utf8');

file = file.replace(
  /<div \n      className="min-h-screen bg-slate-50 font-sans relative" \n      dir="rtl"/,
  '<div \n      className="min-h-screen bg-[#f4f7f9] font-sans relative" \n      dir="rtl"'
);

file = file.replace(
  /\{customBg && <div className="absolute inset-0 bg-slate-900\/50 backdrop-blur-sm z-0 pointer-events-none"><\/div>\}/,
  '{customBg && <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-0 pointer-events-none"></div>}'
);

fs.writeFileSync('src/components/Layout.tsx', file);
