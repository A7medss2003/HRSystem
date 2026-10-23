const fs = require('fs');
let file = fs.readFileSync('src/index.css', 'utf8');

// Define default primary colors
const rootVars = `
:root {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-light: #eff6ff;
}
`;

// Insert after @theme block
file = file.replace(
  /@theme \{[\s\S]*?\}/,
  `$&
${rootVars}
`
);

fs.writeFileSync('src/index.css', file);
