const fs = require('fs');
let file = fs.readFileSync('src/components/Topbar.tsx', 'utf8');

const regex = /const generatedNotifications = \(\(\) => \{[\s\S]*?return list\.filter\(item => !dismissedIds\.includes\(item\.id\)\);\s*\}\)\(\);/;

const newLogic = `const generatedNotifications = (() => {
    const list: {
      id: string;
      type: 'contract_expire' | 'contract_expired' | 'leave_active' | 'leave_upcoming' | 'leave_pending' | 'system';
      title: string;
      description: string;
      date: string;
      severity: 'high' | 'medium' | 'info';
      employeeId?: string;
      linkMenu: 'employees' | 'leaves' | 'settings' | 'dev_settings';
    }[] = [];
    
    const isAdmin = user.role === 'admin' || user.role === 'developer' || (user.permissions || []).includes('all');
    const canManageEmployees = isAdmin || (user.permissions || []).includes('manage_employees');
    const canManageLeaves = isAdmin || (user.permissions || []).includes('manage_leaves');
    
    // System Updates / Fixes announcements
    if (isAdmin) {
      list.push({
        id: 'sys-update-101',
        type: 'system',
        title: 'تحديث النظام وإصلاح أخطاء',
        description: 'تم إصلاح مشكلة اختفاء الإشعارات بعد التحديث، وتم إضافة أدوات جديدة للمطورين لحل مشاكل الملفات وتفريغ المساحة.',
        date: new Date().toISOString().split('T')[0],
        severity: 'info',
        linkMenu: 'settings'
      });
    }

    // 1. Scan employee contracts
    if (canManageEmployees) {
      employees.forEach(emp => {
        emp.contracts?.forEach(contract => {
          if (contract.endDate) {
            const end = new Date(contract.endDate);
            const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate());
            const baseZero = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
            
            const diffTime = endZero.getTime() - baseZero.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays <= 30) {
              list.push({
                id: \`contract-warn-\${contract.id}\`,
                type: 'contract_expire',
                title: 'اقتراب انتهاء عقد عمل',
                description: \`عقد الموظف (\${emp.fullName}) ينتهي خلال \${diffDays} يوم في \${contract.endDate}\`,
                date: contract.endDate,
                severity: diffDays <= 7 ? 'high' : 'medium',
                employeeId: emp.id,
                linkMenu: 'employees'
              });
            } else if (diffDays < 0) {
              list.push({
                id: \`contract-exp-\${contract.id}\`,
                type: 'contract_expired',
                title: 'عقد عمل منتهي الصلاحية',
                description: \`عقد الموظف (\${emp.fullName}) انتهى في تاريخ \${contract.endDate}\`,
                date: contract.endDate,
                severity: 'high',
                employeeId: emp.id,
                linkMenu: 'employees'
              });
            }
          }
        });
      });
    }

    // 2. Scan leaves
    if (canManageLeaves) {
      leaves.forEach(leave => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        
        const startZero = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        const baseZero = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
        const todayTime = baseZero.getTime();
        const startTime = startZero.getTime();
        const endTime = endZero.getTime();

        if (leave.status === 'Approved') {
          if (todayTime >= startTime && todayTime <= endTime) {
            list.push({
              id: \`leave-active-\${leave.id}\`,
              type: 'leave_active',
              title: 'موظف في إجازة حالياً',
              description: \`الموظف (\${leave.employeeName}) في إجازة حالياً (\${leave.type}) حتى \${leave.endDate}\`,
              date: leave.endDate,
              severity: 'info',
              linkMenu: 'leaves'
            });
          } else if (startTime > todayTime) {
            const diffDays = Math.ceil((startTime - todayTime) / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
              list.push({
                id: \`leave-upcoming-\${leave.id}\`,
                type: 'leave_upcoming',
                title: 'إجازة تبدأ قريباً',
                description: \`تبدأ إجازة الموظف (\${leave.employeeName}) خلال \${diffDays} يوم في \${leave.startDate}\`,
                date: leave.startDate,
                severity: 'info',
                linkMenu: 'leaves'
              });
            }
          }
        } else if (leave.status === 'Pending') {
          list.push({
            id: \`leave-pending-\${leave.id}\`,
            type: 'leave_pending',
            title: 'طلب إجازة قيد الانتظار',
            description: \`طلب (\${leave.type}) للموظف (\${leave.employeeName}) معلق وبحاجة للمراجعة\`,
            date: leave.startDate,
            severity: 'medium',
            linkMenu: 'leaves'
          });
        }
      });
    }

    return list.filter(item => !dismissedIds.includes(item.id));
  })();`;

file = file.replace(regex, newLogic);

fs.writeFileSync('src/components/Topbar.tsx', file);
