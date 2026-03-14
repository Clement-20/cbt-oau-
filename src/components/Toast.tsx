import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Toast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleToast = (e: any) => {
      setMessage(e.detail);
      setTimeout(() => setMessage(null), 3000);
    };
    window.addEventListener('toast', handleToast);
    return () => window.removeEventListener('toast', handleToast);
  }, []);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 bg-zinc-800 text-white px-6 py-3 rounded-xl shadow-2xl z-50 font-medium border border-zinc-700"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const toast = (msg: string) => window.dispatchEvent(new CustomEvent('toast', { detail: msg }));
