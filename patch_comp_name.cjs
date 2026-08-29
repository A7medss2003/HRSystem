const fs = require('fs');

let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
if (!sidebar.includes('systemSettings.companyName')) {
  sidebar = sidebar.replace(
    "export default function Sidebar({ currentMenu, setCurrentMenu, user, onLogout, isCollapsed, toggleCollapse }: SidebarProps) {",
    "export default function Sidebar({ currentMenu, setCurrentMenu, user, onLogout, isCollapsed, toggleCollapse }: SidebarProps) {\n  const { systemSettings } = require('../store').useStore();"
  );
  sidebar = sidebar.replace(
    "مركز البنيان",
    "{systemSettings?.companyName || 'نظام إدارة الموارد البشرية'}"
  );
  fs.writeFileSync('src/components/Sidebar.tsx', sidebar);
}

let login = fs.readFileSync('src/components/Login.tsx', 'utf8');
if (!login.includes('systemSettings')) {
  login = login.replace(
    "export default function Login({ onLogin }: { onLogin: (role: string, username: string) => void }) {",
    "export default function Login({ onLogin }: { onLogin: (role: string, username: string) => void }) {\n  const { systemSettings } = require('../store').useStore();"
  );
  login = login.replace(
    "مركز البنيان",
    "{systemSettings?.companyName || 'نظام إدارة الموارد البشرية'}"
  );
  fs.writeFileSync('src/components/Login.tsx', login);
}
