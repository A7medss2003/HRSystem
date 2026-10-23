const fs = require('fs');
let file = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// We want to use the CSS variable in the sidebar if possible. But since Tailwind uses specific classes, we'll use inline style for the active state to apply the custom variable color.
file = file.replace(
  /className=\{clsx\(\n\s*'w-full flex items-center rounded-lg transition-all duration-200',\n\s*isCollapsed \? 'justify-center p-4' : 'gap-4 px-5 py-4',\n\s*isActive \? 'bg-blue-600 text-white shadow-md shadow-blue-600\/20 font-bold' : 'hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm text-slate-600 font-medium'\n\s*\)\}/,
  `className={clsx(
                    'w-full flex items-center rounded-lg transition-all duration-200',
                    isCollapsed ? 'justify-center p-4' : 'gap-4 px-5 py-4',
                    isActive ? 'text-white shadow-md font-bold' : 'hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm text-slate-600 font-medium'
                  )}
                  style={isActive ? { backgroundColor: 'var(--color-primary, #2563eb)' } : {}}`
);

fs.writeFileSync('src/components/Sidebar.tsx', file);
