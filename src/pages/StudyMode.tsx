import React, { useState } from "react";
import { Timer, Brain, Coffee, BookOpen, Flame, Activity, CheckCircle2, Target } from "lucide-react";
import { Helmet } from "react-helmet-async";
import PomodoroTimer from "../components/PomodoroTimer";
import { clsx } from "clsx";

export default function StudyMode({ user }: { user: any }) {
  const [activeSession, setActiveSession] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Brain size={64} className="text-blue-500 mb-4 drop-shadow-lg" />
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-[var(--foreground)]/60 mt-2 font-medium">Sign in to access the Study Mode.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <Helmet>
        <title>Study Mode | Digital Nexus</title>
        <meta name="description" content="Deep work and focus sessions with the ICEPAB Pomodoro Engine." />
      </Helmet>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
            <Brain className="text-blue-600 dark:text-blue-500" /> Study Mode
          </h1>
          <p className="text-[var(--foreground)]/60 mt-2 font-medium">Deep work and focus sessions with the ICEPAB Pomodoro Engine.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/10 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-xl font-bold text-sm border border-orange-500/20 flex items-center gap-2">
            <Flame size={18} className="animate-pulse" />
            Focus Mode
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Goals */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Target size={20} className="text-blue-500" /> Daily Goals
            </h2>
            <div className="space-y-3">
              {[
                { label: "Complete 4 Pomodoros", progress: 2, total: 4 },
                { label: "Solve 20 CBT Questions", progress: 12, total: 20 },
                { label: "Review 5 Flashcards", progress: 0, total: 5 },
              ].map((goal, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-[var(--foreground)]/60">{goal.label}</span>
                    <span>{goal.progress}/{goal.total}</span>
                  </div>
                  <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000"
                      style={{ width: `${(goal.progress / goal.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity size={20} className="text-emerald-500" /> Focus Stats
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase">Total Focus</p>
                <p className="text-xl font-bold">12h 45m</p>
              </div>
              <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase">Avg Session</p>
                <p className="text-xl font-bold">24.2m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Main Focus Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-10 rounded-[40px] text-center space-y-8 border-2 border-blue-500/10">
            <div className="mx-auto w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
              <Brain size={48} className={activeSession ? "animate-pulse" : ""} />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tighter">Ready for Deep Work?</h2>
              <p className="text-[var(--foreground)]/60 font-medium max-w-md mx-auto">
                The ICEPAB Pomodoro Engine helps you maintain peak focus using scientifically proven intervals.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl text-sm font-bold">
                <CheckCircle2 size={16} className="text-emerald-500" /> No Distractions
              </div>
              <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl text-sm font-bold">
                <CheckCircle2 size={16} className="text-emerald-500" /> Smart Breaks
              </div>
              <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl text-sm font-bold">
                <CheckCircle2 size={16} className="text-emerald-500" /> Offline Sync
              </div>
            </div>
            <button 
              onClick={() => setActiveSession(!activeSession)}
              className={clsx(
                "px-12 py-5 rounded-[24px] font-black text-lg transition-all shadow-xl hover:scale-105 active:scale-95",
                activeSession ? "bg-red-500 text-white" : "bg-blue-600 text-white"
              )}
            >
              {activeSession ? "End Focus Session" : "Start Deep Work"}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                <Coffee size={24} />
              </div>
              <div>
                <h4 className="font-bold">Short Break</h4>
                <p className="text-xs text-[var(--foreground)]/50">5 minutes to recharge</p>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
                <BookOpen size={24} />
              </div>
              <div>
                <h4 className="font-bold">Long Break</h4>
                <p className="text-xs text-[var(--foreground)]/50">15 minutes to reset</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Draggable Timer */}
      <PomodoroTimer />
    </div>
  );
}
