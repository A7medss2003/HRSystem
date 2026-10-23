const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

file = file.replace(
  /interface EmployeeDetailProps \{/,
  "interface EmployeeDetailProps {\n  user?: { role: string, username: string, permissions: string[] };\n  readOnly?: boolean;"
);

file = file.replace(
  /export default function EmployeeDetail\(\{ employee, onBack, onSave, initialCategory \}: EmployeeDetailProps\) \{/,
  "export default function EmployeeDetail({ employee, onBack, onSave, initialCategory, user, readOnly }: EmployeeDetailProps) {"
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
