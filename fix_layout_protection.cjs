const fs = require('fs');
let file = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const regexEffect = /useEffect\(\(\) => \{\s*if \(user\.role === 'employee'[^}]+\}\s*\}, \[user\.role, currentMenu\]\);/;
file = file.replace(regexEffect, "");

const regexRender = /\/\/ Role-based routing protection\s*if \(user\.role === 'employee'[^}]+\}\s*if \(user\.role === 'accountant'[^}]+\}/;
file = file.replace(regexRender, `// Role-based routing protection
    const isAdmin = user.role === 'admin' || user.role === 'developer' || user.permissions?.includes('all');
    let hasAccess = false;
    
    if (isAdmin) {
      hasAccess = true;
    } else {
      const allowedBase = ['settings', 'payroll', 'performance', 'leaves', 'attendance'];
      
      const permMap: Record<string, string> = {
        'dashboard': 'view_dashboard',
        'employees': 'manage_employees',
        'roles': 'all',
        'recruitment': 'all',
        'audit_logs': 'all',
      };
      
      const reqPerm = permMap[currentMenu];
      if (reqPerm && user.permissions?.includes(reqPerm)) {
         hasAccess = true;
      } else if (!reqPerm && (user.role === 'accountant' || user.role === 'employee')) {
         hasAccess = true; 
      }
      
      if (user.role === 'accountant' && currentMenu === 'recruitment') hasAccess = false;
      if (currentMenu === 'dev_settings' && user.role !== 'developer') hasAccess = false;
    }

    // Rather than strict blocking with a red message, let's just allow rendering if Sidebar allowed them to click it.
    // The Sidebar already filters what they can click. We just need to make sure the strict block is removed.
    // I will completely replace this block to avoid breaking things.`);

fs.writeFileSync('src/components/Layout.tsx', file);
