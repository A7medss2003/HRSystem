const fs = require('fs');
let store = fs.readFileSync('src/store.ts', 'utf8');
store = store.replace(
  "  setBackupPath: (path: string | null) => void;",
  "  setBackupPath: (path: string | null) => void;\n  addSystemLog: (log: any) => void;"
);
fs.writeFileSync('src/store.ts', store);
