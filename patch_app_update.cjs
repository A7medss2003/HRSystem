const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

if (!file.includes('UpdateNotification')) {
  file = file.replace(
    /import Login from '\.\/components\/Login';/,
    "import Login from './components/Login';\nimport UpdateNotification from './components/UpdateNotification';"
  );
  
  file = file.replace(
    /return \(\s*<div/,
    "return (\n    <div className=\"min-h-screen bg-slate-50 font-sans\" dir=\"rtl\">\n      <UpdateNotification />"
  );
  
  // also fix the fact I just replaced <div. We should actually replace exactly the first return div
  file = file.replace(
    /<div className="min-h-screen bg-slate-50 font-sans" dir="rtl">\n      <UpdateNotification \/> className="min-h-screen bg-slate-50 font-sans" dir="rtl">/,
    "<div className=\"min-h-screen bg-slate-50 font-sans\" dir=\"rtl\">\n      <UpdateNotification />"
  );
}

fs.writeFileSync('src/App.tsx', file);
