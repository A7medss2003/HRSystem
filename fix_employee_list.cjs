const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeeList.tsx', 'utf8');
content = content.replace(/const \[ratingModalEmp, setRatingModalEmp\] = useState<Emp  const \[ratingForm, setRatingForm\] = useState<{/, 'const [ratingModalEmp, setRatingModalEmp] = useState<Employee | null>(null);\n  const [ratingForm, setRatingForm] = useState<{');
content = content.replace(/}\)\);\n  };\nد';\n    else if \(score >= 60\) level = 'مقبول';\n    else level = 'يحتاج تحسين';/, '}));\n  };');
fs.writeFileSync('src/pages/EmployeeList.tsx', content);
