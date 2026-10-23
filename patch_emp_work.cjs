const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

file = file.replace(
  /              <\/Section>\n            <\/div>\n          \)}\n\n          \{\/\* TAB: Personal Info \*\/\}/,
  `              </Section>
              
              <Section title="معلومات مخصصة إضافية">
                {renderCustomFields('work')}
              </Section>
            </div>
          )}

          {/* TAB: Personal Info */}`
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
