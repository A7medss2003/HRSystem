const fs = require('fs');

let content = fs.readFileSync('src/data.ts', 'utf8');
content = content.replace(
  /linkedUser: 'developer',/,
  "linkedUser: 'developer',\n    password: 'dev',"
);
fs.writeFileSync('src/data.ts', content);
