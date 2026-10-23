const fs = require('fs');
let file = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// 1. Sidebar Container
file = file.replace(
  /className=\{clsx\("bg-slate-900 text-slate-300 flex flex-col fixed right-0 transition-all duration-300 border-l border-slate-800 rtl z-20 group", isCollapsed \? "w-20" : "w-64", isElectron \? "top-8 h-\[calc\(100vh-2rem\)\]" : "top-0 h-screen"\)\}/,
  'className={clsx("bg-white text-slate-600 flex flex-col fixed right-0 transition-all duration-300 border-l border-blue-100 shadow-[4px_0_24px_rgba(37,99,235,0.05)] rtl z-20 group", isCollapsed ? "w-24" : "w-72", isElectron ? "top-8 h-[calc(100vh-2rem)]" : "top-0 h-screen")}'
);

// 2. Toggle Button
file = file.replace(
  /className="absolute -left-3\.5 top-5 bg-slate-800 text-slate-300 border border-slate-700 rounded-full p-1\.5 z-30 shadow-md hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all cursor-pointer"/,
  'className="absolute -left-3.5 top-5 bg-white text-blue-600 border border-blue-200 rounded-full p-1.5 z-30 shadow-md hover:bg-blue-50 transition-all cursor-pointer"'
);

// 3. Header Area
file = file.replace(
  /className=\{clsx\("h-16 flex items-center border-b border-slate-800 bg-slate-950 transition-all duration-300 overflow-hidden", isCollapsed \? "px-2 justify-center" : "px-4"\)\}/,
  'className={clsx("h-[76px] flex items-center border-b border-blue-100 bg-blue-50/30 transition-all duration-300 overflow-hidden", isCollapsed ? "px-2 justify-center" : "px-5")}'
);

// 4. Logo Container
file = file.replace(
  /className=\{clsx\("bg-white\/10 rounded-lg flex items-center justify-center overflow-hidden p-1 shrink-0 transition-all duration-300", isCollapsed \? "w-10 h-10 ml-0" : "w-10 h-10 ml-3"\)\}/,
  'className={clsx("bg-white shadow-sm border border-blue-100 rounded-xl flex items-center justify-center overflow-hidden p-1 shrink-0 transition-all duration-300", isCollapsed ? "w-12 h-12 ml-0" : "w-12 h-12 ml-3")}'
);

// 5. Logo hidden icon
file = file.replace(
  /<Users size=\{20\} className="text-white hidden" \/>/,
  '<Users size={24} className="text-blue-600 hidden" />'
);

// 6. Header Text
file = file.replace(
  /<h1 className="text-white font-bold text-sm md:text-base leading-snug line-clamp-2">/,
  '<h1 className="text-blue-900 font-bold text-base md:text-lg leading-snug line-clamp-2">'
);

// 7. Menu Items Container
file = file.replace(
  /className="space-y-2 px-3"/,
  'className="space-y-3 px-4"'
);

// 8. Menu Item Buttons
file = file.replace(
  /isCollapsed \? 'justify-center p-3' : 'gap-3 px-4 py-3',/,
  "isCollapsed ? 'justify-center p-4' : 'gap-4 px-5 py-4',"
);

file = file.replace(
  /isActive\s*\?\s*'bg-blue-600\/10 text-blue-400 font-semibold'\s*:\s*'hover:bg-slate-800 hover:text-white'/,
  "isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold' : 'hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-medium'"
);

file = file.replace(
  /<Icon size=\{isCollapsed \? 24 : 20\} className=\{isActive \? 'text-blue-500' : 'text-slate-400 shrink-0'\} \/>/,
  "<Icon size={isCollapsed ? 28 : 24} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600 shrink-0'} />"
);

file = file.replace(
  /<span className="whitespace-nowrap">\{item.label\}<\/span>/,
  '<span className="whitespace-nowrap text-[15px]">{item.label}</span>'
);

// 9. Logout Section
file = file.replace(
  /className=\{clsx\("p-4 border-t border-slate-800", isCollapsed \? "flex justify-center" : ""\)\}/,
  'className={clsx("p-5 border-t border-blue-100", isCollapsed ? "flex justify-center" : "")}'
);

file = file.replace(
  /isCollapsed \? "justify-center p-3" : "w-full gap-3 px-4 py-3"/,
  'isCollapsed ? "justify-center p-4" : "w-full gap-4 px-5 py-4 text-[15px]"'
);

file = file.replace(
  /"flex items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"/,
  '"flex items-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 font-medium transition-colors"'
);

file = file.replace(
  /<LogOut size=\{isCollapsed \? 24 : 20\} className="shrink-0" \/>/,
  '<LogOut size={isCollapsed ? 28 : 24} className="shrink-0" />'
);

fs.writeFileSync('src/components/Sidebar.tsx', file);
