const fs = require('fs');
let file = fs.readFileSync('src/pages/DeveloperSettings.tsx', 'utf8');

// The file has a branding section
const brandingSectionRegex = /<h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">\s*<ImageIcon size=\{20\} className="text-blue-500" \/>\s*تخصيص المظهر والشعار\s*<\/h3>/;

const newBrandingHeader = `<h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <ImageIcon size={20} className="text-blue-500" />
            تخصيص المظهر والشعار والألوان
          </h3>`;

file = file.replace(brandingSectionRegex, newBrandingHeader);

// We need to inject color picker state and handlers
const stateInjection = `const [bg, setBg] = useState(() => localStorage.getItem('app_bg'));`;
const colorStateInjection = `
  const [bg, setBg] = useState(() => localStorage.getItem('app_bg'));
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('app_primary_color') || '#2563eb');
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setPrimaryColor(color);
    localStorage.setItem('app_primary_color', color);
    document.documentElement.style.setProperty('--color-primary', color);
    
    // For lighter hover variant
    document.documentElement.style.setProperty('--color-primary-light', color + '20'); // 12% opacity roughly
    document.documentElement.style.setProperty('--color-primary-hover', color + 'E6'); // 90% opacity
  };
`;

file = file.replace(stateInjection, colorStateInjection);

const colorPickerUI = `
            <div className="border-t border-slate-100 pt-6 mt-6">
              <p className="text-sm text-slate-600 mb-2">لون المنظومة الأساسي</p>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={primaryColor} 
                  onChange={handleColorChange}
                  className="w-12 h-12 p-1 rounded-lg cursor-pointer border border-slate-200"
                  title="اختر اللون الأساسي للمنظومة"
                />
                <div className="flex-1 text-sm text-slate-500">
                  قم باختيار اللون الذي يتماشى مع هوية شركتك، سيتم تطبيقه على الأزرار والقوائم في التحديث القادم أو فوراً لبعض العناصر.
                </div>
              </div>
            </div>
`;

// Insert after the background upload section
file = file.replace(
  /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Data Management \*\/\}/,
  `</div>\n            </div>\n${colorPickerUI}\n          </div>\n        </div>\n        {/* Data Management */}`
);

fs.writeFileSync('src/pages/DeveloperSettings.tsx', file);
