const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

if (!app.includes("if (systemSettings?.companyName === 'شركتي')")) {
  app = app.replace(
    "const { addSystemLog } = useStore();",
    "const { addSystemLog, systemSettings, updateSystemSettings } = useStore();\n\n  // تحديث الاسم الافتراضي القديم\n  if (systemSettings?.companyName === 'شركتي') {\n    updateSystemSettings({ ...systemSettings, companyName: 'مركز البنيان للتقنية و الصناعات الهندسية' });\n  }"
  );
  fs.writeFileSync('src/App.tsx', app);
}
