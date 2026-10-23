const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

// Remove Section title "معلومات مخصصة إضافية" from the three places
// 1. Basic tab
file = file.replace(
  /<Section title="معلومات مخصصة إضافية">\s*\{renderCustomFields\('basic'\)\}\s*<\/Section>/,
  `{/* Custom fields basic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t border-slate-100 pt-6">
                {renderCustomFields('basic')}
              </div>`
);

// 2. Work tab
file = file.replace(
  /<Section title="معلومات مخصصة إضافية">\s*\{renderCustomFields\('work'\)\}\s*<\/Section>/,
  `{/* Custom fields work */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t border-slate-100 pt-6">
                {renderCustomFields('work')}
              </div>`
);

// 3. Personal tab
file = file.replace(
  /<Section title="معلومات مخصصة إضافية">\s*\{renderCustomFields\('personal'\)\}\s*<\/Section>/,
  `{/* Custom fields personal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t border-slate-100 pt-6">
                {renderCustomFields('personal')}
              </div>`
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
