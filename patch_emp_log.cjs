const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

if (!content.includes('addSystemLog')) {
  content = content.replace(
    "const { updateEmployee, addEmployee } = useStore();",
    "const { updateEmployee, addEmployee, addSystemLog } = useStore();"
  );
  content = content.replace(
    "const { deleteEmployee } = useStore();",
    "const { deleteEmployee, addSystemLog } = useStore();"
  );
  
  // Track save
  content = content.replace(
    "toast('تم حفظ بيانات الموظف بنجاح');",
    "toast('تم حفظ بيانات الموظف بنجاح');\n    addSystemLog({ userId: currentUser?.username || 'system', userName: currentUser?.username || 'system', action: isAdding ? 'إضافة موظف' : 'تعديل موظف', details: isAdding ? 'تم إضافة الموظف ' + formData.fullName : 'تم تعديل بيانات الموظف ' + formData.fullName });"
  );
  
  // Track delete
  content = content.replace(
    "deleteEmployee(employee.id);",
    "deleteEmployee(employee.id);\n                    addSystemLog({ userId: currentUser?.username || 'system', userName: currentUser?.username || 'system', action: 'حذف موظف', details: 'تم حذف الموظف ' + employee.fullName });"
  );
  
  fs.writeFileSync('src/pages/EmployeeDetail.tsx', content);
}
