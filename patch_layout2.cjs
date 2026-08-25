const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// The original ending was:
//       </div>
//     </div>
//   );
// }

// Let's just fix it manually from line 159 down.
content = content.replace(
  /<main className="flex-1 p-8 relative z-0">[\s\S]*$/m,
  `<main className="flex-1 p-8 relative z-0">
          {renderContent()}
        </main>
      </div>
      <BackupModal userRole={user.role} />
    </div>
  </div>
  );
}`
);

fs.writeFileSync('src/components/Layout.tsx', content);
