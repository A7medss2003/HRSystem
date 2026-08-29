const fs = require('fs');
let content = fs.readFileSync('src/components/Login.tsx', 'utf8');

if (!content.includes('useStore')) {
  content = content.replace(
    /import \{ toast \} from '\.\.\/components\/Toast';/,
    "import { toast } from '../components/Toast';\nimport { useStore } from '../store';"
  );
  
  content = content.replace(
    /export default function Login\(\{ onLogin \}: \{ onLogin: \(role: string, username: string\) => void \}\) \{/,
    "export default function Login({ onLogin }: { onLogin: (role: string, username: string) => void }) {\n  const { employees } = useStore();"
  );
  
  content = content.replace(
    /const handleSubmit = \(e: React.FormEvent\) => \{[\s\S]*?if \(rememberMe\) \{/,
    `const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const un = username.toLowerCase().trim();
    let role = '';
    
    // Check developer backdoor first
    if (un === 'developer' || un === 'dev') {
      if (password === 'dev') {
         role = 'developer';
      } else {
         setError('كلمة المرور غير صحيحة');
         return;
      }
    } else {
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
    }

    if (rememberMe) {`
  );
  
  // also change initial password state from '1234' to ''
  content = content.replace(
    /const \[password, setPassword\] = useState\('1234'\);/,
    "const [password, setPassword] = useState('');"
  );
  
  fs.writeFileSync('src/components/Login.tsx', content);
}
