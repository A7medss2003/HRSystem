const fs = require('fs');

// 1. Remove Watermark from Layout.tsx
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
layout = layout.replace(/\{\/\* Background Watermark \*\/\}[\s\S]*?\/>/, '{/* Background Watermark Removed */}');
fs.writeFileSync('src/components/Layout.tsx', layout);

// 2. Change Default Color in index.css
let indexCss = fs.readFileSync('src/index.css', 'utf8');
indexCss = indexCss.replace(/--color-primary: #2563eb;/, '--color-primary: #1e40af;');
indexCss = indexCss.replace(/--color-primary-hover: #1d4ed8;/, '--color-primary-hover: #1e3a8a;');
fs.writeFileSync('src/index.css', indexCss);

// 3. Change Default in DeveloperSettings
let devSettings = fs.readFileSync('src/pages/DeveloperSettings.tsx', 'utf8');
devSettings = devSettings.replace(/'#2563eb'/g, "'#1e40af'");
fs.writeFileSync('src/pages/DeveloperSettings.tsx', devSettings);

// 4. Change Default in Login and Sidebar
let login = fs.readFileSync('src/components/Login.tsx', 'utf8');
login = login.replace(/#2563eb/g, '#1e40af');
fs.writeFileSync('src/components/Login.tsx', login);

let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(/#2563eb/g, '#1e40af');
sidebar = sidebar.replace(/shadow-sm font-semibold/, 'font-medium'); // Remove shadow and slightly reduce weight if it makes it less glaring
fs.writeFileSync('src/components/Sidebar.tsx', sidebar);

// 5. Update initColor.ts to override the old default if present
let initColor = fs.readFileSync('src/initColor.ts', 'utf8');
initColor = initColor.replace(
  /const savedColor = localStorage\.getItem\('app_primary_color'\);/,
  `let savedColor = localStorage.getItem('app_primary_color');
  if (savedColor === '#2563eb') {
    savedColor = '#1e40af';
    localStorage.setItem('app_primary_color', savedColor);
  }`
);
fs.writeFileSync('src/initColor.ts', initColor);

