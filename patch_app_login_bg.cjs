const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

// Use a dynamic bg for contentClass based on user state
file = file.replace(
  /const contentClass = "electron-content-wrapper h-screen overflow-y-auto overflow-x-hidden flex flex-col bg-\[#f4f7f9\] " \+ \(isElectron \? "pt-8" : ""\);/,
  'const contentClass = "electron-content-wrapper h-screen overflow-y-auto overflow-x-hidden flex flex-col " + (user ? "bg-[#f4f7f9] " : "bg-transparent ") + (isElectron ? "pt-8" : "");'
);

fs.writeFileSync('src/App.tsx', file);
