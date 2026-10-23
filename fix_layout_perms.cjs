const fs = require('fs');
let file = fs.readFileSync('src/components/Layout.tsx', 'utf8');

file = file.replace(
  /if \(currentMenu === 'roles' && \(user\.role === 'admin' \|\| user\.role === 'developer'\)\) return <Roles \/>;/,
  "if (currentMenu === 'roles' && (user.role === 'admin' || user.role === 'developer' || user.permissions?.includes('all'))) return <Roles />;"
);

fs.writeFileSync('src/components/Layout.tsx', file);
