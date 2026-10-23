const fs = require('fs');

// 1. Clean Sidebar
let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(/border-blue-100/g, 'border-slate-200');
sidebar = sidebar.replace(/shadow-\[4px_0_24px_rgba\(37,99,235,0\.05\)\]/, 'shadow-sm');
sidebar = sidebar.replace(/bg-blue-50\/30/g, 'bg-white'); // header bg
sidebar = sidebar.replace(/border-blue-200/g, 'border-slate-200'); // toggle button border
sidebar = sidebar.replace(/text-blue-600/g, 'text-slate-600'); // Some icons to be less glaring blue
sidebar = sidebar.replace(/text-blue-900/g, 'text-slate-800'); // Header text
sidebar = sidebar.replace(/text-white shadow-md font-bold/, 'text-white font-semibold shadow-sm'); // Active menu item - remove heavy shadow
fs.writeFileSync('src/components/Sidebar.tsx', sidebar);

// 2. Clean Topbar
let topbar = fs.readFileSync('src/components/Topbar.tsx', 'utf8');
topbar = topbar.replace(/border-blue-100/g, 'border-slate-200');
fs.writeFileSync('src/components/Topbar.tsx', topbar);

// 3. Clean TitleBar
let titlebar = fs.readFileSync('src/components/TitleBar.tsx', 'utf8');
titlebar = titlebar.replace(/border-blue-100/g, 'border-slate-200');
titlebar = titlebar.replace(/text-blue-900/g, 'text-slate-700');
fs.writeFileSync('src/components/TitleBar.tsx', titlebar);

// 4. Clean Login (Remove glowing shadows)
let login = fs.readFileSync('src/components/Login.tsx', 'utf8');
login = login.replace(/shadow-lg/g, 'shadow-sm');
fs.writeFileSync('src/components/Login.tsx', login);

