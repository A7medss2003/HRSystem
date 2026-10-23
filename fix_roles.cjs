const fs = require('fs');
let file = fs.readFileSync('src/pages/Roles.tsx', 'utf8');

file = file.replace(/\\`/g, "`");
file = file.replace(/\\\$/g, "$");

fs.writeFileSync('src/pages/Roles.tsx', file);
