import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { toast } from './Toast';

export default function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      
      // Check if user previously dismissed that banner today
      const dismissedStr = localStorage.getItem('pwa_banner_dismissed_at');
      let shouldShow = true;
      if (dismissedStr) {
        const dismissedAt = new Date(parseInt(dismissedStr, 10));
        const now = new Date();
        // Don't show again for 24 hours if dismissed
        if (now.getTime() - dismissedAt.getTime() < 24 * 60 * 60 * 1000) {
          shouldShow = false;
        }
      }
      
      if (shouldShow) {
         setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Optionally handle when the app is installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      toast("Digital Nexus installed successfully! 🚀");
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Optionally, send analytics event with outcome of user choice
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa_banner_dismissed_at', Date.now().toString());
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-[var(--background)] border border-[var(--border)] shadow-xl shadow-blue-500/10 p-4 rounded-2xl flex gap-4 items-center">
        <div className="bg-blue-500/20 p-3 rounded-full text-blue-600 dark:text-blue-400 shrink-0">
          <Download size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm">Install Digital Nexus</h3>
          <p className="text-xs text-[var(--foreground)]/60 leading-tight">
            Add to home screen for faster access, offline CBT, and an app-like experience!
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button 
            onClick={handleInstallClick}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
          >
            Install
          </button>
          <button 
            onClick={handleDismiss}
            className="text-xs font-medium text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
