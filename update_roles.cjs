const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

file = file.replace(
  /const \{ employees, deleteEmployee, addSystemLog, globalCustomFields, setGlobalCustomFields \} = useStore\(\);/,
  "const { employees, deleteEmployee, addSystemLog, globalCustomFields, setGlobalCustomFields, roles } = useStore();"
);

// add roleOptions
file = file.replace(
  /const statusOptions = /,
  "const roleOptions = (roles || []).map(r => ({ value: r.id, label: r.name }));\n  const statusOptions = "
);

// replace InputField with SelectField for defaultRole
file = file.replace(
  /<InputField readOnly=\{readOnly\} label="الدور الوظيفي الافتراضي" value=\{formData.defaultRole\} onChange=\{\(v: any\) => handleChange\('defaultRole', v\)\} \/>/,
  `<SelectField readOnly={readOnly} label="الدور الوظيفي الافتراضي (الصلاحية)" value={formData.defaultRole} onChange={(v: any) => handleChange('defaultRole', v)} options={roleOptions} />`
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
