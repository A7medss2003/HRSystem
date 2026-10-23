const fs = require('fs');
let file = fs.readFileSync('src/components/Topbar.tsx', 'utf8');

// Update props
file = file.replace(
  /export default function Topbar\(\{ \n   user, \n   onNavigate \}: \{/,
  `export default function Topbar({ 
   user, 
   onNavigate,
   isCollapsed,
   toggleCollapse
}: {`
);

file = file.replace(
  /onNavigate\?: \(menu: string, employeeId\?: string\) => void \}\) \{/,
  `onNavigate?: (menu: string, employeeId?: string) => void,
   isCollapsed?: boolean,
   toggleCollapse?: () => void
}) {`
);

// Add imports for Menu, Chevron etc if needed
if (!file.includes('Menu')) {
  file = file.replace(/import { Bell,/, "import { Bell, Menu,");
}

fs.writeFileSync('src/components/Topbar.tsx', file);
