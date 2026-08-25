const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');
content = content.replace(
  /deleteEmployee: \(id\) => set\(\(state\) => \(\{\n\s*employees: state\.employees\.filter\(\(e\) => e\.id !== id\),\n\s*\}\)\),/,
  `deleteEmployee: (id) => set((state) => ({
        employees: state.employees.filter((e) => e.id !== id),
        leaves: state.leaves.filter((l) => l.employeeId !== id),
        attendanceRecords: state.attendanceRecords.filter((a) => a.employeeId !== id),
        payrolls: state.payrolls.filter((p) => p.employeeId !== id),
        performanceReviews: state.performanceReviews.filter((pr) => pr.employeeId !== id)
      })),`
);
fs.writeFileSync('src/store.ts', content);
