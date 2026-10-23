import { useState, useEffect } from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import { useStore } from '../store';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import EmployeeList from '../pages/EmployeeList';
import EmployeeDetail from '../pages/EmployeeDetail';
import Dashboard from '../pages/Dashboard';
import Payroll from '../pages/Payroll';
import Performance from '../pages/Performance';
import Recruitment from '../pages/Recruitment';
import Leaves from '../pages/Leaves';
import Roles from '../pages/Roles';
import Attendance from '../pages/Attendance';
import DeveloperSettings from '../pages/DeveloperSettings';
import Settings from '../pages/Settings';
import AuditLogs from '../pages/AuditLogs';
import BackupModal from './BackupModal';
import { mockEmployees, mockLeaves } from '../data';
import { Employee, LeaveRequest } from '../types';
import { isManagerEmployee, isRegularUser } from '../lib/managerGuard';

export default function Layout({ user, onLogout }: { user: { role: string, username: string, permissions: string[] }, onLogout: () => void }) {
  const { employees, leaves, addEmployee, updateEmployee, backupPath, lastBackupDate } = useStore();
  
  const getDefaultMenu = () => {
    const isAdmin = user.role === 'admin' || user.role === 'developer' || user.permissions?.includes('all');
    if (isAdmin) return 'dashboard';
    if (user.permissions?.includes('view_dashboard')) return 'dashboard';
    if (user.permissions?.includes('manage_employees') || user.permissions?.includes('add_employee')) return 'employees';
    if (user.permissions?.includes('manage_attendance')) return 'attendance';
    if (user.permissions?.includes('manage_leaves')) return 'leaves';
    if (user.permissions?.includes('view_payroll') || user.role === 'accountant') return 'payroll';
    if (user.permissions?.includes('manage_settings')) return 'settings';
    return 'attendance';
  };

  const [currentMenu, setCurrentMenu] = useState(getDefaultMenu);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addingCategory, setAddingCategory] = useState<'موظف أساسي' | 'متعاقد' | 'متعاون'>('موظف أساسي');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync menu if user permissions change and current menu is no longer accessible
  useEffect(() => {
    const isAdmin = user.role === 'admin' || user.role === 'developer' || user.permissions?.includes('all');
    if (!isAdmin) {
      if (currentMenu === 'settings' && !user.permissions?.includes('manage_settings')) {
        setCurrentMenu(getDefaultMenu());
      }
    }
  }, [user.permissions, user.role]);

  const handleSave = (emp: Employee) => {
    if (isAdding) {
      addEmployee(emp);
      setIsAdding(false);
    } else {
      updateEmployee(emp);
    }
    setSelectedEmployeeId(emp.id);
  };

  const renderContent = () => {
    // Role-based routing protection
    const isAdmin = user.role === 'admin' || user.role === 'developer' || user.permissions?.includes('all');
    let hasAccess = false;
    
    if (isAdmin) {
      hasAccess = true;
    } else {
      const permMap: Record<string, string> = {
        'dashboard': 'view_dashboard',
        'employees': 'manage_employees',
        'payroll': 'view_payroll',
        'attendance': 'manage_attendance',
        'leaves': 'manage_leaves',
        'settings': 'manage_settings',
        'roles': 'all',
        'recruitment': 'all',
        'audit_logs': 'all',
      };
      
      const reqPerm = permMap[currentMenu];
      if (reqPerm && user.permissions?.includes(reqPerm)) {
        hasAccess = true;
      } else if (currentMenu === 'employees' && user.permissions?.includes('add_employee')) {
        hasAccess = true;
      } else if (!reqPerm && (user.role === 'accountant' || user.role === 'employee')) {
        hasAccess = true; 
      }
      
      if (user.role === 'accountant' && currentMenu === 'recruitment') hasAccess = false;
      if (currentMenu === 'dev_settings' && user.role !== 'developer') hasAccess = false;
      // Never allow regular employee into settings without manage_settings permission
      if (currentMenu === 'settings' && !user.permissions?.includes('manage_settings')) hasAccess = false;
    }

    if (!hasAccess) return <div className="text-center p-8 text-red-500 font-bold">غير مصرح لك بالوصول لهذه الوحدة</div>;

    if (currentMenu === 'dashboard') return <Dashboard user={user} />;
    
    if (currentMenu === 'payroll') return <Payroll user={user} />;
    
    if (currentMenu === 'performance') return <Performance user={user} />;
    
    if (currentMenu === 'recruitment') return <Recruitment user={user} />;

    if (currentMenu === 'leaves') return <Leaves user={user} />;

    if (currentMenu === 'attendance') return <Attendance user={user} />;

    if (currentMenu === 'audit_logs' && (user.role === 'admin' || user.role === 'developer')) return <AuditLogs />;
    if (currentMenu === 'roles' && (user.role === 'admin' || user.role === 'developer' || user.permissions?.includes('all'))) return <Roles />;

    if (currentMenu === 'dev_settings' && user.role === 'developer') return <DeveloperSettings />;

    if (currentMenu === 'settings') {
      return <Settings user={user} />;
    }

    if (currentMenu === 'employees') {
      const selectedEmp = employees.find(e => e.id === selectedEmployeeId);
      if (selectedEmp && isRegularUser(user) && isManagerEmployee(selectedEmp)) {
        return (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto my-12" dir="rtl">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">غير مصرح لك بالوصول</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              بيانات المدير العام / مدير النظام محمية ومخصصة للإدارة العليا فقط، ولا يمكن استعراضها أو الاطلاع عليها أو تعديلها من قبل مسجل البيانات.
            </p>
            <button
              onClick={() => setSelectedEmployeeId(null)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-sm shadow-blue-200"
            >
              العودة لدليل الموظفين
            </button>
          </div>
        );
      }

      if (selectedEmployeeId || isAdding) {
        return (
          <EmployeeDetail 
            user={user}
            employee={isAdding ? null : employees.find(e => e.id === selectedEmployeeId) || null}
            initialCategory={addingCategory}
            onSave={handleSave}
            readOnly={user.role === 'accountant'}
            onBack={() => {
              setSelectedEmployeeId(null);
              setIsAdding(false);
            }} 
          />
        );
      }

      return (
        <EmployeeList 
          user={user}
          userRole={user.role}
          onSelectEmployee={(id) => setSelectedEmployeeId(id)} 
          onAddEmployee={(cat = 'موظف أساسي') => {
            setAddingCategory(cat);
            setIsAdding(true);
          }}
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

  const customBg = localStorage.getItem('app_bg');

  return (
    <div 
      className="min-h-screen bg-[#f4f7f9] font-sans relative" 
      dir="rtl"
      style={customBg ? { backgroundImage: `url(${customBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {}}
    >
      {customBg && <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-0 pointer-events-none"></div>}
      
      <div className="relative z-10">
        <Sidebar 
          currentMenu={currentMenu} 
          setCurrentMenu={(menu) => {
            setCurrentMenu(menu);
            setSelectedEmployeeId(null);
            setIsAdding(false);
          }} 
          user={user}
          onLogout={onLogout}
          isCollapsed={isCollapsed}
          toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      <div className={`transition-all duration-300 flex flex-col min-h-screen relative ${isCollapsed ? 'mr-24' : 'mr-72'}`}>
        {/* Background Watermark Removed */}
        
        <Topbar 
          user={user} 
          onNavigate={handleNavigate} 
        />
        
        <main className="flex-1 p-8 relative z-0">
          {renderContent()}
        </main>
      </div>
      <BackupModal userRole={user.role} />
    </div>
  </div>
  );
}