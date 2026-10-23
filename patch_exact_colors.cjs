const fs = require('fs');

let indexCss = fs.readFileSync('src/index.css', 'utf8');
indexCss = indexCss.replace(/--color-primary: #1e40af;/, '--color-primary: #243f63;');
indexCss = indexCss.replace(/--color-primary-hover: #1e3a8a;/, '--color-primary-hover: #1a2f4c;');
fs.writeFileSync('src/index.css', indexCss);

let devSettings = fs.readFileSync('src/pages/DeveloperSettings.tsx', 'utf8');
devSettings = devSettings.replace(/'#1e40af'/g, "'#243f63'");
fs.writeFileSync('src/pages/DeveloperSettings.tsx', devSettings);

let initColor = fs.readFileSync('src/initColor.ts', 'utf8');
initColor = initColor.replace(/'#1e40af'/g, "'#243f63'");
fs.writeFileSync('src/initColor.ts', initColor);

let login = fs.readFileSync('src/components/Login.tsx', 'utf8');
login = login.replace(/#1e40af/g, '#243f63');
fs.writeFileSync('src/components/Login.tsx', login);

let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(/#1e40af/g, '#243f63');
fs.writeFileSync('src/components/Sidebar.tsx', sidebar);

let topbar = fs.readFileSync('src/components/Topbar.tsx', 'utf8');
topbar = topbar.replace(/#1e40af/g, '#243f63');
fs.writeFileSync('src/components/Topbar.tsx', topbar);

