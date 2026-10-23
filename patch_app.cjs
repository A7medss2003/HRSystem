const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

file = file.replace(
  /const \[user, setUser\] = useState<\{role: string, username: string\} \| null>\(null\);/,
  "const [user, setUser] = useState<{role: string, username: string, permissions: string[]} | null>(null);"
);

file = file.replace(
  /const handleLogin = \(role: string, username: string\) => \{/,
  "const handleLogin = (role: string, username: string, permissions: string[] = []) => {"
);

file = file.replace(
  /setUser\(\{role, username\}\);/,
  "setUser({role, username, permissions});"
);

fs.writeFileSync('src/App.tsx', file);
