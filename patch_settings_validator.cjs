const fs = require('fs');
let settings = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

if (!settings.includes("import { validatePassword }")) {
  settings = settings.replace(
    "import { toast } from '../components/Toast';",
    "import { toast } from '../components/Toast';\nimport { validatePassword } from '../lib/validators';"
  );
  
  const passVal = `
    const passError = validatePassword(passwords.new);
    if (passError) {
      toast(passError);
      return;
    }
  `;
  
  settings = settings.replace(
    "if (passwords.new.length < 4) {\n      toast('يجب أن تكون كلمة المرور 4 أحرف على الأقل');\n      return;\n    }",
    passVal.trim()
  );
  
  fs.writeFileSync('src/pages/Settings.tsx', settings);
}
