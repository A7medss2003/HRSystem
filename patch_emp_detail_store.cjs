const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

file = file.replace(
  /const \{ addSystemLog, systemSettings \} = useStore\(\);/,
  "const { addSystemLog, systemSettings, globalCustomFields, setGlobalCustomFields } = useStore();"
);

// If it's different:
if (!file.includes('globalCustomFields, setGlobalCustomFields')) {
  file = file.replace(
    /const \{ ([^}]+) \} = useStore\(\);/,
    "const { $1, globalCustomFields, setGlobalCustomFields } = useStore();"
  );
}

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
