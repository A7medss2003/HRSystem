const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

// The login component is still taking up space and background might be set somewhere else.
// Let's make sure the window background is clean and only the login box is visible.
file = file.replace(
  /const contentClass = "electron-content-wrapper h-screen overflow-y-auto overflow-x-hidden flex flex-col " \+ \(user \? "bg-\[#f4f7f9\] " : "bg-transparent "\) \+ \(isElectron \? "pt-8" : ""\);/,
  'const contentClass = "electron-content-wrapper h-screen overflow-y-auto overflow-x-hidden flex flex-col " + (user ? "bg-[#f4f7f9] " : "bg-slate-900 ") + (isElectron ? "pt-8" : "");'
);

fs.writeFileSync('src/App.tsx', file);
