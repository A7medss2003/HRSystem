const fs = require('fs');
let empDetail = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

if (!empDetail.includes("import { validatePassword }")) {
  empDetail = empDetail.replace(
    "import { toast } from '../components/Toast';",
    "import { toast } from '../components/Toast';\nimport { validatePassword } from '../lib/validators';"
  );
  
  const passVal = `
    if (formData.password && formData.password.trim() !== '') {
      const passError = validatePassword(formData.password);
      if (passError) {
        toast('كلمة المرور: ' + passError);
        setActiveTab('system'); // Assuming password is in system tab
        return;
      }
    }
  `;
  
  empDetail = empDetail.replace(
    "try {\n      // Validate form data",
    "try {\n" + passVal + "\n      // Validate form data"
  );
  
  fs.writeFileSync('src/pages/EmployeeDetail.tsx', empDetail);
}
