const fs = require('fs');
let file = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Ensure hover colors are properly pronounced for menu items
file = file.replace(
  /'hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-medium'/,
  "'hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm text-slate-600 font-medium'"
);

fs.writeFileSync('src/components/Sidebar.tsx', file);
