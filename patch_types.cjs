const fs = require('fs');
let file = fs.readFileSync('src/types.ts', 'utf8');

const newTypes = `
export interface GlobalCustomField {
  id: string;
  section: string;
  label: string;
  width: '1' | '2' | '3';
}
`;

if (!file.includes('GlobalCustomField')) {
  file = file + newTypes;
}

fs.writeFileSync('src/types.ts', file);
