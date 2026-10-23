const fs = require('fs');
let file = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const isElectronCheck = `
  const customLogo = localStorage.getItem('app_logo');
  const isElectron = typeof window !== 'undefined' && (window as any).require;
`;
file = file.replace(/  const customLogo = localStorage\.getItem\('app_logo'\);/, isElectronCheck);

file = file.replace(
  /className=\{clsx\("bg-slate-900 text-slate-300 flex flex-col h-screen fixed right-0 top-0 transition-all duration-300 border-l border-slate-800 rtl z-20 group", isCollapsed \? "w-20" : "w-64"\)\}/,
  'className={clsx("bg-slate-900 text-slate-300 flex flex-col fixed right-0 transition-all duration-300 border-l border-slate-800 rtl z-20 group", isCollapsed ? "w-20" : "w-64", isElectron ? "top-8 h-[calc(100vh-2rem)]" : "top-0 h-screen")}'
);

fs.writeFileSync('src/components/Sidebar.tsx', file);
