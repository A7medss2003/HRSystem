const fs = require('fs');
let store = fs.readFileSync('src/store.ts', 'utf8');

// Replace the deleteEmployee function to just mark as deleted instead of actual filtering
const deleteLogic = `
      deleteEmployee: (id) => set((state) => ({
        employees: state.employees.map((e) => (e.id === id ? { ...e, status: 'موقوف' } : e))
      })),
`;

store = store.replace(
  /deleteEmployee: \(id\) => set\(\(state\) => \(\{\s*employees: state\.employees\.filter\(\(e\) => e\.id !== id\),\s*leaves: state\.leaves\.filter\(\(l\) => l\.employeeId !== id\),\s*attendanceRecords: state\.attendanceRecords\.filter\(\(a\) => a\.employeeId !== id\),\s*payrolls: state\.payrolls\.filter\(\(p\) => p\.employeeId !== id\),\s*performanceReviews: state\.performanceReviews\.filter\(\(pr\) => pr\.employeeId !== id\)\s*\}\)\),/,
  deleteLogic.trim() + ','
);

fs.writeFileSync('src/store.ts', store);
