const fs = require('fs');
let content = fs.readFileSync('src/pages/Leaves.tsx', 'utf8');
content = content.replace(
  /const handleAddLeave = \(e: React\.FormEvent\) => \{\n\s*e\.preventDefault\(\);\n\s*const newRequest: LeaveRequest = \{/,
  `const handleAddLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(newLeave.endDate) < new Date(newLeave.startDate)) {
      toast('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      return;
    }
    const newRequest: LeaveRequest = {`
);
fs.writeFileSync('src/pages/Leaves.tsx', content);
