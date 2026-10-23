/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Layout from './components/Layout';
import Login from './components/Login';
import UpdateNotification from './components/UpdateNotification';
import { ToastContainer } from './components/Toast';
import { useStore } from './store';
import { initCentralAutoSync } from './lib/serverSync';
import { executeLiveAutoBackup } from './lib/autoBackup';

const isElectronEnv = () => {
  return typeof window !== 'undefined' && (window as any).require;
};

export default function App() {
  const [user, setUser] = useState<{role: string, username: string, permissions: string[]} | null>(null);
  const { addSystemLog, systemSettings, updateSystemSettings } = useStore();
  const isElectron = isElectronEnv();

  // Initialize Ethernet Central LAN Auto-Sync
  useEffect(() => {
    initCentralAutoSync(useStore);
  }, []);

  useEffect(() => {
    // Initial and event-based auto backup
    executeLiveAutoBackup(useStore);

    const handleAutoBackup = () => {
      executeLiveAutoBackup(useStore);
    };

    window.addEventListener('beforeunload', handleAutoBackup);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        executeLiveAutoBackup(useStore);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleAutoBackup);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


  // تحديث الاسم الافتراضي القديم
  if (systemSettings?.companyName === 'شركتي') {
    updateSystemSettings({ ...systemSettings, companyName: 'مركز البنيان للتقنية و الصناعات الهندسية' });
  }

  const { employees } = useStore();

  // تحديث صلاحيات المستخدم المسجل حالياً فور تعديلها من قبل المدير
  useEffect(() => {
    if (!user || user.role === 'developer') return;
    const currentEmp = employees.find(e => 
      e.linkedUser?.toLowerCase() === user.username.toLowerCase() || 
      e.employeeId.toLowerCase() === user.username.toLowerCase() || 
      e.workEmail.toLowerCase() === user.username.toLowerCase()
    );
    if (currentEmp) {
      const newPerms = currentEmp.customPermissions || [];
      const newRole = currentEmp.defaultRole || user.role;
      const permsChanged = JSON.stringify(newPerms) !== JSON.stringify(user.permissions) || newRole !== user.role;
      if (permsChanged) {
        setUser(prev => prev ? { ...prev, role: newRole, permissions: newPerms } : null);
      }
    }
  }, [employees, user?.username]);

  const handleLogin = (role: string, username: string, permissions: string[] = []) => {
    setUser({role, username, permissions});
    addSystemLog({ userId: username, userName: username, action: 'تسجيل الدخول', details: 'قام المستخدم بتسجيل الدخول للنظام' });
  };

  const handleLogout = () => {
    // Auto-backup on logout
    executeLiveAutoBackup(useStore);
    if (user) {
      addSystemLog({ userId: user.username, userName: user.username, action: 'تسجيل الخروج', details: 'قام المستخدم بتسجيل الخروج من النظام' });
    }
    setUser(null);
  };

  const contentClass = "electron-content-wrapper h-screen overflow-y-auto overflow-x-hidden flex flex-col bg-[#f4f7f9] " + (isElectron ? "pt-8" : "");

  if (!user) {
    return (
      <>
        <TitleBar />
        <div className={contentClass}>
          <Login onLogin={handleLogin} />
          <ToastContainer />
        </div>
      </>
    );
  }

  return (
    <>
      <UpdateNotification />
      <TitleBar />
      <div className={contentClass}>
        <Layout user={user} onLogout={handleLogout} />
        <ToastContainer />
      </div>
    </>
  );
}
