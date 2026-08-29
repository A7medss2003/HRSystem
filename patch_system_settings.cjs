const fs = require('fs');

// 1. types.ts
let types = fs.readFileSync('src/types.ts', 'utf8');
if (!types.includes('SystemSettings')) {
  types += `\nexport interface SystemSettings {\n  companyName: string;\n  logoUrl?: string;\n  primaryLanguage: 'ar' | 'en';\n  fiscalYearStart: string;\n}\n`;
  fs.writeFileSync('src/types.ts', types);
}

// 2. store.ts
let store = fs.readFileSync('src/store.ts', 'utf8');
if (!store.includes('SystemSettings')) {
  store = store.replace(
    "import { Employee, LeaveRequest, RoleDef, AttendanceRecord, Candidate, PayrollRecord, PerformanceReview, SystemAuditLog } from './types';",
    "import { Employee, LeaveRequest, RoleDef, AttendanceRecord, Candidate, PayrollRecord, PerformanceReview, SystemAuditLog, SystemSettings } from './types';"
  );
  store = store.replace(
    "  systemAuditLogs: SystemAuditLog[];",
    "  systemAuditLogs: SystemAuditLog[];\n  systemSettings: SystemSettings;\n  updateSystemSettings: (settings: SystemSettings) => void;"
  );
  store = store.replace(
    "      systemAuditLogs: [],",
    "      systemAuditLogs: [],\n      systemSettings: { companyName: 'شركتي', primaryLanguage: 'ar', fiscalYearStart: '01-01' },\n      updateSystemSettings: (settings) => set({ systemSettings: settings }),"
  );
  fs.writeFileSync('src/store.ts', store);
}
