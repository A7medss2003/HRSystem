const fs = require('fs');

let login = fs.readFileSync('src/components/Login.tsx', 'utf8');

// The simplest way is to replace everything from `const handleSubmit` down to `if (rememberMe) {`
const startIdx = login.indexOf('  const handleSubmit = (e: React.FormEvent) => {');
const endIdx = login.indexOf('    if (rememberMe) {');

if (startIdx !== -1 && endIdx !== -1) {
  const newLogic = `
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const un = username.toLowerCase().trim();
    let role = '';
    
    // Find employee
    const emp = employees.find(e => e.linkedUser === un || e.employeeId.toLowerCase() === un || e.workEmail.toLowerCase() === un);
    if (!emp) {
      setError('المستخدم غير موجود. الرجاء التحقق من اسم المستخدم.');
      return;
    }
    
    // If employee has a password, check it, else default to 1234
    const empPassword = emp.password || '1234';
    if (password !== empPassword) {
      setError('كلمة المرور غير صحيحة');
      return;
    }
    
    // Determine role from employee permissions
    role = emp.defaultRole || 'employee';
    if (un === 'admin' || role === 'admin') role = 'admin';

`;
  
  login = login.substring(0, startIdx) + newLogic + login.substring(endIdx);
  fs.writeFileSync('src/components/Login.tsx', login);
}
