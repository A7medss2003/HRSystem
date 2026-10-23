const fs = require('fs');
let file = fs.readFileSync('src/components/Login.tsx', 'utf8');

file = file.replace(/onLogin: \(role: string, username: string\) => void/, "onLogin: (role: string, username: string, permissions?: string[]) => void");

fs.writeFileSync('src/components/Login.tsx', file);
