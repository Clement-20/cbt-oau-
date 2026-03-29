import React, { useState, useEffect, useRef } from "react";
import { Bot, X, Maximize2, Minimize2, Sparkles, Lock, CreditCard, GripVertical } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useAcademicStore } from "../lib/academicStore";
import { clsx } from "clsx";

interface AITutorProps {
  question: string;
  options: string[];
  correctAnswer: string;
  isVerified: boolean;
  isVisible: boolean;
}

export default function AITutor({ question, options, correctAnswer, isVerified, isVisible }: AITutorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { aiExplanationsUsed, incrementAIUsage } = useAcademicStore();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 100], [1, 0.6]);
  const blur = useTransform(scrollY, [0, 100], [0, 4]);

  const FREE_LIMIT = 5;

  const handleExplain = async () => {
    if (!isVerified && aiExplanationsUsed >= FREE_LIMIT) {
      setShowPaywall(true);
      return;
    }

    setIsOpen(true);
    if (explanation) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          options,
          correctAnswer,
          userId: "current-user-id" // In a real app, we'd pass a token
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setExplanation(data.error);
      } else {
        setExplanation(data.text || "Sorry, I couldn't generate an explanation at this time.");
        if (!isVerified) {
          incrementAIUsage();
        }
      }
    } catch (error) {
      console.error("AI Error:", error);
      setExplanation("Failed to connect to the ICEPAB AI Tutor. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset explanation when question changes
  useEffect(() => {
    setExplanation(null);
    if (isOpen) setIsOpen(false);
  }, [question]);

  if (!isVisible) return null;

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        style={{ opacity, filter: `blur(${blur}px)` }}
        className="fixed bottom-24 right-6 z-[100] flex flex-col items-end gap-4"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="w-[320px] md:w-[400px] glass-panel p-6 rounded-3xl border-2 border-blue-500/30 shadow-2xl mb-4 overflow-hidden relative"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-600 text-white rounded-xl">
                    <Bot size={18} />
                  </div>
                  <h4 className="font-black tracking-tighter text-blue-600 dark:text-blue-400">ICEPAB AI TUTOR</h4>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors">
                  <Minimize2 size={18} className="text-[var(--foreground)]/40" />
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                  <div className="space-y-3 py-4">
                    <div className="h-4 bg-blue-500/10 rounded-full w-full animate-pulse"></div>
                    <div className="h-4 bg-blue-500/10 rounded-full w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-blue-500/10 rounded-full w-4/6 animate-pulse"></div>
                    <p className="text-[10px] font-bold text-blue-500/50 uppercase text-center mt-4">Consulting ICEPAB Knowledge Base...</p>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-[var(--foreground)]/80 prose dark:prose-invert">
                    {explanation}
                  </div>
                )}
              </div>

              {!isVerified && (
                <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between items-center">
                  <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase">
                    Free Explanations: {FREE_LIMIT - aiExplanationsUsed} left
                  </p>
                  <button 
                    onClick={() => setShowPaywall(true)}
                    className="text-[10px] font-black text-blue-600 hover:underline uppercase"
                  >
                    Get Unlimited
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 group">
          <div className="bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Drag to move
          </div>
          <button
            onClick={handleExplain}
            className={clsx(
              "p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center gap-2 border-2",
              isOpen ? "bg-blue-600 border-blue-400 text-white" : "bg-white dark:bg-zinc-900 border-blue-500/50 text-blue-600"
            )}
          >
            <div className="cursor-grab active:cursor-grabbing p-1 -ml-1 opacity-40 hover:opacity-100 transition-opacity">
              <GripVertical size={14} />
            </div>
            <Sparkles size={20} className={isLoading ? "animate-spin" : ""} />
            <span className="font-black text-xs tracking-tighter mr-1">EXPLAIN</span>
          </button>
        </div>
      </motion.div>

      {/* Paywall Modal */}
      <AnimatePresence>
        {showPaywall && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaywall(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-panel p-8 rounded-[40px] border-2 border-blue-500/30 shadow-2xl text-center overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"></div>

              <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
                <Lock size={40} />
              </div>

              <h2 className="text-3xl font-black tracking-tighter mb-2">Unlock Full Access</h2>
              <p className="text-[var(--foreground)]/60 mb-8 font-medium">
                You've used your free explanations. Join the <span className="text-blue-600 font-bold">Verified Nexus</span> to get unlimited AI tutoring and more.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "Unlimited AI Explanations",
                  "Verified Badge on Profile",
                  "Priority Support",
                  "Exclusive Study Materials"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-left bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-[var(--border)]">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                      <Sparkles size={14} />
                    </div>
                    <span className="text-sm font-bold">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mb-4"
              >
                <CreditCard size={20} /> Unlock for ₦500
              </button>
              
              <button 
                onClick={() => setShowPaywall(false)}
                className="text-sm font-bold text-[var(--foreground)]/40 hover:text-[var(--foreground)] transition-colors"
              >
                Maybe Later
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
