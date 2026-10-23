const fs = require('fs');
let file = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

file = file.replace(
  /export default function Settings\(\{ user \}: \{ user\?: \{ username: string, role\?: string \} \}\) \{/,
  "export default function Settings({ user }: { user?: { username: string, role?: string, permissions?: string[] } }) {"
);

fs.writeFileSync('src/pages/Settings.tsx', file);
