const fs = require('fs');

let settings = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
if (!settings.includes('addSystemLog')) {
  settings = settings.replace(
    "  const { employees, updateEmployee } = useStore();",
    "  const { employees, updateEmployee, addSystemLog } = useStore();"
  );
  
  settings = settings.replace(
    "toast('تمت استعادة النسخة الاحتياطية بنجاح. سيتم إعادة تشغيل النظام.');",
    "toast('تمت استعادة النسخة الاحتياطية بنجاح. سيتم إعادة تشغيل النظام.');\n          addSystemLog({ userId: user?.username || 'system', userName: user?.username || 'system', action: 'استعادة النظام', details: 'قام المستخدم باستعادة نسخة احتياطية' });"
  );
  
  settings = settings.replace(
    "setLastBackupDate(new Date().toISOString());\n      toast('تم استخراج وتنزيل النسخة الاحتياطية بنجاح');",
    "setLastBackupDate(new Date().toISOString());\n      toast('تم استخراج وتنزيل النسخة الاحتياطية بنجاح');\n      addSystemLog({ userId: user?.username || 'system', userName: user?.username || 'system', action: 'نسخ احتياطي', details: 'قام المستخدم بإنشاء وتنزيل نسخة احتياطية' });"
  );
  
  settings = settings.replace(
    "updateEmployee({ ...currentUser, password: passwords.new });\n    toast('تم تغيير كلمة المرور بنجاح');",
    "updateEmployee({ ...currentUser, password: passwords.new });\n    toast('تم تغيير كلمة المرور بنجاح');\n    addSystemLog({ userId: currentUser.id, userName: currentUser.fullName, action: 'تغيير كلمة المرور', details: 'تم تغيير كلمة المرور الخاصة بحساب ' + currentUser.fullName });"
  );
  
  fs.writeFileSync('src/pages/Settings.tsx', settings);
}

