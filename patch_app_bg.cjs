const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

file = file.replace(
  /const contentClass = "electron-content-wrapper h-screen overflow-y-auto overflow-x-hidden flex flex-col " \+ \(isElectron \? "pt-8" : ""\);/,
  'const contentClass = "electron-content-wrapper h-screen overflow-y-auto overflow-x-hidden flex flex-col bg-[#f4f7f9] " + (isElectron ? "pt-8" : "");'
);

fs.writeFileSync('src/App.tsx', file);
