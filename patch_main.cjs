const fs = require('fs');
let file = fs.readFileSync('src/main.tsx', 'utf8');

file = file.replace(/import App from '\.\/App';/, "import App from './App';\nimport { initThemeColor } from './initColor';\n\ninitThemeColor();");

fs.writeFileSync('src/main.tsx', file);
