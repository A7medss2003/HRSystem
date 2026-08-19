import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Employee, LeaveRequest, RoleDef, AttendanceRecord, Candidate, PayrollRecord, PerformanceReview } from './types';
import { mockEmployees, mockLeaves } from './data';

interface AppState {
  employees: Employee[];
  leaves: LeaveRequest[];
  roles: RoleDef[];
  attendanceRecords: AttendanceRecord[];
  candidates: Candidate[];
  payrolls: PayrollRecord[];
  performanceReviews: PerformanceReview[];
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  
  addEmployee: (employee: Employee) => void;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  
  addLeave: (leave: LeaveRequest) => void;
  updateLeave: (leave: LeaveRequest) => void;
  deleteLeave: (id: string) => void;

  setRoles: (roles: RoleDef[]) => void;
  setAttendanceRecords: (records: AttendanceRecord[]) => void;
  addCandidate: (candidate: Candidate) => void;
  updateCandidate: (candidate: Candidate) => void;
  setPayrolls: (payrolls: PayrollRecord[]) => void;
  addPerformanceReview: (review: PerformanceReview) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      employees: mockEmployees,
      leaves: mockLeaves,
      roles: [
        { id: 'admin', name: 'المدير', permissions: ['all'] },
        { id: 'accountant', name: 'المحاسب', permissions: ['view_dashboard', 'manage_employees', 'view_payroll'] },
        { id: 'employee', name: 'الموظف', permissions: ['view_profile', 'request_leave'] }
      ],
      attendanceRecords: [],
      candidates: [
        { id: 'cand-1', name: 'أحمد علي', position: 'مهندس برمجيات', stage: 'new', dateAdded: new Date().toISOString().split('T')[0] },
        { id: 'cand-2', name: 'سالم محمد', position: 'مصمم واجهات', stage: 'screening', dateAdded: new Date().toISOString().split('T')[0] }
      ],
      payrolls: [],
      performanceReviews: [],
      globalSearchQuery: '',
      setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
      
      addEmployee: (emp) => set((state) => ({ employees: [emp, ...state.employees] })),
      updateEmployee: (emp) => set((state) => ({
        employees: state.employees.map((e) => (e.id === emp.id ? emp : e)),
      })),
      deleteEmployee: (id) => set((state) => ({
        employees: state.employees.filter((e) => e.id !== id),
      })),
      
      addLeave: (leave) => set((state) => ({ leaves: [leave, ...state.leaves] })),
      updateLeave: (leave) => set((state) => ({
        leaves: state.leaves.map((l) => (l.id === leave.id ? leave : l)),
      })),
      deleteLeave: (id) => set((state) => ({
        leaves: state.leaves.filter((l) => l.id !== id),
      })),

      setRoles: (roles) => set({ roles }),
      setAttendanceRecords: (attendanceRecords) => set({ attendanceRecords }),
      addCandidate: (candidate) => set((state) => ({ candidates: [candidate, ...state.candidates] })),
      updateCandidate: (candidate) => set((state) => ({
        candidates: state.candidates.map(c => c.id === candidate.id ? candidate : c)
      })),
      setPayrolls: (payrolls) => set({ payrolls }),
      addPerformanceReview: (review) => set((state) => ({ performanceReviews: [review, ...state.performanceReviews] }))
    }),
    {
      name: 'hr-system-storage',
    }
  )
);
