import React, { useState } from "react";
import { X, ChevronRight, ChevronLeft, BookOpen, ShieldCheck, Activity, Users, Zap, Search } from "lucide-react";

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export default function Tutorial({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      title: "Welcome to Digital Nexus",
      description: "Your all-in-one platform for academic excellence. Let's take a quick tour of the key features.",
      icon: <BookOpen size={48} />,
      color: "text-blue-500"
    },
    {
      title: "CBT Engine",
      description: "Practice with real exam questions. Navigate between questions, mark them for review, and get detailed feedback with grades from Excellent to Poor.",
      icon: <Zap size={48} />,
      color: "text-amber-500"
    },
    {
      title: "AI Validator",
      description: "Upload your PDFs or images of past questions. Our AI extracts and validates them, ensuring you have the best study materials.",
      icon: <ShieldCheck size={48} />,
      color: "text-emerald-500"
    },
    {
      title: "Resource Hub",
      description: "Access and share study materials. Search by course code and download resources uploaded by fellow students.",
      icon: <Search size={48} />,
      color: "text-purple-500"
    },
    {
      title: "Community Hub",
      description: "Share your reviews and chat with other students. Your feedback helps us improve the platform for everyone.",
      icon: <Users size={48} />,
      color: "text-pink-500"
    },
    {
      title: "Study Deck & Calculator",
      description: "Use the built-in AI Study Deck for explanations and the scientific calculator for complex calculations during your practice.",
      icon: <Activity size={48} />,
      color: "text-cyan-500"
    }
  ];

  const next = () => setCurrentStep((s) => Math.min(steps.length - 1, s + 1));
  const prev = () => setCurrentStep((s) => Math.max(0, s - 1));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-panel max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-white/5">
          <h2 className="font-bold text-xl tracking-tight">App Tutorial</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-10 text-center space-y-6 min-h-[400px] flex flex-col justify-center">
          <div className={`mx-auto w-24 h-24 rounded-3xl bg-black/5 dark:bg-white/5 flex items-center justify-center ${steps[currentStep].color} animate-bounce`}>
            {steps[currentStep].icon}
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-bold tracking-tight">{steps[currentStep].title}</h3>
            <p className="text-[var(--foreground)]/60 leading-relaxed text-lg">
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        <div className="p-6 bg-black/5 dark:bg-white/5 flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === i ? "w-8 bg-blue-500" : "w-2 bg-[var(--foreground)]/10"}`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button onClick={prev} className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all">
                <ChevronLeft size={24} />
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button onClick={next} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2">
                Next <ChevronRight size={20} />
              </button>
            ) : (
              <button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg">
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
