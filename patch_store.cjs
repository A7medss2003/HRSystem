const fs = require('fs');

let store = fs.readFileSync('src/store.ts', 'utf8');

// Update imports
if (!store.includes('SystemAuditLog')) {
  store = store.replace(
    "import { Employee, LeaveRequest, RoleDef, AttendanceRecord, Candidate, PayrollRecord, PerformanceReview } from './types';",
    "import { Employee, LeaveRequest, RoleDef, AttendanceRecord, Candidate, PayrollRecord, PerformanceReview, SystemAuditLog } from './types';"
  );
  
  store = store.replace(
    "  performanceReviews: PerformanceReview[];",
    "  performanceReviews: PerformanceReview[];\n  systemAuditLogs: SystemAuditLog[];"
  );
  
  store = store.replace(
    "  updatePerformanceReview: (review: PerformanceReview) => void;",
    "  updatePerformanceReview: (review: PerformanceReview) => void;\n  addSystemLog: (log: Omit<SystemAuditLog, 'id' | 'timestamp'>) => void;"
  );
  
  store = store.replace(
    "      performanceReviews: [],",
    "      performanceReviews: [],\n      systemAuditLogs: [],"
  );
  
  const addSysLogFunc = `
      addSystemLog: (log) => set((state) => ({
        systemAuditLogs: [
          {
            ...log,
            id: 'log-' + Date.now() + Math.random().toString(36).substring(2, 5),
            timestamp: new Date().toISOString()
          },
          ...state.systemAuditLogs
        ]
      })),
`;

  store = store.replace(
    "      addEmployee: (emp) => set((state) => ({ employees: [emp, ...state.employees] })),",
    addSysLogFunc + "      addEmployee: (emp) => set((state) => ({ employees: [emp, ...state.employees] })),"
  );
  
  fs.writeFileSync('src/store.ts', store);
}

