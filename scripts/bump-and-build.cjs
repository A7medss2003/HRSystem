const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Script to bump version and generate in-place update installer
console.log('====================================================');
console.log('   تجهيز نسخة تحديث جديدة للمنظومة (In-Place Update)   ');
console.log('====================================================');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Determine bump type: patch (default), minor, or major
const bumpType = process.argv[2] || 'patch';
const currentVersion = pkg.version || '1.1.0';
const parts = currentVersion.split('.').map(n => parseInt(n, 10));

if (bumpType === 'minor') {
  parts[1] = (parts[1] || 0) + 1;
  parts[2] = 0;
} else if (bumpType === 'major') {
  parts[0] = (parts[0] || 1) + 1;
  parts[1] = 0;
  parts[2] = 0;
} else {
  // patch
  parts[2] = (parts[2] || 0) + 1;
}

const newVersion = parts.join('.');
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');

// Also update src/version.ts
const versionTsPath = path.join(__dirname, '..', 'src', 'version.ts');
const today = new Date().toISOString().split('T')[0];
const versionContent = `// Single source of truth for Application Version
export const APP_VERSION = '${newVersion}';
export const APP_RELEASE_DATE = '${today}';
export const APP_BUILD_TYPE = 'تحديث تراكمي في نفس المسار (In-Place Upgrade)';
export const DEFAULT_REPO_URL = 'https://github.com/smywahmd1/hr-system';
export const DEFAULT_BRANCH = 'main';
`;
fs.writeFileSync(versionTsPath, versionContent, 'utf8');

// Ensure root copies of backend modules are synced before electron packaging
const srcUpdater = path.join(__dirname, '..', 'src', 'server', 'githubUpdater.cjs');
const dstUpdater = path.join(__dirname, '..', 'githubUpdater.cjs');
if (fs.existsSync(srcUpdater)) {
  fs.copyFileSync(srcUpdater, dstUpdater);
}

const srcScanner = path.join(__dirname, '..', 'src', 'server', 'scannerDriver.cjs');
const dstScanner = path.join(__dirname, '..', 'scannerDriver.cjs');
if (fs.existsSync(srcScanner)) {
  fs.copyFileSync(srcScanner, dstScanner);
}

console.log(`\n✓ تم ترقية رقم الإصدار من ${currentVersion} إلى: ${newVersion}`);
console.log('✓ جاري بناء ملفات الواجهة (Vite Build)...');

try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✓ جاري بناء حزمة التحديث ومثبت ويندوز (electron-builder)...');
  execSync('npx electron-builder --win --x64', { stdio: 'inherit' });
  
  // Copy built installer and latest.yml directly into HR_Update for flash drive ready-to-copy
  const releaseDir = path.join(__dirname, '..', 'release');
  const hrUpdateDir = path.join(__dirname, '..', 'HR_Update');
  if (!fs.existsSync(hrUpdateDir)) {
    fs.mkdirSync(hrUpdateDir, { recursive: true });
  }

  if (fs.existsSync(releaseDir)) {
    const files = fs.readdirSync(releaseDir);
    for (const f of files) {
      if (f.endsWith('.exe') || f === 'latest.yml') {
        const srcFile = path.join(releaseDir, f);
        const dstFile = path.join(hrUpdateDir, f);
        fs.copyFileSync(srcFile, dstFile);
        console.log(`✓ تم نسخ ${f} تلقائياً إلى مجلد HR_Update`);
      }
    }
  }

  console.log('\n====================================================');
  console.log(`✓ اكتمل تجهيز التحديث بنجاح! الإصدار: ${newVersion}`);
  console.log('✓ مجلد [HR_Update] أصبح جاهزاً بالكامل للنسخ المباشر إلى الفلاشة (USB)');
  console.log('✓ يحتوي المجلد على ملف التثبيت المباشر وملف latest.yml ودليل الترقية.');
  console.log('====================================================\n');
} catch (err) {
  console.error('حدث خطأ أثناء بناء التحديث:', err.message);
  process.exit(1);
}
