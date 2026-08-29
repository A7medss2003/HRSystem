import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
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

export default function Layout({ user, onLogout }: { user: { role: string, username: string }, onLogout: () => void }) {
  const { employees, leaves, addEmployee, updateEmployee, backupPath, lastBackupDate } = useStore();
  const [currentMenu, setCurrentMenu] = useState(user.role === 'employee' ? 'settings' : 'dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addingCategory, setAddingCategory] = useState<'موظف أساسي' | 'متعاقد' | 'متعاون'>('موظف أساسي');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Redirect to correct default page if role changes
  useEffect(() => {
    if (user.role === 'employee' && !['settings', 'payroll', 'performance', 'leaves', 'attendance'].includes(currentMenu)) {
      setCurrentMenu('settings');
    }
  }, [user.role, currentMenu]);

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
    if (user.role === 'employee' && !['settings', 'payroll', 'performance', 'leaves', 'attendance'].includes(currentMenu)) {
      return <div className="text-center p-8 text-red-500">غير مصرح لك بالوصول لهذه الوحدة</div>;
    }
    if (user.role === 'accountant' && currentMenu === 'recruitment') {
      return <div className="text-center p-8 text-red-500">غير مصرح لك بالوصول لهذه الوحدة</div>;
    }

    if (currentMenu === 'dashboard') return <Dashboard />;
    
    if (currentMenu === 'payroll') return <Payroll user={user} />;
    
    if (currentMenu === 'performance') return <Performance user={user} />;
    
    if (currentMenu === 'recruitment') return <Recruitment user={user} />;

    if (currentMenu === 'leaves') return <Leaves user={user} />;

    if (currentMenu === 'attendance') return <Attendance user={user} />;

    if (currentMenu === 'audit_logs' && (user.role === 'admin' || user.role === 'developer')) return <AuditLogs />;
    if (currentMenu === 'roles' && (user.role === 'admin' || user.role === 'developer')) return <Roles />;

    if (currentMenu === 'dev_settings' && user.role === 'developer') return <DeveloperSettings />;

    if (currentMenu === 'settings') {
      return <Settings user={user} />;
    }

    if (currentMenu === 'employees') {
      if (selectedEmployeeId || isAdding) {
        return (
          <EmployeeDetail 
            employee={isAdding ? null : employees.find(e => e.id === selectedEmployeeId) || null}
            initialCategory={addingCategory}
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
      className="min-h-screen bg-slate-50 font-sans relative" 
      dir="rtl"
      style={customBg ? { backgroundImage: `url(${customBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {}}
    >
      {customBg && <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-0 pointer-events-none"></div>}
      
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
      <div className={`transition-all duration-300 flex flex-col min-h-screen relative ${isCollapsed ? 'mr-20' : 'mr-64'}`}>
        {/* Background Watermark */}
        <div 
          className={`pointer-events-none fixed inset-0 z-0 opacity-[0.03] transition-all duration-300 ${isCollapsed ? 'mr-20' : 'mr-64'}`}
          style={{
            backgroundImage: `url(${localStorage.getItem('app_logo') || import.meta.env.BASE_URL + 'logo.png'})`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '50% auto'
          }}
        />
        
        <Topbar 
          user={user} 
          onNavigate={handleNavigate} 
        />
        
        {/* Backup Alert Banner */}
        {user.role === 'admin' && backupPath && (!lastBackupDate || (new Date().getTime() - new Date(lastBackupDate).getTime()) / (1000 * 3600 * 24) > 7) && (
          <div className="bg-red-50 border-b border-red-200 p-3 px-8 flex flex-col sm:flex-row items-center justify-between z-10 relative gap-3">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle size={20} className="animate-pulse shrink-0" />
              <p className="text-sm font-medium">تحذير: لم يتم إجراء نسخة احتياطية للبيانات منذ أكثر من 7 أيام. يرجى إنشاء نسخة احتياطية الآن لضمان أمان البيانات.</p>
            </div>
            <button 
              onClick={() => handleNavigate('settings')}
              className="text-xs bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors font-medium shadow-sm shrink-0 whitespace-nowrap"
            >
              الذهاب للإعدادات
            </button>
          </div>
        )}
  
        <main className="flex-1 p-8 relative z-0">
          {renderContent()}
        </main>
      </div>
      <BackupModal userRole={user.role} />
    </div>
  </div>
  );
}