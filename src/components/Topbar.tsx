import { Bell, Search, UserCircle, AlertTriangle, AlertCircle, Calendar, Clock, CheckSquare, X, ShieldAlert } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { toast } from './Toast';
import { Employee, LeaveRequest } from '../types';

export default function Topbar({ 
  user, 
  employees = [], 
  leaves = [], 
  onNavigate 
}: { 
  user: { role: string, username: string }, 
  employees?: Employee[], 
  leaves?: LeaveRequest[], 
  onNavigate?: (menu: string, employeeId?: string) => void 
}) {
  const [time, setTime] = useState(new Date());
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleName = (role: string) => {
    if (role === 'admin') return 'مدير النظام';
    if (role === 'accountant') return 'محاسب';
    return 'موظف';
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      toast('سيتم تفعيل ميزة البحث الشامل قريباً');
    }
  };

  // Base date for mock calculations (July 9, 2026 to align with mock database timelines)
  const today = new Date();
  const baseDate = today.getFullYear() === 2026 ? today : new Date('2026-07-09');

  // Generate notifications based on business logic
  const generatedNotifications = (() => {
    const list: {
      id: string;
      type: 'contract_expire' | 'contract_expired' | 'leave_active' | 'leave_upcoming' | 'leave_pending';
      title: string;
      description: string;
      date: string;
      severity: 'high' | 'medium' | 'info';
      employeeId?: string;
      linkMenu: 'employees' | 'leaves';
    }[] = [];

    // 1. Scan employee contracts
    employees.forEach(emp => {
      emp.contracts?.forEach(contract => {
        if (contract.endDate) {
          const end = new Date(contract.endDate);
          const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate());
          const baseZero = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
          
          const diffTime = endZero.getTime() - baseZero.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= 0 && diffDays <= 30) {
            list.push({
              id: `contract-warn-${contract.id}`,
              type: 'contract_expire',
              title: 'اقتراب انتهاء عقد عمل',
              description: `عقد الموظف (${emp.fullName}) ينتهي خلال ${diffDays} يوم في ${contract.endDate}`,
              date: contract.endDate,
              severity: diffDays <= 7 ? 'high' : 'medium',
              employeeId: emp.id,
              linkMenu: 'employees'
            });
          } else if (diffDays < 0) {
            list.push({
              id: `contract-exp-${contract.id}`,
              type: 'contract_expired',
              title: 'عقد عمل منتهي الصلاحية',
              description: `عقد الموظف (${emp.fullName}) انتهى في تاريخ ${contract.endDate}`,
              date: contract.endDate,
              severity: 'high',
              employeeId: emp.id,
              linkMenu: 'employees'
            });
          }
        }
      });
    });

    // 2. Scan leaves
    leaves.forEach(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      
      const startZero = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      const baseZero = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

      const todayTime = baseZero.getTime();
      const startTime = startZero.getTime();
      const endTime = endZero.getTime();

      if (leave.status === 'Approved') {
        if (todayTime >= startTime && todayTime <= endTime) {
          list.push({
            id: `leave-active-${leave.id}`,
            type: 'leave_active',
            title: 'موظف في إجازة حالياً',
            description: `الموظف (${leave.employeeName}) في إجازة حالياً (${leave.type}) حتى ${leave.endDate}`,
            date: leave.endDate,
            severity: 'info',
            linkMenu: 'leaves'
          });
        } else if (startTime > todayTime) {
          const diffDays = Math.ceil((startTime - todayTime) / (1000 * 60 * 60 * 24));
          if (diffDays <= 7) {
            list.push({
              id: `leave-upcoming-${leave.id}`,
              type: 'leave_upcoming',
              title: 'إجازة تبدأ قريباً',
              description: `تبدأ إجازة الموظف (${leave.employeeName}) خلال ${diffDays} يوم في ${leave.startDate}`,
              date: leave.startDate,
              severity: 'info',
              linkMenu: 'leaves'
            });
          }
        }
      } else if (leave.status === 'Pending' && ['admin', 'accountant'].includes(user.role)) {
        list.push({
          id: `leave-pending-${leave.id}`,
          type: 'leave_pending',
          title: 'طلب إجازة قيد الانتظار',
          description: `طلب (${leave.type}) للموظف (${leave.employeeName}) معلق وبحاجة للمراجعة`,
          date: leave.startDate,
          severity: 'medium',
          linkMenu: 'leaves'
        });
      }
    });

    return list.filter(item => !dismissedIds.includes(item.id));
  })();

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between px-8" dir="rtl">
      <div className="flex items-center gap-4 flex-1">
        {user.role !== 'employee' && (
          <div className="relative w-full max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث في النظام (اضغط Enter)..." 
              onKeyDown={handleSearch}
              className="w-full pl-4 pr-10 py-2 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 shrink-0">
        <div className="text-sm text-slate-500 font-medium hidden lg:block">
          {time.toLocaleDateString('ar-LY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          <span className="mx-2">|</span>
          {time.toLocaleTimeString('ar-LY')}
        </div>

        {/* Real-time Alerts Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className="relative text-slate-500 hover:text-slate-800 p-2 hover:bg-slate-100 rounded-full transition-colors duration-200 focus:outline-none"
            title="التنبيهات والإشعارات"
          >
            <Bell size={20} />
            {generatedNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                {generatedNotifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute left-0 mt-3 w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in duration-200" style={{ transformOrigin: 'top left' }}>
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-blue-600 animate-bounce" size={18} />
                  <h4 className="font-bold text-slate-800 text-sm">التنبيهات والإشعارات النشطة</h4>
                </div>
                {generatedNotifications.length > 0 && (
                  <button 
                    onClick={() => {
                      setDismissedIds([...dismissedIds, ...generatedNotifications.map(n => n.id)]);
                      toast('تم تعيين جميع التنبيهات كمقروءة');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {generatedNotifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex gap-3 relative group"
                  >
                    <div 
                      className="flex-1 cursor-pointer" 
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate(notif.linkMenu, notif.employeeId);
                          setShowNotifications(false);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${
                          notif.severity === 'high' ? 'bg-red-500 animate-ping' :
                          notif.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <h5 className="font-bold text-slate-800 text-xs">
                          {notif.title}
                        </h5>
                        <span className="text-[10px] text-slate-400 mr-auto font-mono">{notif.date}</span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{notif.description}</p>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDismissedIds([...dismissedIds, notif.id]);
                        toast('تم مسح التنبيه');
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      title="تجاهل"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {generatedNotifications.length === 0 && (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                    <CheckSquare className="text-emerald-500" size={32} />
                    <p className="text-sm font-semibold text-slate-700">لا توجد تنبيهات نشطة حالياً</p>
                    <p className="text-xs text-slate-400">عقود الموظفين وإجازاتهم تبدو في حالة ممتازة!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div onClick={() => toast('سيتم تفعيل صفحة الملف الشخصي قريباً')} className="flex items-center gap-3 pl-4 border-r border-slate-200 cursor-pointer">
          <div className="text-left hidden md:block">
            <p className="text-sm font-semibold text-slate-700 leading-none">{getRoleName(user.role)}</p>
            <p className="text-xs text-slate-500 mt-1" dir="ltr">{user.username}</p>
          </div>
          <UserCircle size={32} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}
