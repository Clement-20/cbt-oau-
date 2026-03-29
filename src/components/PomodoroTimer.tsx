import React, { useState, useEffect, useRef } from "react";
import { Timer, Play, Pause, RotateCcw, Coffee, Brain, Bell, X, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx } from "clsx";

type TimerMode = "work" | "break";

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>("work");
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalTime = mode === "work" ? workDuration * 60 : breakDuration * 60;
  const progress = timeLeft / totalTime;
  const isLowTime = progress < 0.2; // Red if less than 20% left

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem("nexus_pomodoro");
    if (saved) {
      const { 
        mode: savedMode, 
        timeLeft: savedTime, 
        lastUpdate, 
        workDuration: savedWork, 
        breakDuration: savedBreak 
      } = JSON.parse(saved);
      
      if (savedWork) setWorkDuration(savedWork);
      if (savedBreak) setBreakDuration(savedBreak);
      
      const now = Date.now();
      const elapsed = Math.floor((now - lastUpdate) / 1000);
      
      setMode(savedMode);
      if (isActive) {
        setTimeLeft(Math.max(0, savedTime - elapsed));
      } else {
        setTimeLeft(savedTime);
      }
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode]);

  useEffect(() => {
    localStorage.setItem("nexus_pomodoro", JSON.stringify({
      mode,
      timeLeft,
      lastUpdate: Date.now(),
      isActive,
      workDuration,
      breakDuration
    }));
  }, [timeLeft, mode, isActive, workDuration, breakDuration]);

  const handleTimerComplete = () => {
    setIsActive(false);
    sendNotification();
    
    if (mode === "work") {
      setMode("break");
      setTimeLeft(breakDuration * 60);
    } else {
      setMode("work");
      setTimeLeft(workDuration * 60);
    }
  };

  const sendNotification = () => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      new Notification(mode === "work" ? "Break Time! ☕" : "Back to Work! 🧠", {
        body: mode === "work" ? `You've completed ${workDuration} minutes of deep work.` : "Time to focus again.",
        icon: "/pwa-192x192.png"
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "work" ? workDuration * 60 : breakDuration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const updateDuration = (type: "work" | "break", val: number) => {
    const cleanVal = Math.max(1, Math.min(120, val));
    if (type === "work") {
      setWorkDuration(cleanVal);
      if (mode === "work" && !isActive) setTimeLeft(cleanVal * 60);
    } else {
      setBreakDuration(cleanVal);
      if (mode === "break" && !isActive) setTimeLeft(cleanVal * 60);
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      drag
      dragConstraints={{ 
        left: -window.innerWidth + 200, 
        right: 0, 
        top: -window.innerHeight + 200, 
        bottom: 0 
      }}
      dragElastic={0.1}
      dragMomentum={false}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx(
        "fixed bottom-24 right-6 z-50 glass-panel shadow-2xl border border-[var(--border)] overflow-hidden transition-all duration-300",
        isMinimized ? "w-16 h-16 rounded-full" : "w-72 rounded-[32px] p-6"
      )}
    >
      {isMinimized ? (
        <button 
          onClick={() => setIsMinimized(false)}
          className="w-full h-full flex items-center justify-center text-blue-500 relative"
        >
          <Timer size={24} className={isActive ? "animate-spin-slow" : ""} />
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-20"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={isLowTime ? "#ef4444" : "currentColor"}
              strokeWidth="4"
              strokeDasharray="175.9"
              animate={{ strokeDashoffset: 175.9 * (1 - progress) }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </svg>
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--foreground)]/40 cursor-grab active:cursor-grabbing">
              <GripVertical size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Pomodoro</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={clsx(
                  "p-1.5 rounded-lg transition-colors",
                  showSettings ? "bg-blue-500 text-white" : "hover:bg-black/5 dark:hover:bg-white/5 text-[var(--foreground)]/40"
                )}
              >
                <RotateCcw size={14} className={showSettings ? "rotate-45" : ""} />
              </button>
              <button 
                onClick={() => setIsMinimized(true)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-[var(--foreground)]/40"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {showSettings ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 py-2"
              >
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[var(--foreground)]/40 flex justify-between">
                      Work Duration <span>{workDuration}m</span>
                    </label>
                    <input 
                      type="range" 
                      min="1" 
                      max="60" 
                      value={workDuration}
                      onChange={(e) => updateDuration("work", parseInt(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[var(--foreground)]/40 flex justify-between">
                      Break Duration <span>{breakDuration}m</span>
                    </label>
                    <input 
                      type="range" 
                      min="1" 
                      max="30" 
                      value={breakDuration}
                      onChange={(e) => updateDuration("break", parseInt(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  Save & Close
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="timer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="text-center space-y-4"
              >
                <div className="relative inline-flex items-center justify-center">
                  {/* Circular Progress */}
                  <svg className="w-48 h-48 -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="opacity-5"
                    />
                    <motion.circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke={isLowTime ? "#ef4444" : (mode === "work" ? "#2563eb" : "#10b981")}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="552.9"
                      animate={{ strokeDashoffset: 552.9 * (1 - progress) }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                    <div className={clsx(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                      mode === "work" ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {mode === "work" ? <Brain size={10} /> : <Coffee size={10} />}
                      {mode === "work" ? "Focus" : "Break"}
                    </div>
                    <h2 className={clsx(
                      "text-4xl font-black tracking-tighter tabular-nums transition-colors",
                      isLowTime ? "text-red-500" : "text-[var(--foreground)]"
                    )}>
                      {formatTime(timeLeft)}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleTimer}
                    className={clsx(
                      "flex-1 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                      isActive ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
                    )}
                  >
                    {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                  </button>
                  <button 
                    onClick={resetTimer}
                    className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showSettings && (
            <button 
              onClick={() => {
                if (Notification.permission === "default") {
                  Notification.requestPermission();
                }
              }}
              className="w-full py-1 text-[9px] font-bold text-[var(--foreground)]/30 hover:text-[var(--foreground)]/60 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Bell size={10} /> Notifications: {Notification.permission}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
