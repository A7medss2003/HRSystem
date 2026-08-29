const fs = require('fs');
let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

sidebar = sidebar.replace(
  'className="absolute -left-3 top-6 bg-blue-600 text-white rounded-full p-1 z-30 shadow-lg hover:bg-blue-500 transition-colors"',
  'className="absolute -left-3.5 top-5 bg-slate-800 text-slate-300 border border-slate-700 rounded-full p-1.5 z-30 shadow-md hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all cursor-pointer"'
);

sidebar = sidebar.replace(
  'className="w-full h-full object-contain" onError',
  'className="w-full h-full object-contain drop-shadow-md scale-95" onError'
);

sidebar = sidebar.replace(
  'className="text-white font-bold tracking-wider text-xl leading-tight whitespace-nowrap overflow-hidden"',
  'className="text-white font-bold text-sm md:text-base leading-snug line-clamp-2"'
);

fs.writeFileSync('src/components/Sidebar.tsx', sidebar);
