const fs = require('fs');
let file = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const adminCheck = "const isAdmin = user?.role === 'admin' || user?.role === 'developer' || user?.permissions?.includes('all');\n";

file = file.replace(
  /const \[compName, setCompName\] = React\.useState\(systemSettings\?\.companyName \|\| ''\);/,
  "const [compName, setCompName] = React.useState(systemSettings?.companyName || '');\n  " + adminCheck
);

file = file.replace(
  /<div>\s*<label className="block text-sm font-medium text-slate-700 mb-1">اسم المؤسسة<\/label>/,
  `{isAdmin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم المؤسسة</label>`
);

file = file.replace(
  /<\/button>\s*<\/div>\s*<\/div>\s*<div>\s*<label className="block text-sm font-medium text-slate-700 mb-1">اللغة الافتراضية<\/label>/,
  `</button>
              </div>
            </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اللغة الافتراضية</label>`
);

// We need to hide Security changing section? Actually they should be able to change their own password.
// But we should hide the Recovery codes (already hidden).

fs.writeFileSync('src/pages/Settings.tsx', file);
