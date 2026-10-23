import React, { useState, useEffect } from 'react';
import { X, Minus, Square } from 'lucide-react';
import { useStore } from '../store';

export default function TitleBar() {
  const { systemSettings } = useStore();
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if we are running in Electron
    if (typeof window !== 'undefined' && (window as any).require) {
      try {
        (window as any).require('electron');
        setIsElectron(true);
      } catch (e) {
        setIsElectron(false);
      }
    }
  }, []);

  const handleMinimize = () => {
    if (isElectron && (window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('window-min');
    }
  };

  const handleMaximize = () => {
    if (isElectron && (window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('window-max');
    }
  };

  const handleClose = () => {
    if (isElectron && (window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('window-close');
    }
  };

  // If not in electron, don't render the title bar (or render a fallback)
  if (!isElectron) return null;

  return (
    <div 
      className="h-8 bg-white border-b border-slate-200 flex items-center justify-between text-slate-700 select-none z-[9999] fixed top-0 left-0 right-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      dir="rtl"
    >
      <div className="flex items-center gap-2 px-3 text-xs font-medium">
        <span>{systemSettings?.companyName || 'مركز البنيان للتقنية و الصناعات الهندسية'}</span>
        <span className="opacity-50">-</span>
        <span className="opacity-70">إدارة الموارد البشرية</span>
      </div>
      
      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties} dir="ltr">
        <button 
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-center focus:outline-none"
          title="تصغير"
        >
          <Minus size={14} />
        </button>
        <button 
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-center focus:outline-none"
          title="تكبير"
        >
          <Square size={12} />
        </button>
        <button 
          onClick={handleClose}
          className="h-full px-4 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center focus:outline-none"
          title="إغلاق"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
