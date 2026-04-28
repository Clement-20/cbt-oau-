import React, { useState, useEffect } from "react";
import { X, LogIn, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function SignInPromptBanner({ user, login }: { user: any; login: () => void }) {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // If user is already signed in or it was dismissed in this session, do nothing
    const isDismissed = sessionStorage.getItem("signin_prompt_dismissed");
    
    if (user || isDismissed) {
      setShowPrompt(false);
      return;
    }

    const timer = setTimeout(() => {
      // Check again if user is signed in case auth state changed, although this component will re-render
      if (!user && !sessionStorage.getItem("signin_prompt_dismissed")) {
        setShowPrompt(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("signin_prompt_dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[var(--background)] border border-[var(--border)] shadow-2xl p-6 rounded-3xl max-w-md w-full relative animate-in slide-in-from-bottom-10 zoom-in duration-300">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-4 mb-6">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <LogIn size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Unlock Full Access</h2>
          <p className="text-[var(--foreground)]/70 text-sm leading-relaxed">
            Sign in to unlock Premium CBT features, PDF downloads, and personal stats tracking. Or try the free Post-UTME test right now!
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              handleDismiss();
              login();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Sign In with Google
          </button>
          
          <Link
            to="/post-utme"
            onClick={handleDismiss}
            className="w-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--foreground)] font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <FileText size={18} />
            Take Free Post-UTME Test
          </Link>

          <button
            onClick={handleDismiss}
            className="mt-2 text-sm font-bold text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
