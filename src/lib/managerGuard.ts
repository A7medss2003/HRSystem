import { Employee } from '../types';

/**
 * Checks if an employee record represents a Manager / Director / Admin.
 * Used to protect manager data from being seen or edited by regular employees / data entry clerks.
 */
export function isManagerEmployee(emp?: Employee | null): boolean {
  if (!emp) return false;

  const role = (emp.defaultRole || '').toLowerCase();
  const linked = (emp.linkedUser || '').toLowerCase();
  const job = (emp.jobTitle || '').toLowerCase();
  const empId = (emp.employeeId || '').toUpperCase();
  const id = (emp.id || '').toLowerCase();
  const dept = (emp.department || '').toLowerCase();
  const email = (emp.workEmail || '').toLowerCase();

  return (
    role === 'admin' ||
    role === 'developer' ||
    linked === 'admin' ||
    linked === 'administrator' ||
    empId === 'ADMIN-001' ||
    id.startsWith('admin-') ||
    (emp.additionalRoles && emp.additionalRoles.includes('admin')) ||
    (emp.customPermissions && emp.customPermissions.includes('all')) ||
    job.includes('مدير عام') ||
    job.includes('المدير العام') ||
    job.includes('مدير النظام') ||
    job.includes('رئيس مجلس') ||
    dept.includes('الإدارة العليا') ||
    email.startsWith('admin@')
  );
}

/**
 * Checks if the logged-in user is a regular employee / data entry clerk
 * (i.e. NOT an admin, NOT a developer, and does NOT have 'all' permissions).
 */
export function isRegularUser(user?: { role?: string; permissions?: string[] } | null): boolean {
  if (!user) return true;
  if (user.role === 'admin' || user.role === 'developer') return false;
  if (user.permissions && user.permissions.includes('all')) return false;
  return true;
}
