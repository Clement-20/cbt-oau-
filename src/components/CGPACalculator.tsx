import React, { useState, useEffect } from "react";
import { Plus, Trash2, Calculator, Target, Save, RefreshCw, TrendingUp, AlertCircle, ChevronRight, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "./Toast";

interface CourseEntry {
  id: string;
  code: string;
  units: number;
  grade: string;
  points: number;
}

const GRADE_POINTS: Record<string, number> = {
  "A": 5,
  "B": 4,
  "C": 3,
  "D": 2,
  "E": 1,
  "F": 0
};

const CLASS_OF_DEGREE = [
  { name: "First Class", min: 4.5, color: "text-yellow-500" },
  { name: "Second Class Upper", min: 3.5, color: "text-blue-500" },
  { name: "Second Class Lower", min: 2.4, color: "text-emerald-500" },
  { name: "Third Class", min: 1.5, color: "text-orange-500" },
  { name: "Pass", min: 1.0, color: "text-zinc-500" }
];

import SyncButton from "../nexus-features/SyncButton";
import { Skeleton } from "../nexus-features/SkeletonLoader";

export default function CGPACalculator() {
  const [semesterId, setSemesterId] = useState<string>("2025-2026-S1");
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [prevCP, setPrevCP] = useState<number>(0);
  const [prevUnits, setPrevUnits] = useState<number>(0);
  const [targetCGPA, setTargetCGPA] = useState<number>(4.5);
  const [isTargetMode, setIsTargetMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("nexus_cgpa_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSemesterId(parsed.semesterId || "2025-2026-S1");
        setCourses(parsed.courses || []);
        setPrevCP(parsed.prevCP || 0);
        setPrevUnits(parsed.prevUnits || 0);
        setTargetCGPA(parsed.targetCGPA || 4.5);
      } catch (e) {
        console.error("Failed to parse CGPA data", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("nexus_cgpa_data", JSON.stringify({
      semesterId,
      courses,
      prevCP,
      prevUnits,
      targetCGPA
    }));
  }, [semesterId, courses, prevCP, prevUnits, targetCGPA]);

  const addCourse = (units: number = 2) => {
    const newCourse: CourseEntry = {
      id: Math.random().toString(36).substr(2, 9),
      code: "",
      units,
      grade: "A",
      points: units * 5 // Default A
    };
    setCourses([...courses, newCourse]);
  };

  const removeCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const updateCourse = (id: string, updates: Partial<CourseEntry>) => {
    setCourses(courses.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates };
        // Recalculate points if units or grade changed
        if (updates.units !== undefined || updates.grade !== undefined) {
          updated.points = updated.units * GRADE_POINTS[updated.grade];
        }
        return updated;
      }
      return c;
    }));
  };

  const currentSemesterUnits = courses.reduce((acc, c) => acc + c.units, 0);
  const currentSemesterCP = courses.reduce((acc, c) => acc + (c.units * GRADE_POINTS[c.grade]), 0);
  
  const totalUnits = prevUnits + currentSemesterUnits;
  const totalCP = prevCP + currentSemesterCP;
  
  const currentGPA = currentSemesterUnits > 0 ? (currentSemesterCP / currentSemesterUnits).toFixed(2) : "0.00";
  const currentCGPA = totalUnits > 0 ? (totalCP / totalUnits).toFixed(2) : "0.00";

  // What If Logic
  const nextSemesterUnits = currentSemesterUnits; // Assuming next semester has similar load if not specified
  const requiredGPA = currentSemesterUnits > 0 
    ? ((targetCGPA * (prevUnits + currentSemesterUnits) - prevCP) / currentSemesterUnits).toFixed(2)
    : "0.00";

  const syncToCloud = async () => {
    if (!auth.currentUser) {
      toast("Please sign in to sync your data");
      return;
    }
    setIsSyncing(true);
    try {
      const semesterData = {
        semesterId,
        courses: courses.map(({ code, units, grade, points }) => ({
          code,
          units,
          grade,
          points
        })),
        semesterGPA: parseFloat(currentGPA),
        cumulativeGPA: parseFloat(currentCGPA),
        // Keep internal state for app functionality
        prevCP,
        prevUnits,
        targetCGPA,
        lastSynced: serverTimestamp()
      };

      await setDoc(doc(db, "user_cgpa", auth.currentUser.uid), semesterData);
      toast("CGPA data synced to cloud! 🚀");
    } catch (error) {
      console.error("Sync failed", error);
      toast("Failed to sync data");
    } finally {
      setIsSyncing(false);
    }
  };

  const getAcademicPath = () => {
    const req = parseFloat(requiredGPA);
    if (req > 5.0) {
      const maxPossible = ((prevCP + (currentSemesterUnits * 5)) / (prevUnits + currentSemesterUnits)).toFixed(2);
      return {
        message: `Omoor, even if you get all A's, you can't hit this target yet. Let's aim for a ${maxPossible} instead. 🦁`,
        status: "impossible"
      };
    }
    if (req <= 0) return { message: "You're already on track! Keep it up. 🚀", status: "easy" };
    return { message: `You need a GPA of ${req} this semester to reach your target. You gat this! 💪`, status: "possible" };
  };

  const path = getAcademicPath();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <Calculator className="text-blue-600" /> CGPA Engine
          </h1>
          <p className="text-[10px] text-[var(--foreground)]/50 font-black uppercase tracking-widest">Digital Nexus Ecosystem</p>
        </div>
        <SyncButton 
          storageKey="nexus_cgpa_data" 
          collectionName="user_cgpa" 
          onSyncComplete={(data) => {
            if (data.courses) setCourses(data.courses);
            if (data.semesterId) setSemesterId(data.semesterId);
            if (data.prevCP) setPrevCP(data.prevCP);
            if (data.prevUnits) setPrevUnits(data.prevUnits);
            if (data.targetCGPA) setTargetCGPA(data.targetCGPA);
          }}
        />
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-3xl border-cyan-500/20 text-center"
        >
          <p className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-1">Current GPA</p>
          <h2 className="text-4xl font-black tracking-tighter">{currentGPA}</h2>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-3xl border-purple-500/20 text-center"
        >
          <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-1">Current CGPA</p>
          <h2 className="text-4xl font-black tracking-tighter">{currentCGPA}</h2>
        </motion.div>
      </div>

      {/* Semester ID and Previous Records */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="text-cyan-500" size={20} />
          <h3 className="font-bold">Semester Info & Records</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-[var(--foreground)]/50 font-bold uppercase">Semester ID</label>
            <input 
              type="text" 
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              placeholder="e.g. 2025-2026-S1"
              className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-xl p-3 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-[var(--foreground)]/50 font-bold uppercase">Total Units Passed</label>
              <input 
                type="number" 
                value={prevUnits || ""}
                onChange={(e) => setPrevUnits(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--foreground)]/50 font-bold uppercase">Total Points (TCP)</label>
              <input 
                type="number" 
                value={prevCP || ""}
                onChange={(e) => setPrevCP(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Target Mode Toggle */}
      <div className="glass-panel p-6 rounded-3xl border-amber-500/20">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Target className="text-amber-500" size={20} />
            <h3 className="font-bold">Target Mode</h3>
          </div>
          <button 
            onClick={() => setIsTargetMode(!isTargetMode)}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${isTargetMode ? 'bg-amber-500 text-white' : 'bg-black/5 dark:bg-white/5 text-[var(--foreground)]/50'}`}
          >
            {isTargetMode ? 'ON' : 'OFF'}
          </button>
        </div>

        <AnimatePresence>
          {isTargetMode && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-[var(--foreground)]/50">Target CGPA</span>
                  <span className="text-amber-500">{targetCGPA.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="1.0" 
                  max="5.0" 
                  step="0.01"
                  value={targetCGPA}
                  onChange={(e) => setTargetCGPA(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {CLASS_OF_DEGREE.map((cls) => (
                    <button 
                      key={cls.name}
                      onClick={() => setTargetCGPA(cls.min)}
                      className={`whitespace-nowrap px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${targetCGPA >= cls.min && targetCGPA < (CLASS_OF_DEGREE[CLASS_OF_DEGREE.indexOf(cls)-1]?.min || 5.1) ? 'bg-amber-500/10 border-amber-500 text-amber-600' : 'border-[var(--border)] text-[var(--foreground)]/40'}`}
                    >
                      {cls.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-2xl flex gap-3 items-start ${path.status === 'impossible' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
                {path.status === 'impossible' ? <AlertCircle className="shrink-0" size={20} /> : <TrendingUp className="shrink-0" size={20} />}
                <p className="text-sm font-medium leading-relaxed">{path.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Current Semester Courses */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Calculator className="text-cyan-500" size={20} />
            Current Semester
          </h3>
          <div className="flex gap-2">
            {[2, 3, 4, 5].map(u => (
              <button 
                key={u}
                onClick={() => addCourse(u)}
                className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold hover:bg-cyan-500 hover:text-white transition-all"
              >
                +{u}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {courses.map((course, idx) => (
              <motion.div 
                key={course.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-4 rounded-2xl flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-[var(--foreground)]/40">
                  {idx + 1}
                </div>
                <input 
                  type="text" 
                  placeholder="Code"
                  value={course.code}
                  onChange={(e) => updateCourse(course.id, { code: e.target.value.toUpperCase() })}
                  className="flex-1 bg-transparent border-none p-0 text-sm font-bold focus:ring-0 placeholder:text-[var(--foreground)]/20"
                />
                <select 
                  value={course.units}
                  onChange={(e) => updateCourse(course.id, { units: Number(e.target.value) })}
                  className="bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-lg text-xs font-bold p-1 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map(u => <option key={u} value={u}>{u} Units</option>)}
                </select>
                <select 
                  value={course.grade}
                  onChange={(e) => updateCourse(course.id, { grade: e.target.value })}
                  className="bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-lg text-xs font-bold p-1 focus:outline-none w-12 text-center"
                >
                  {Object.keys(GRADE_POINTS).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <div className="w-8 text-center text-[10px] font-bold text-cyan-500 bg-cyan-500/10 rounded-md py-1">
                  {course.points}p
                </div>
                <button 
                  onClick={() => removeCourse(course.id)}
                  className="p-2 text-red-500/40 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {courses.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-3xl">
              <p className="text-[var(--foreground)]/30 text-sm">No courses added yet. Use the quick add buttons above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 flex gap-3">
        <button 
          onClick={syncToCloud}
          disabled={isSyncing}
          className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"
        >
          {isSyncing ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
          Sync to Cloud
        </button>
        <button 
          onClick={() => addCourse(2)}
          className="w-16 h-16 bg-cyan-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/20 hover:scale-110 transition-all"
        >
          <Plus size={32} />
        </button>
      </div>
    </div>
  );
}
