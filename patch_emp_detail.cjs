const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

// Also need to get userRole to know if user is developer or admin.
// Wait, `EmployeeDetail` doesn't receive `userRole` in props.
// Let's add it from the store or just check `readOnly`. Wait, if `readOnly` is false, they can edit.

// But the user specifically asked for "Developer has permissions to change password for everyone".
// Admin probably should too. Let's just add it under "System Info" or something similar.

if (!content.includes('password')) {
  // Add password to formData initialization if not present
  content = content.replace(
    /linkedUser: '',/,
    "linkedUser: '',\n  password: '1234',"
  );

  const systemSection = `
              <Section title="بيانات الدخول للنظام (للمدير والمطور)">
                <InputField readOnly={readOnly} label="اسم المستخدم (للدخول)" value={formData.linkedUser} onChange={(v: any) => handleChange('linkedUser', v)} />
                <InputField readOnly={readOnly} label="كلمة المرور" value={formData.password || ''} onChange={(v: any) => handleChange('password', v)} type="text" />
              </Section>
  `;

  content = content.replace(
    /<\/Section>\s*<Section title="الموافقات">/,
    `</Section>\n${systemSection}\n              <Section title="الموافقات">`
  );
  
  fs.writeFileSync('src/pages/EmployeeDetail.tsx', content);
}
