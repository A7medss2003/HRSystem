const fs = require('fs');
let file = fs.readFileSync('src/components/Login.tsx', 'utf8');

// The login component header has:
// className="bg-blue-600 p-8 text-center relative overflow-hidden"
// We want to make it use the primary color variable
file = file.replace(
  /className="bg-blue-600 p-8 text-center relative overflow-hidden"/,
  'className="p-8 text-center relative overflow-hidden" style={{ backgroundColor: \'var(--color-primary, #2563eb)\' }}'
);

// In case there is text-blue-100 or text-blue-600
file = file.replace(
  /className="text-blue-100 text-sm relative z-10"/,
  'className="text-white/90 text-sm relative z-10"'
);

file = file.replace(
  /<Settings size=\{40\} className="text-blue-600 hidden" \/>/,
  '<Settings size={40} className="text-white hidden" />'
);

fs.writeFileSync('src/components/Login.tsx', file);
