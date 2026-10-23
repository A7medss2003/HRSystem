const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.build.nsis.oneClick = true;
pkg.build.nsis.allowToChangeInstallationDirectory = false;

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
