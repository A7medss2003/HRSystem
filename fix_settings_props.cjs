const fs = require('fs');

let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
layout = layout.replace(
  "return <Settings />;",
  "return <Settings user={user} />;"
);
fs.writeFileSync('src/components/Layout.tsx', layout);

let settings = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
settings = settings.replace(
  "export default function Settings() {",
  "export default function Settings({ user }: { user?: { username: string } }) {"
);
settings = settings.replace(
  "  const { user, employees, updateEmployee } = useStore();",
  "  const { employees, updateEmployee } = useStore();"
);
// Handle potential undefined user
settings = settings.replace(
  "const un = user.username.toLowerCase();",
  "const un = (user?.username || '').toLowerCase();"
);

fs.writeFileSync('src/pages/Settings.tsx', settings);
