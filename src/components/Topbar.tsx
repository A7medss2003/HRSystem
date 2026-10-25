import { Bell, Search, UserCircle, AlertTriangle, AlertCircle, Calendar, Clock, CheckSquare, X, ShieldAlert, Cable, Server } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { toast } from './Toast';
import { Employee, LeaveRequest } from '../types';
import { isManagerEmployee, isRegularUser } from '../lib/managerGuard';
import { getStoredServerConfig, fetchNetworkInterfaces } from '../lib/serverSync';
import EthernetServerModal from './EthernetServerModal';

import { useStore } from '../store';

export default function Topbar({ 
  user, 
  onNavigate 
}: { 
  user: { role: string, username: string, permissions?: string[] }, 
  onNavigate?: (menu: string, employeeId?: string) => void 
}) {
  const { employees, leaves, setGlobalSearchQuery, globalSearchQuery } = useStore();
  const [time, setTime] = useState(new Date());

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dismissed_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEthernetModal, setShowEthernetModal] = useState(false);
  const [ethernetIp, setEthernetIp] = useState<string>('192.168.1.1');
  const [serverPort, setServerPort] = useState<number>(3000);
  const [serverRole, setServerRole] = useState<'host' | 'client' | 'standalone'>('host');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const conf = getStoredServerConfig();
      setServerRole(conf.role);
      if (conf.port) setServerPort(conf.port);
      if (conf.customEthernetIp) {
        setEthernetIp(conf.customEthernetIp);
      } else {
        fetchNetworkInterfaces().then(info => {
          if (info.ethernetIp) setEthernetIp(info.ethernetIp);
        }).catch(() => {});
      }
    } catch (e) {}
  }, [showEthernetModal]);

  useEffect(() => {
    localStorage.setItem('dismissed_notifications', JSON.stringify(dismissedIds));
  }, [dismissedIds]);

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

  const isDevOrAdmin = user?.role === 'admin' || user?.role === 'developer' || user?.permissions?.includes('all');

  const getRoleName = (role: string) => {
    if (role === 'admin') return 'مدير النظام';
    if (role === 'accountant') return 'محاسب';
    return 'موظف';
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGlobalSearchQuery(val);
    if (val.trim() !== '' && onNavigate) {
      onNavigate('employees');
    }
  };

  const handleProfileClick = () => {
    if (!onNavigate) return;
    
    // ربط الحسابات الوهمية (Demo) بملفات موظفين فعلية للتجربة
    let myEmpId = 'emp-1'; // افتراضياً لمدير النظام
    if (user.role === 'accountant') myEmpId = 'emp-2';
    if (user.role === 'employee') myEmpId = 'emp-3';
    
    onNavigate('employees', myEmpId);
  };

  // Base date for accurate real-time timeline comparisons
  const baseDate = new Date();

  const [filterTab, setFilterTab] = useState<'all' | 'high'>('all');

  // Generate notifications with smart memoization to prevent lag and CPU spikes
  const generatedNotifications = React.useMemo(() => {
    const list: {
      id: string;
      type: 'contract_expire' | 'contract_expired' | 'leave_active' | 'leave_upcoming' | 'leave_pending' | 'doc_expire' | 'doc_expired' | 'system';
      title: string;
      description: string;
      date: string;
      severity: 'high' | 'medium' | 'info';
      employeeId?: string;
      linkMenu: 'employees' | 'leaves' | 'settings' | 'dev_settings';
    }[] = [];
    
    const isAdmin = user.role === 'admin' || user.role === 'developer' || (user.permissions || []).includes('all');
    const canManageEmployees = isAdmin || (user.permissions || []).includes('manage_employees');
    const canManageLeaves = isAdmin || (user.permissions || []).includes('manage_leaves');

    const now = new Date();
    const baseZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Scan active employee contracts (only latest contract, ignore ancient historical contracts)
    if (canManageEmployees) {
      employees
        .filter(emp => (isAdmin || !isManagerEmployee(emp)) && (emp.status === 'نشط' || !emp.status))
        .forEach(emp => {
          if (emp.contracts && emp.contracts.length > 0) {
            const validContracts = emp.contracts.filter(c => c && c.endDate);
            if (validContracts.length > 0) {
              const latestContract = [...validContracts].sort(
                (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
              )[0];

              if (latestContract && latestContract.endDate) {
                const end = new Date(latestContract.endDate);
                if (!isNaN(end.getTime())) {
                  const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                  const diffTime = endZero.getTime() - baseZero.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  if (diffDays >= 0 && diffDays <= 30) {
                    list.push({
                      id: `contract-warn-${latestContract.id || emp.id}`,
                      type: 'contract_expire',
                      title: 'اقتراب انتهاء عقد عمل',
                      description: `عقد الموظف (${emp.fullName}) ينتهي خلال ${diffDays} يوم في ${latestContract.endDate}`,
                      date: latestContract.endDate,
                      severity: diffDays <= 7 ? 'high' : 'medium',
                      employeeId: emp.id,
                      linkMenu: 'employees'
                    });
                  } else if (diffDays < 0 && diffDays >= -30) {
                    // Only flag contracts expired within the last 30 days
                    list.push({
                      id: `contract-exp-${latestContract.id || emp.id}`,
                      type: 'contract_expired',
                      title: 'عقد عمل منتهي الصلاحية',
                      description: `عقد الموظف (${emp.fullName}) انتهى في تاريخ ${latestContract.endDate}`,
                      date: latestContract.endDate,
                      severity: 'high',
                      employeeId: emp.id,
                      linkMenu: 'employees'
                    });
                  }
                }
              }
            }
          }

          // 2. Scan official documents for active employees (within last 30 days or next 30 days)
          const checkDoc = (docTitle: string, expiryStr?: string) => {
            if (!expiryStr) return;
            const exp = new Date(expiryStr);
            if (isNaN(exp.getTime())) return;
            const expZero = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
            const diffDays = Math.ceil((expZero.getTime() - baseZero.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays <= 30) {
              list.push({
                id: `doc-warn-${emp.id}-${docTitle}`,
                type: 'doc_expire',
                title: `اقتراب انتهاء ${docTitle}`,
                description: `${docTitle} للموظف (${emp.fullName}) ينتهي خلال ${diffDays} يوم في ${expiryStr}`,
                date: expiryStr,
                severity: diffDays <= 7 ? 'high' : 'medium',
                employeeId: emp.id,
                linkMenu: 'employees'
              });
            } else if (diffDays < 0 && diffDays >= -30) {
              list.push({
                id: `doc-exp-${emp.id}-${docTitle}`,
                type: 'doc_expired',
                title: `${docTitle} منتهي الصلاحية`,
                description: `${docTitle} للموظف (${emp.fullName}) انتهى في تاريخ ${expiryStr}`,
                date: expiryStr,
                severity: 'high',
                employeeId: emp.id,
                linkMenu: 'employees'
              });
            }
          };

          checkDoc('التأشيرة', emp.visaExpiry);
          checkDoc('تصريح العمل', emp.permitExpiry);
        });
    }

    // 3. Scan current and pending leaves
    if (canManageLeaves) {
      leaves.forEach(leave => {
        if (!leave.startDate || !leave.endDate) return;
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

        const startZero = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate());
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
        } else if (leave.status === 'Pending') {
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
    }

    return list.filter(item => !dismissedIds.includes(item.id));
  }, [employees, leaves, dismissedIds, user]);

  const highSeverityCount = generatedNotifications.filter(n => n.severity === 'high').length;
  const displayedNotifications = filterTab === 'high' 
    ? generatedNotifications.filter(n => n.severity === 'high') 
    : generatedNotifications;

  return (
    <>
      <header className="h-[76px] bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-8 shadow-sm" dir="rtl">
      <div className="flex items-center gap-4 flex-1">
        {user.role !== 'employee' && (
          <div className="relative w-full max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="البحث عن موظف..." 
              value={globalSearchQuery || ''}
              onChange={handleSearchChange}
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

        {/* Ethernet LAN Server Status Badge (Only for Admin and Developer) */}
        {isDevOrAdmin && (
          <button
            type="button"
            onClick={() => setShowEthernetModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
              serverRole === 'host'
                ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                : 'bg-indigo-50/90 text-indigo-800 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300'
            }`}
            title="إعدادات كابل الإيثرنت والسيرفر السلكي المباشر"
          >
            <div className="relative flex items-center justify-center">
              <Cable size={16} className={serverRole === 'host' ? 'text-emerald-600' : 'text-indigo-600'} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex flex-col text-right leading-tight hidden sm:flex">
              <span className="text-[10px] text-slate-500 font-medium">
                {serverRole === 'host' ? 'سيرفر الإيثرنت السلكي:' : 'متصل كعميل:'}
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-800" dir="ltr">
                {ethernetIp}:{serverPort}
              </span>
            </div>
          </button>
        )}

        {/* Real-time Alerts Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className="relative text-slate-500 hover:text-slate-800 p-2 hover:bg-slate-100 rounded-full transition-colors duration-200 focus:outline-none"
            title="التنبيهات والإشعارات"
          >
            <Bell size={20} />
            {generatedNotifications.length > 0 && (
              <span className={`absolute -top-1 -right-1 px-1.5 h-[18px] min-w-[18px] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-xs ${
                highSeverityCount > 0 ? 'bg-red-500 animate-pulse ring-2 ring-red-300/50' : 'bg-blue-600'
              }`}>
                {generatedNotifications.length > 99 ? '99+' : generatedNotifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute left-0 mt-3 w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in duration-200" style={{ transformOrigin: 'top left' }}>
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldAlert className={highSeverityCount > 0 ? "text-red-500 animate-bounce" : "text-blue-600"} size={18} />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">التنبيهات والإشعارات النشطة</h4>
                    {highSeverityCount > 0 && (
                      <span className="text-[10px] text-red-600 font-bold block">
                        يوجد {highSeverityCount} تنبيهات حمراء عاجلة
                      </span>
                    )}
                  </div>
                </div>
                {generatedNotifications.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => {
                      setDismissedIds(prev => Array.from(new Set([...prev, ...generatedNotifications.map(n => n.id)])));
                      toast('تم مسح وحل جميع البلاغات والتنبيهات بنجاح (العدد 0) ✅', 'success');
                    }}
                    className="text-xs text-rose-700 hover:text-white font-bold transition-all cursor-pointer bg-rose-50 hover:bg-rose-600 px-2.5 py-1.5 rounded-lg border border-rose-200 shadow-2xs"
                    title="تصفير وحل كافة البلاغات والتنبيهات دفعة واحدة"
                  >
                    مسح وحل الكل ({generatedNotifications.length})
                  </button>
                )}
              </div>

              {/* Filter Tabs for All vs High (Red) */}
              {generatedNotifications.length > 0 && (
                <div className="flex items-center justify-between border-b border-slate-100 bg-white px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFilterTab('all')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        filterTab === 'all'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span>الكل</span>
                      <span className="mr-1.5 font-mono">({generatedNotifications.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab('high')}
                      className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        filterTab === 'high'
                          ? 'bg-red-50 text-red-700 border border-red-200 shadow-2xs'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping" />
                      <span>الحمراء العاجلة</span>
                      <span className="font-mono">({highSeverityCount})</span>
                    </button>
                  </div>

                  {filterTab === 'high' && highSeverityCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const highIds = generatedNotifications.filter(n => n.severity === 'high').map(n => n.id);
                        setDismissedIds(prev => Array.from(new Set([...prev, ...highIds])));
                        toast(`تم حل ومسح الـ ${highIds.length} تنبيهات الحمراء بنجاح ✅`, 'success');
                      }}
                      className="text-[11px] font-bold text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                    >
                      حل الحمراء فقط
                    </button>
                  )}
                </div>
              )}

              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {displayedNotifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-3.5 hover:bg-slate-50/70 transition-colors flex gap-3 relative group ${
                      notif.severity === 'high' ? 'bg-red-50/30' : ''
                    }`}
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
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
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
                        setDismissedIds(prev => Array.from(new Set([...prev, notif.id])));
                        toast('تم إخفاء التنبيه بنجاح', 'info');
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                      title="تجاهل"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {displayedNotifications.length === 0 && (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                    <CheckSquare className="text-emerald-500" size={32} />
                    <p className="text-sm font-semibold text-slate-700">لا توجد تنبيهات نشطة حالياً</p>
                    <p className="text-xs text-slate-400">كافة عقود الموظفين ووثائقهم وإجازاتهم سليمة تماماً!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div onClick={handleProfileClick} className="flex items-center gap-3 pl-4 border-r border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors p-2 rounded-lg" title="عرض وتعديل بياناتي الشخصية">
          <div className="text-left hidden md:block">
            <p className="text-sm font-semibold text-slate-700 leading-none">{getRoleName(user.role)}</p>
            <p className="text-xs text-slate-500 mt-1" dir="ltr">{user.username}</p>
          </div>
          <UserCircle size={32} className="text-slate-400" />
        </div>
      </div>
    </header>

    <EthernetServerModal
      isOpen={showEthernetModal}
      onClose={() => setShowEthernetModal(false)}
    />
  </>
  );
}
