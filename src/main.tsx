import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// تصفية وكتم الرسائل والإخطارات المكررة الصادرة من أجهزة وماسحات الباركود والكاميرا ومحولات الإدخال
if (typeof window !== 'undefined') {
  const isNoisyAdapterLog = (args: any[]) => {
    try {
      const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a || ''))).join(' ').toLowerCase();
      return (
        text.includes('[rbc]') ||
        text.includes('rbc') ||
        text.includes('sees no video') ||
        text.includes('falling back to keyboard') ||
        text.includes('primary adapter generic')
      );
    } catch {
      return false;
    }
  };

  const origDebug = console.debug;
  console.debug = (...args: any[]) => {
    if (isNoisyAdapterLog(args)) return;
    origDebug.apply(console, args);
  };

  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (isNoisyAdapterLog(args)) return;
    origWarn.apply(console, args);
  };

  const origLog = console.log;
  console.log = (...args: any[]) => {
    if (isNoisyAdapterLog(args)) return;
    origLog.apply(console, args);
  };
}

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

import ErrorBoundary from './components/ErrorBoundary.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
