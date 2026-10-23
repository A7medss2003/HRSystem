const fs = require('fs');
let file = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

file = file.replace(
  /\{ id: 'roles', label: 'الصلاحيات', icon: Shield, roles: \['admin', 'developer'\], perm: 'all' \},/,
  ""
);

fs.writeFileSync('src/components/Sidebar.tsx', file);
