const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

if (!app.includes('addSystemLog')) {
  app = app.replace(
    "import { ToastContainer } from './components/Toast';",
    "import { ToastContainer } from './components/Toast';\nimport { useStore } from './store';"
  );
  
  app = app.replace(
    "  const [user, setUser] = useState<{role: string, username: string} | null>(null);",
    "  const [user, setUser] = useState<{role: string, username: string} | null>(null);\n  const { addSystemLog } = useStore();\n\n  const handleLogin = (role: string, username: string) => {\n    setUser({role, username});\n    addSystemLog({ userId: username, userName: username, action: 'تسجيل الدخول', details: 'قام المستخدم بتسجيل الدخول للنظام' });\n  };\n\n  const handleLogout = () => {\n    if (user) {\n      addSystemLog({ userId: user.username, userName: user.username, action: 'تسجيل الخروج', details: 'قام المستخدم بتسجيل الخروج من النظام' });\n    }\n    setUser(null);\n  };"
  );
  
  app = app.replace(
    "<Login onLogin={(role, username) => setUser({role, username})} />",
    "<Login onLogin={handleLogin} />"
  );
  
  app = app.replace(
    '<Layout user={user} onLogout={() => setUser(null)} />',
    '<Layout user={user} onLogout={handleLogout} />'
  );
  
  fs.writeFileSync('src/App.tsx', app);
}
