const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

file = file.replace(
  /              <\/Section>\n            <\/div>\n          \)}\n\n          \{\/\* TAB: Education \*\/\}/,
  `              </Section>
              
              <Section title="معلومات مخصصة إضافية">
                {renderCustomFields('personal')}
              </Section>
            </div>
          )}

          {/* TAB: Education */}`
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
