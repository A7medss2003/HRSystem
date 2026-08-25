const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Add import
if (!content.includes('BackupModal')) {
  content = content.replace(
    /import Settings from '\.\.\/pages\/Settings';/,
    "import Settings from '../pages/Settings';\nimport BackupModal from './BackupModal';"
  );

  // Add the modal inside the main container before the closing div
  content = content.replace(
    /<\/div>\s*<\/div>\s*<\/div>\s*\);\s*}\s*$/m,
    "      </div>\n        </div>\n      </div>\n      <BackupModal userRole={user.role} />\n    </div>\n  );\n}"
  );
  
  fs.writeFileSync('src/components/Layout.tsx', content);
}
