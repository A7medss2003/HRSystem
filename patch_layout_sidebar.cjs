const fs = require('fs');
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');

layout = layout.replace(
  /export default function Layout\(\{ user, onLogout \}: \{ user: \{ role: string, username: string \}, onLogout: \(\) => void \}\) \{/,
  "export default function Layout({ user, onLogout }: { user: { role: string, username: string, permissions: string[] }, onLogout: () => void }) {"
);

fs.writeFileSync('src/components/Layout.tsx', layout);

let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

sidebar = sidebar.replace(
  /user: \{ role: string, username: string \};/,
  "user: { role: string, username: string, permissions: string[] };"
);

// We need to modify the logic in Sidebar.tsx to check permissions!
// Currently it checks item.roles.includes(user.role).
// We should change it to also check permissions.

fs.writeFileSync('src/components/Sidebar.tsx', sidebar);
