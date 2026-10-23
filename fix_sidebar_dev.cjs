const fs = require('fs');
let file = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

file = file.replace(
  /const menuItems = allItems\.filter\(item => \{[\s\S]*?return false;\s*\}\);/,
  `const menuItems = allItems.filter(item => {
    if (item.id === 'dev_settings' && user.role !== 'developer') return false;
    if (user.role === 'admin' || user.role === 'developer' || user.permissions?.includes('all')) return true;
    if (item.roles.includes(user.role)) return true;
    if (item.perm && user.permissions?.includes(item.perm)) return true;
    return false;
  });`
);

fs.writeFileSync('src/components/Sidebar.tsx', file);
