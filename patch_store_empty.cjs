const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

content = content.replace(
  /candidates: \[\s*\{ id: 'cand-1'[^\]]*\]/,
  "candidates: []"
);

content = content.replace(
  /name: 'hr-system-storage-v2'/,
  "name: 'hr-system-storage-v3'"
);

content = content.replace(
  /name: 'hr-system-storage'/,
  "name: 'hr-system-storage-v3'"
);

fs.writeFileSync('src/store.ts', content);
