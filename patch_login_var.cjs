const fs = require('fs');
let file = fs.readFileSync('src/components/Login.tsx', 'utf8');

// Replace blue buttons with custom color in login
file = file.replace(
  /className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-6 flex items-center justify-center gap-2"/,
  'className="w-full text-white font-bold py-3 rounded-lg transition-colors shadow-lg mt-6 flex items-center justify-center gap-2" style={{ backgroundColor: \'var(--color-primary, #2563eb)\' }}'
);

file = file.replace(
  /className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"/g,
  'className="w-full text-white font-bold py-3 rounded-lg transition-colors shadow-lg" style={{ backgroundColor: \'var(--color-primary, #2563eb)\' }}'
);

file = file.replace(
  /className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"/g,
  'className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: \'var(--color-primary, #2563eb)\' }}'
);

fs.writeFileSync('src/components/Login.tsx', file);
