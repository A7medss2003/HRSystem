const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  const gitDir = path.resolve(process.cwd(), '.git');
  const hooksDir = path.resolve(process.cwd(), '.githooks');

  if (fs.existsSync(gitDir) && fs.existsSync(hooksDir)) {
    execSync('git config core.hooksPath .githooks', { stdio: 'ignore' });
  }
} catch (e) {
  // Safe fail-silent: will never crash npm install on any OS or outside git
}
process.exit(0);
