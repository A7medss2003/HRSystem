const fs = require('fs');
let file = fs.readFileSync('src/components/Topbar.tsx', 'utf8');

if (!file.includes('Menu,')) {
  file = file.replace(/import { Bell,/, 'import { Bell, Menu,');
}

fs.writeFileSync('src/components/Topbar.tsx', file);
