import React, { useState, useEffect } from "react";
import { Ghost, WifiOff, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      setIsVisible(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md"
      >
        <div className="bg-amber-500/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-amber-400/50 flex items-center gap-4">
          <div className="bg-white/20 p-2 rounded-xl">
            <Ghost className="animate-pulse" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">Ghost Mode Active 👻</h3>
            <p className="text-xs opacity-90">Your CBT and saved PDFs are still available offline.</p>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
