/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import { ToastContainer } from './components/Toast';

export default function App() {
  const [user, setUser] = useState<{role: string, username: string} | null>(null);

  if (!user) {
    return (
      <>
        <Login onLogin={(role, username) => setUser({role, username})} />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <Layout user={user} onLogout={() => setUser(null)} />
      <ToastContainer />
    </>
  );
}
