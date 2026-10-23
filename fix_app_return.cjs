const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

if (file.includes('UpdateNotification') && !file.includes('<UpdateNotification />')) {
  file = file.replace(
    /return \(\s*<>\s*<TitleBar \/>/g,
    "return (\n    <>\n      <UpdateNotification />\n      <TitleBar />"
  );
  fs.writeFileSync('src/App.tsx', file);
}
