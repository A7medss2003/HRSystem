const fs = require('fs');

let settings = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

settings = settings.replace(
  "  const [bPath, setBPath] = React.useState(backupPath || '');",
  "  const [bPath, setBPath] = React.useState(backupPath || '');\n  const [showPasswordModal, setShowPasswordModal] = React.useState(false);\n  const [passwords, setPasswords] = React.useState({ old: '', new: '', confirm: '' });\n  const { user, employees, updateEmployee } = useStore();"
);

fs.writeFileSync('src/pages/Settings.tsx', settings);

