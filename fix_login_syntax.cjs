const fs = require('fs');

let login = fs.readFileSync('src/components/Login.tsx', 'utf8');

// The code looks like this:
//     let role = '';
//     
//     } else {
//       // Find employee
// Let's remove the broken `} else {`
login = login.replace(/let role = '';\s*\} else \{/g, "let role = '';\n");

// Also check for AlertCircle import
if (!login.includes('AlertCircle')) {
  login = login.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, AlertCircle } from 'lucide-react';");
}

fs.writeFileSync('src/components/Login.tsx', login);
