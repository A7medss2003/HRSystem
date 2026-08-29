const fs = require('fs');
let file = fs.readFileSync('src/pages/DeveloperSettings.tsx', 'utf8');

const newReset = `  const handleFactoryReset = async () => {
    if (window.confirm('تحذير: سيتم مسح كافة البيانات والإعدادات والمرفقات وإعادة المنظومة للوضع الافتراضي. هل تريد المتابعة؟')) {
      try {
        const fileStore = localforage.createInstance({
          name: 'hr-system-files',
          storeName: 'files'
        });
        await fileStore.clear();
      } catch (err) {
        console.warn('Error clearing files:', err);
      }
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/');
    }
  };`;

file = file.replace(
  /const handleFactoryReset = async \(\) => \{[\s\S]*?\}\s*;\n/,
  newReset + '\n'
);

fs.writeFileSync('src/pages/DeveloperSettings.tsx', file);
