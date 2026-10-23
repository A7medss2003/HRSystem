const fs = require('fs');
let file = fs.readFileSync('src/pages/DeveloperSettings.tsx', 'utf8');

// The issue is that primaryColor state is not inside the DeveloperSettings component, 
// because I injected it wrongly or it got replaced incorrectly.
// Let's find where the state is in DeveloperSettings and inject it properly inside the component function.

// Find the start of the component
file = file.replace(
  /export default function DeveloperSettings\(\) \{/,
  `export default function DeveloperSettings() {
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('app_primary_color') || '#2563eb');
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setPrimaryColor(color);
    localStorage.setItem('app_primary_color', color);
    document.documentElement.style.setProperty('--color-primary', color);
    document.documentElement.style.setProperty('--color-primary-light', color + '20'); 
    document.documentElement.style.setProperty('--color-primary-hover', color + 'E6'); 
  };\n`
);

// We need to clean up the bad injection if it happened outside or inside
// Looking at the previous patch: I injected it over `const [bg, setBg] = useState(() => localStorage.getItem('app_bg'));`
// Let's remove the duplicated one if it exists where it shouldn't.
file = file.replace(
  /const \[bg, setBg\] = useState\(\(\) => localStorage\.getItem\('app_bg'\)\);\s*const \[primaryColor, setPrimaryColor\] = useState\(\(\) => localStorage\.getItem\('app_primary_color'\) \|\| '#2563eb'\);\s*const handleColorChange = \[\s\S\]*?\};\s*/,
  "const [bg, setBg] = useState(() => localStorage.getItem('app_bg'));\n"
);


fs.writeFileSync('src/pages/DeveloperSettings.tsx', file);
