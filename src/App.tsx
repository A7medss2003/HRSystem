/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import { ToastContainer } from './components/Toast';
import { useStore } from './store';

export default function App() {
  const [user, setUser] = useState<{role: string, username: string} | null>(null);
  const { addSystemLog, systemSettings, updateSystemSettings } = useStore();

  // تحديث الاسم الافتراضي القديم
  if (systemSettings?.companyName === 'شركتي') {
    updateSystemSettings({ ...systemSettings, companyName: 'مركز البنيان للتقنية و الصناعات الهندسية' });
  }

  const handleLogin = (role: string, username: string) => {
    setUser({role, username});
    addSystemLog({ userId: username, userName: username, action: 'تسجيل الدخول', details: 'قام المستخدم بتسجيل الدخول للنظام' });
  };

  const handleLogout = () => {
    if (user) {
      addSystemLog({ userId: user.username, userName: user.username, action: 'تسجيل الخروج', details: 'قام المستخدم بتسجيل الخروج من النظام' });
    }
    setUser(null);
  };

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <Layout user={user} onLogout={handleLogout} />
      <ToastContainer />
    </>
  );
}
