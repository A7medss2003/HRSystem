const fs = require('fs');
let file = fs.readFileSync('electron-main.cjs', 'utf8');

file = file.replace(
  /const win = new BrowserWindow\(\{[\s\S]*?width: 1200,\s*height: 800,/,
  `const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    autoHideMenuBar: true,`
);

file = file.replace(
  /  \}\);\n\n  if \(process\.env\.NODE_ENV === 'development'\) \{/,
  `  });
  
  // إزالة الشريط العلوي تماماً
  win.setMenuBarVisibility(false);
  win.maximize(); // جعلها ملء الشاشة

  if (process.env.NODE_ENV === 'development') {`
);

fs.writeFileSync('electron-main.cjs', file);
