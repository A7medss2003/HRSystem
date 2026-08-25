const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.main = "electron-main.cjs";
pkg.scripts["electron:dev"] = "concurrently -k \"npm run dev\" \"wait-on http://localhost:5173 && set NODE_ENV=development && electron .\"";
pkg.scripts["electron:build"] = "npm run build && electron-builder";

pkg.build = {
  appId: "com.hrsystem.app",
  productName: "HR System",
  directories: { output: "release" },
  publish: [{ provider: "generic", url: "http://127.0.0.1" }],
  win: { target: [{ target: "nsis", arch: ["x64", "ia32"] }] },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "نظام الموارد البشرية"
  }
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

let viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
if (!viteConfig.includes("base: './'")) {
  viteConfig = viteConfig.replace('plugins: [react()],', "plugins: [react()],\n  base: './',");
  fs.writeFileSync('vite.config.ts', viteConfig);
}
