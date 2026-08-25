const fs = require('fs');
let content = fs.readFileSync('src/components/Login.tsx', 'utf8');

content = content.replace(
  /dir="ltr"\s*\/>\s*<\/div>\s*<div className="flex items-center justify-between mt-4">/,
  `dir="ltr"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">`
);

fs.writeFileSync('src/components/Login.tsx', content);
