const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');

content = content.replace(
  /export const mockEmployees: Employee\[\] = \[[\s\S]*?\];/,
  "export const mockEmployees: Employee[] = [];"
);

fs.writeFileSync('src/data.ts', content);
