const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

// The user wants "الإطار تسجيل الدخول فقط بدون الخلفية". This means they want the login page to just have the login box on a plain background instead of a huge background image or dark background.
file = file.replace(
  /const contentClass = "electron-content-wrapper h-screen overflow-y-auto overflow-x-hidden flex flex-col " \+ \(user \? "bg-\[#f4f7f9\] " : "bg-slate-900 "\) \+ \(isElectron \? "pt-8" : ""\);/,
  'const contentClass = "electron-content-wrapper h-screen overflow-y-auto overflow-x-hidden flex flex-col bg-[#f4f7f9] " + (isElectron ? "pt-8" : "");'
);

fs.writeFileSync('src/App.tsx', file);
