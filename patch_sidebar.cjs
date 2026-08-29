const fs = require('fs');

let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
if (!sidebar.includes('audit_logs')) {
  // Add icon
  sidebar = sidebar.replace(
    "Activity, ShieldAlert } from 'lucide-react';",
    "Activity, ShieldAlert, FileSearch } from 'lucide-react';"
  );
  
  // Add menu item under Admin section
  const auditLogItem = `
  { id: 'audit_logs', label: 'سجل العمليات', icon: FileSearch, permission: 'manage_employees' },
`;
  sidebar = sidebar.replace(
    /\{ id: 'roles', label: 'الصلاحيات والأدوار', icon: Shield, permission: 'manage_employees' \},/,
    "{ id: 'roles', label: 'الصلاحيات والأدوار', icon: Shield, permission: 'manage_employees' },\n" + auditLogItem
  );
  
  fs.writeFileSync('src/components/Sidebar.tsx', sidebar);
}

let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
if (!layout.includes('AuditLogs')) {
  layout = layout.replace(
    "import Settings from '../pages/Settings';",
    "import Settings from '../pages/Settings';\nimport AuditLogs from '../pages/AuditLogs';"
  );
  
  layout = layout.replace(
    "if (currentMenu === 'roles'",
    "if (currentMenu === 'audit_logs' && (user.role === 'admin' || user.role === 'developer')) return <AuditLogs />;\n    if (currentMenu === 'roles'"
  );
  
  fs.writeFileSync('src/components/Layout.tsx', layout);
}

