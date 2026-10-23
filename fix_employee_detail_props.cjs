const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

file = file.replace(
  /export default function EmployeeDetail\(\{ employee, onBack, onSave, readOnly = false, hideBack = false, initialCategory, user \}: EmployeeDetailProps & \{ hideBack\?: boolean \} \) \{ EmployeeDetailProps & \{ readOnly\?: boolean, hideBack\?: boolean, initialCategory\?: 'موظف أساسي' \| 'متعاقد' \| 'متعاون' \} \) \{/,
  "export default function EmployeeDetail({ employee, onBack, onSave, readOnly = false, hideBack = false, initialCategory, user }: EmployeeDetailProps & { hideBack?: boolean }) {"
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
