const fs = require('fs');
let file = fs.readFileSync('electron-main.cjs', 'utf8');

file = file.replace(
  /frame: false,\s*autoHideMenuBar: true,/,
  `frame: false,
    autoHideMenuBar: true,
    transparent: true,
    backgroundColor: '#00000000',`
);

fs.writeFileSync('electron-main.cjs', file);
