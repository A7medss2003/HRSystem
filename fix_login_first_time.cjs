const fs = require('fs');

let login = fs.readFileSync('src/components/Login.tsx', 'utf8');

// 1. Remove the old forgot password link and the backdoor
login = login.replace(
  /<button\s*type="button"\s*onClick=\{[^}]+\}\s*className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"\s*>\s*نسيت كلمة المرور؟\s*<\/button>/,
  ""
);

login = login.replace(
  /\/\/ Check developer backdoor first[\s\S]*?\} else \{/,
  ""
);

// We need to fix the matching bracket of the else statement we just removed
login = login.replace(
  /role = 'admin';\n    \}/,
  "role = 'admin';"
);

fs.writeFileSync('src/components/Login.tsx', login);
