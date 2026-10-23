const fs = require('fs');
let file = fs.readFileSync('src/types.ts', 'utf8');

if (!file.includes('customPermissions?: string[]')) {
  file = file.replace(
    /additionalRoles: string\[\];/,
    "additionalRoles: string[];\n  customPermissions?: string[];"
  );
  fs.writeFileSync('src/types.ts', file);
}
