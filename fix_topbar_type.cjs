const fs = require('fs');
let file = fs.readFileSync('src/components/Topbar.tsx', 'utf8');

file = file.replace(
  /user: \{ role: string, username: string \},/,
  "user: { role: string, username: string, permissions?: string[] },"
);

fs.writeFileSync('src/components/Topbar.tsx', file);
