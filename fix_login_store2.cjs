const fs = require('fs');

// Fix store.ts (import 'get') - using another replace strategy just in case
let store = fs.readFileSync('src/store.ts', 'utf8');
store = store.replace(
  /export const useStore = create<StoreState>\(\(set\)/,
  "export const useStore = create<StoreState>((set, get)"
);
fs.writeFileSync('src/store.ts', store);

// Fix Login.tsx (import AlertCircle)
let login = fs.readFileSync('src/components/Login.tsx', 'utf8');
if (!login.includes('AlertCircle')) {
  login = login.replace(
    /import \{ Building2/g,
    "import { Building2, AlertCircle"
  );
  fs.writeFileSync('src/components/Login.tsx', login);
}
