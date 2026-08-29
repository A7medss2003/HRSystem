const fs = require('fs');

let types = fs.readFileSync('src/types.ts', 'utf8');

const auditLogType = `
export interface SystemAuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}
`;

if (!types.includes('SystemAuditLog')) {
  types += auditLogType;
  fs.writeFileSync('src/types.ts', types);
}

