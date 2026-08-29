const fs = require('fs');

// Patch Sidebar.tsx
let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
if (sidebar.includes("require('../store').useStore()")) {
  sidebar = sidebar.replace("require('../store').useStore()", "useStore()");
  if (!sidebar.includes("import { useStore }")) {
    sidebar = "import { useStore } from '../store';\n" + sidebar;
  }
  fs.writeFileSync('src/components/Sidebar.tsx', sidebar);
}

// Patch Login.tsx
let login = fs.readFileSync('src/components/Login.tsx', 'utf8');
if (login.includes("require('../store').useStore()")) {
  login = login.replace("require('../store').useStore()", "useStore()");
  if (!login.includes("import { useStore }")) {
    login = "import { useStore } from '../store';\n" + login;
  }
  fs.writeFileSync('src/components/Login.tsx', login);
}
