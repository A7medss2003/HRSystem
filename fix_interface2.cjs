const fs = require('fs');
let store = fs.readFileSync('src/store.ts', 'utf8');
if (!store.includes('addSystemLog:')) {
  store = store.replace(
    "  addPerformanceReview: (review: PerformanceReview) => void;",
    "  addPerformanceReview: (review: PerformanceReview) => void;\n  addSystemLog: (log: Omit<SystemAuditLog, 'id' | 'timestamp'>) => void;"
  );
  fs.writeFileSync('src/store.ts', store);
}
