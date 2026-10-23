import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ترحيل البيانات التلقائي من الإصدارات السابقة لضمان عدم ضياع أي سجل للموظفين
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const currentData = localStorage.getItem('hr-system-storage-v4');
    if (!currentData) {
      const olderKeys = ['hr-system-storage-v3', 'hr-system-storage-v2', 'hr-system-storage', 'hr-storage'];
      for (const k of olderKeys) {
        const oldVal = localStorage.getItem(k);
        if (oldVal) {
          localStorage.setItem('hr-system-storage-v4', oldVal);
          break;
        }
      }
    }
  } catch (e) {
    console.error('Migration error:', e);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
