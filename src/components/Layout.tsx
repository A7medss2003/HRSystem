import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import EmployeeList from '../pages/EmployeeList';
import EmployeeDetail from '../pages/EmployeeDetail';
import Dashboard from '../pages/Dashboard';
import Payroll from '../pages/Payroll';
import Performance from '../pages/Performance';
import Recruitment from '../pages/Recruitment';
import Leaves from '../pages/Leaves';
import Attendance from '../pages/Attendance';
import { mockEmployees, mockLeaves } from '../data';
import { Employee, LeaveRequest } from '../types';

export default function Layout({ user, onLogout }: { user: { role: string, username: string }, onLogout: () => void }) {
  const [currentMenu, setCurrentMenu] = useState(user.role === 'employee' ? 'profile' : 'dashboard');
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(mockLeaves);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Redirect to correct default page if role changes
  useEffect(() => {
    if (user.role === 'employee' && !['profile', 'payroll', 'performance', 'leaves', 'attendance'].includes(currentMenu)) {
      setCurrentMenu('profile');
    } else if (user.role !== 'employee' && currentMenu === 'profile') {
      setCurrentMenu('dashboard');
    }
  }, [user.role, currentMenu]);

  const handleSave = (emp: Employee) => {
    if (isAdding) {
      setEmployees([emp, ...employees]);
      setIsAdding(false);
    } else {
      setEmployees(employees.map(e => e.id === emp.id ? emp : e));
    }
    setSelectedEmployeeId(emp.id);
  };

  const renderContent = () => {
    // Role-based routing protection
    if (user.role === 'employee' && !['profile', 'payroll', 'performance', 'leaves', 'attendance'].includes(currentMenu)) {
      return <div className="text-center p-8 text-red-500">غير مصرح لك بالوصول لهذه الوحدة</div>;
    }
    if (user.role === 'accountant' && currentMenu === 'recruitment') {
      return <div className="text-center p-8 text-red-500">غير مصرح لك بالوصول لهذه الوحدة</div>;
    }

    if (currentMenu === 'dashboard') return <Dashboard employees={employees} />;
    
    if (currentMenu === 'payroll') return <Payroll employees={employees} user={user} />;
    
    if (currentMenu === 'performance') return <Performance employees={employees} user={user} />;
    
    if (currentMenu === 'recruitment') return <Recruitment user={user} />;

    if (currentMenu === 'leaves') return <Leaves user={user} employees={employees} leaves={leaves} setLeaves={setLeaves} />;

    if (currentMenu === 'attendance') return <Attendance user={user} employees={employees} />;

    if (currentMenu === 'profile') {
      const myEmp = employees.find(e => e.employeeId === 'HR-1001') || employees[0]; // mock mapping
      return <EmployeeDetail employee={myEmp} onSave={handleSave} onBack={() => {}} hideBack={true} readOnly={true} />;
    }

    if (currentMenu === 'employees') {
      if (selectedEmployeeId || isAdding) {
        return (
          <EmployeeDetail 
            employee={isAdding ? null : employees.find(e => e.id === selectedEmployeeId) || null}
            onSave={handleSave}
            readOnly={user.role === 'accountant'} // Accountants can edit but let's say they can't fully modify everything? Actually prompt says: accountant edits without delete.
            onBack={() => {
              setSelectedEmployeeId(null);
              setIsAdding(false);
            }} 
          />
        );
      }

      return (
        <EmployeeList 
          employees={employees}
          userRole={user.role}
          onSelectEmployee={(id) => setSelectedEmployeeId(id)} 
          onAddEmployee={() => setIsAdding(true)}
        />
      );
    }

    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <p>جاري تطوير هذه الوحدة...</p>
      </div>
    );
  };

  const handleNavigate = (menu: string, empId?: string) => {
    setCurrentMenu(menu);
    if (empId) {
      setSelectedEmployeeId(empId);
      setIsAdding(false);
    } else {
      setSelectedEmployeeId(null);
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      <Sidebar 
        currentMenu={currentMenu} 
        setCurrentMenu={(menu) => {
          setCurrentMenu(menu);
          setSelectedEmployeeId(null);
          setIsAdding(false);
        }} 
        user={user}
        onLogout={onLogout}
      />
      <div className="mr-64 transition-all flex flex-col min-h-screen">
        <Topbar 
          user={user} 
          employees={employees} 
          leaves={leaves} 
          onNavigate={handleNavigate} 
        />
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
