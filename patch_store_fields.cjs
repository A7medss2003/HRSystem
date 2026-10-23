const fs = require('fs');
let file = fs.readFileSync('src/store.ts', 'utf8');

if (!file.includes('globalCustomFields:')) {
  file = file.replace(
    /interface AppState \{/,
    "interface AppState {\n  globalCustomFields: GlobalCustomField[];\n  setGlobalCustomFields: (fields: GlobalCustomField[]) => void;"
  );
  
  file = file.replace(
    /systemSettings: \{ companyName:/,
    "globalCustomFields: [],\n      setGlobalCustomFields: (fields) => set({ globalCustomFields: fields }),\n      systemSettings: { companyName:"
  );
  
  file = file.replace(/import \{ /, "import { GlobalCustomField, ");
  
  fs.writeFileSync('src/store.ts', file);
}
