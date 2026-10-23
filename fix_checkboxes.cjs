const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

file = file.replace(
  /const isChecked = \(formData\.customPermissions \|\| \[\]\)\.includes\(perm\.id\) \|\| \(perm\.id === 'all' && formData\.defaultRole === 'admin'\);/,
  "const isAdminUser = formData.defaultRole === 'admin' || (formData.customPermissions || []).includes('all');\n                      const isChecked = (formData.customPermissions || []).includes(perm.id) || (perm.id === 'all' && isAdminUser) || isAdminUser;"
);

// We need to disable others if Admin is checked.
file = file.replace(
  /<input\n                            type="checkbox"\n                            checked=\{isChecked\}\n                            onChange=\{handleCheck\}\n                            disabled=\{readOnly\}/,
  `<input
                            type="checkbox"
                            checked={isChecked}
                            onChange={handleCheck}
                            disabled={readOnly || (isAdminUser && perm.id !== 'all')}`
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
