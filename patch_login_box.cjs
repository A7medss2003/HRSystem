const fs = require('fs');
let file = fs.readFileSync('src/components/Login.tsx', 'utf8');

// Isolate the login box so it doesn't take the full screen background if we want to remove the huge background
file = file.replace(
  /className="min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden"/,
  'className="flex-1 flex items-center justify-center p-4 relative overflow-hidden"'
);

fs.writeFileSync('src/components/Login.tsx', file);
