const fs = require('fs');

// Fix store.ts (import 'get')
let store = fs.readFileSync('src/store.ts', 'utf8');
store = store.replace(
  /export const useStore = create<StoreState>\(\(set\) => \(\{/,
  "export const useStore = create<StoreState>((set, get) => ({"
);
fs.writeFileSync('src/store.ts', store);

// Fix Login.tsx (import AlertCircle)
let login = fs.readFileSync('src/components/Login.tsx', 'utf8');
if (!login.includes('AlertCircle')) {
  login = login.replace(
    /import \{ Building2 \} from 'lucide-react';/,
    "import { Building2, AlertCircle } from 'lucide-react';"
  );
  fs.writeFileSync('src/components/Login.tsx', login);
}
