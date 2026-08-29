const fs = require('fs');
let login = fs.readFileSync('src/components/Login.tsx', 'utf8');

if (!login.includes("import { validatePassword }")) {
  login = login.replace(
    "import { useStore } from '../store';",
    "import { useStore } from '../store';\nimport { validatePassword } from '../lib/validators';"
  );
  
  const setupVal = `
    const passError = validatePassword(setupData.password);
    if (passError) {
      setError(passError);
      return;
    }
  `;
  
  login = login.replace(
    "if (setupData.password.length < 4) {\n      setError('كلمة المرور يجب أن تكون 4 أحرف على الأقل');\n      return;\n    }",
    setupVal.trim()
  );
  
  fs.writeFileSync('src/components/Login.tsx', login);
}
