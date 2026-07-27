import { useState, useEffect } from 'react';

let toastFn: (msg: string) => void = () => {};

export function ToastContainer() {
  const [messages, setMessages] = useState<{id: number, text: string}[]>([]);

  useEffect(() => {
    toastFn = (text: string) => {
      const id = Date.now();
      setMessages(prev => [...prev, { id, text }]);
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== id));
      }, 3000);
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {messages.map(m => (
        <div key={m.id} className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg font-bold text-center animate-in fade-in slide-in-from-bottom-2">
          {m.text}
        </div>
      ))}
    </div>
  );
}

export const toast = (text: string) => toastFn(text);
