const fs = require('fs');
let file = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const target = "// I will completely replace this block to avoid breaking things.";
file = file.replace(target, "if (!hasAccess) return <div className=\"text-center p-8 text-red-500\">غير مصرح لك بالوصول لهذه الوحدة</div>;");

fs.writeFileSync('src/components/Layout.tsx', file);
