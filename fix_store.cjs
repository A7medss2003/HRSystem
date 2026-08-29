const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

// The file has candidates: []//[ { id... } ],
content = content.replace(/candidates: \[\]\/\/\[[\s\S]*?\],/g, "candidates: [],");
content = content.replace(/candidates: \[\]\/\/\[candidate, \.\.\.state.candidates\] \}\)\),/g, "candidates: [candidate, ...state.candidates] })),");

fs.writeFileSync('src/store.ts', content);
