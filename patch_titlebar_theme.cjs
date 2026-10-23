const fs = require('fs');
let file = fs.readFileSync('src/components/TitleBar.tsx', 'utf8');

file = file.replace(
  /className="h-8 bg-slate-900 flex items-center justify-between text-slate-300 select-none z-\[9999\] fixed top-0 left-0 right-0"/,
  'className="h-8 bg-white border-b border-blue-100 flex items-center justify-between text-blue-900 select-none z-[9999] fixed top-0 left-0 right-0"'
);

file = file.replace(
  /className="flex h-full" style=\{\{ WebkitAppRegion: 'no-drag' \}\} dir="ltr">/,
  'className="flex h-full text-slate-500" style={{ WebkitAppRegion: \'no-drag\' }} dir="ltr">'
);

file = file.replace(
  /hover:bg-slate-800 transition-colors/g,
  'hover:bg-blue-50 hover:text-blue-700 transition-colors'
);

fs.writeFileSync('src/components/TitleBar.tsx', file);
