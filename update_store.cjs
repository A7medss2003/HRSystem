const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

// Add interface properties
content = content.replace(
  /addPerformanceReview: \(review: PerformanceReview\) => void;/,
  "addPerformanceReview: (review: PerformanceReview) => void;\n  backupPath: string | null;\n  setBackupPath: (path: string | null) => void;"
);

// Add implementation properties
content = content.replace(
  /employees: mockEmployees,/,
  "backupPath: null,\n      setBackupPath: (path) => set({ backupPath: path }),\n      employees: mockEmployees,"
);

fs.writeFileSync('src/store.ts', content);
