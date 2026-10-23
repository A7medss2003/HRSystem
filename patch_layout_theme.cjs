const fs = require('fs');
let file = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Replace mr-64 with mr-72 and mr-20 with mr-24
file = file.replace(/mr-64/g, 'mr-72');
file = file.replace(/mr-20/g, 'mr-24');

fs.writeFileSync('src/components/Layout.tsx', file);
