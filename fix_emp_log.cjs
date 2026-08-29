const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');
content = content.replace(
  "    addSystemLog({ userId: currentUser?.username || 'system', userName: currentUser?.username || 'system', action: isAdding ? 'إضافة موظف' : 'تعديل موظف', details: isAdding ? 'تم إضافة الموظف ' + formData.fullName : 'تم تعديل بيانات الموظف ' + formData.fullName });",
  "    addSystemLog({ userId: 'system', userName: 'Administrator', action: isAdding ? 'إضافة موظف' : 'تعديل موظف', details: isAdding ? 'تم إضافة الموظف ' + formData.fullName : 'تم تعديل بيانات الموظف ' + formData.fullName });"
);
content = content.replace(
  "                    addSystemLog({ userId: currentUser?.username || 'system', userName: currentUser?.username || 'system', action: 'حذف موظف', details: 'تم حذف الموظف ' + employee.fullName });",
  "                    addSystemLog({ userId: 'system', userName: 'Administrator', action: 'حذف موظف', details: 'تم حذف الموظف ' + employee.fullName });"
);
fs.writeFileSync('src/pages/EmployeeDetail.tsx', content);
