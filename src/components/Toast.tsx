import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  text: string;
  type?: ToastType;
}

// Queue for toasts called before ToastContainer is mounted
const pendingQueue: ToastMessage[] = [];
let activeHandler: ((msg: ToastMessage) => void) | null = null;

export function ToastContainer() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    activeHandler = (msg: ToastMessage) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== msg.id));
      }, 4000);
    };

    // Flush any pending toasts
    if (pendingQueue.length > 0) {
      pendingQueue.forEach(msg => activeHandler?.(msg));
      pendingQueue.length = 0;
    }

    return () => {
      activeHandler = null;
    };
  }, []);

  const handleDismiss = (id: number) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const getStyle = (type?: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-600 text-white shadow-emerald-900/25 border-emerald-500',
          icon: <CheckCircle2 size={16} className="shrink-0 text-white" />
        };
      case 'error':
        return {
          bg: 'bg-rose-600 text-white shadow-rose-900/25 border-rose-500',
          icon: <AlertCircle size={16} className="shrink-0 text-white" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-600 text-white shadow-amber-900/25 border-amber-500',
          icon: <AlertTriangle size={16} className="shrink-0 text-white" />
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900 text-white shadow-slate-900/30 border-slate-700',
          icon: <Info size={16} className="shrink-0 text-blue-300" />
        };
    }
  };

  return (
    <div 
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-2 max-w-md w-full px-4 pointer-events-auto" 
      dir="rtl"
    >
      {messages.map(m => {
        const { bg, icon } = getStyle(m.type);
        return (
          <div 
            key={m.id} 
            className={`px-4 py-2.5 rounded-xl shadow-xl font-bold text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 border cursor-pointer hover:opacity-95 transition-all ${bg}`}
            onClick={() => handleDismiss(m.id)}
          >
            <div className="flex items-center gap-2 flex-1">
              {icon}
              <span className="leading-snug">{m.text}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(m.id);
              }}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0"
              title="إغلاق التنبيه"
            >
              <X size={13} className="text-white/80 hover:text-white" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export const toast = (text: string, type?: ToastType) => {
  const msg: ToastMessage = {
    id: Date.now() + Math.random(),
    text,
    type
  };

  if (activeHandler) {
    activeHandler(msg);
  } else {
    pendingQueue.push(msg);
  }
};
