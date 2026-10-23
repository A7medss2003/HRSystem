const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

file = file.replace(
  /                <\/div>\n              <\/div>\n            <\/div>\n          \)}\n\n          \{\/\* TAB: Work Info \*\/\}/,
  `                </div>
              </div>
              
              <Section title="معلومات مخصصة إضافية">
                {renderCustomFields('basic')}
              </Section>
            </div>
          )}

          {/* TAB: Work Info */}`
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
