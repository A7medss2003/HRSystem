const fs = require('fs');
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');

layout = layout.replace(
  /<EmployeeDetail \n            employee=\{/,
  "<EmployeeDetail \n            user={user}\n            employee={"
);
fs.writeFileSync('src/components/Layout.tsx', layout);
