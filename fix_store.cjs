const fs = require('fs');
let file = fs.readFileSync('src/store.ts', 'utf8');

file = file.replace(/import \{ GlobalCustomField, create \} from 'zustand';/, "import { create } from 'zustand';");
file = file.replace(/import \{ Employee, /, "import { GlobalCustomField, Employee, ");

fs.writeFileSync('src/store.ts', file);
