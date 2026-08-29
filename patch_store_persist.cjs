const fs = require('fs');

let content = fs.readFileSync('src/store.ts', 'utf8');

// Increment version or change name
if (content.includes("name: 'hr-store'")) {
  content = content.replace(
    /name: 'hr-store'/,
    "name: 'hr-store-v2'"
  );
} else {
  // Try to find the persist options
  content = content.replace(
    /persist\(/,
    "persist("
  );
  // Actually let's just find "name: 'hr-store'" or whatever it is called.
}

fs.writeFileSync('src/store.ts', content);
