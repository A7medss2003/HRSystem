const fs = require('fs');
let store = fs.readFileSync('src/store.ts', 'utf8');
if (!store.includes('addSystemLog:')) {
  store = store.replace(
    "  deleteEmployee: (id: string) => void;",
    "  deleteEmployee: (id: string) => void;\n  addSystemLog: (log: any) => void;"
  );
  fs.writeFileSync('src/store.ts', store);
}
