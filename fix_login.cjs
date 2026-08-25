const fs = require('fs');
let content = fs.readFileSync('src/components/Login.tsx', 'utf8');

content = content.replace(
  /import \{ Lock, User, ShieldCheck \} from 'lucide-react';/,
  "import { Lock, User, ShieldCheck } from 'lucide-react';\nimport { toast } from '../components/Toast';"
);

content = content.replace(
  /const \[username, setUsername\] = useState\(''\);/,
  "const [username, setUsername] = useState(localStorage.getItem('rememberedUser') || '');\n  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedUser'));"
);

content = content.replace(
  /onLogin\(role, un\);/,
  `if (rememberMe) {
      localStorage.setItem('rememberedUser', un);
    } else {
      localStorage.removeItem('rememberedUser');
    }
    onLogin(role, un);`
);

const newUI = `</div>
            
            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" 
                />
                <span className="text-sm text-slate-600 font-medium">تذكرني</span>
              </label>

              <button 
                type="button"
                onClick={() => toast('سيتم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني')}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            <button type="submit"`;

content = content.replace(
  /<\/div>\s*<\/div>\s*<button type="submit"/,
  newUI
);

fs.writeFileSync('src/components/Login.tsx', content);
