const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// التأكد من وجود dependencies إذا لم تكن موجودة
if (!pkg.dependencies) {
  pkg.dependencies = {};
}

// التأكد من وجود devDependencies إذا لم تكن موجودة
if (!pkg.devDependencies) {
  pkg.devDependencies = {};
}

// إضافة electron-updater إلى الـ dependencies الأساسية
pkg.dependencies['electron-updater'] = '^6.1.7'; 

// تنظيفها من الـ devDependencies إذا كانت موجودة بالخطأ
if (pkg.devDependencies['electron-updater']) {
  delete pkg.devDependencies['electron-updater'];
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Dependencies updated successfully!');
