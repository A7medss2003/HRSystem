const fs = require('fs');
let file = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

file = file.replace(
  /const allItems = \[[\s\S]*?\];/,
  `const allItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['admin', 'accountant', 'developer'], perm: 'view_dashboard' },
    { id: 'employees', label: 'الموظفون', icon: Users, roles: ['admin', 'accountant', 'developer'], perm: 'manage_employees' },
    { id: 'attendance', label: 'الحضور والانصراف', icon: Clock, roles: ['admin', 'accountant', 'employee', 'developer'], perm: 'manage_attendance' },
    { id: 'leaves', label: 'الإجازات', icon: Calendar, roles: ['admin', 'accountant', 'employee', 'developer'], perm: 'manage_leaves' },
    { id: 'recruitment', label: 'التوظيف', icon: UserPlus, roles: ['admin', 'developer'], perm: 'all' },
    { id: 'roles', label: 'الصلاحيات', icon: Shield, roles: ['admin', 'developer'], perm: 'all' },
    { id: 'settings', label: 'الإعدادات', icon: Settings, roles: ['admin', 'accountant', 'employee', 'developer'], perm: 'manage_settings' },
    { id: 'dev_settings', label: 'إعدادات المطور', icon: Monitor, roles: ['developer'], perm: 'all' },
  ];`
);

file = file.replace(
  /const menuItems = allItems\.filter\(item => item\.roles\.includes\(user\.role\)\);/,
  `const menuItems = allItems.filter(item => {
    if (user.role === 'admin' || user.role === 'developer' || user.permissions.includes('all')) return true;
    if (item.roles.includes(user.role)) return true;
    if (item.perm && user.permissions.includes(item.perm)) return true;
    return false;
  });`
);

fs.writeFileSync('src/components/Sidebar.tsx', file);
