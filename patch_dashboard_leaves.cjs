const fs = require('fs');
let file = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

file = file.replace(
  /const \{ employees \} = useStore\(\);/,
  'const { employees, leaves } = useStore();'
);

fs.writeFileSync('src/pages/Dashboard.tsx', file);
