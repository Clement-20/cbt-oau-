import { useEffect, useState } from "react";
import { getRandomMotivation } from "../lib/motivations";
import { Activity, Zap, ShieldCheck, Trophy, BookOpen, BellRing, Share2, Calculator, Download, FileText, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { db } from "../firebase";
import FlashcardEngine from "../components/FlashcardEngine";
import ResourceVault from "../components/ResourceVault";
import { Helmet } from "react-helmet-async";

import { Loader2 } from "lucide-react";

export default function Home({ user, login, isLoggingIn }: { user: any, login?: () => void, isLoggingIn?: boolean }) {
  const [portalStatus, setPortalStatus] = useState<{ status: string; message: string }>({ status: "CHECKING...", message: "Pinging OAU Portal..." });
  const [motivation, setMotivation] = useState(getRandomMotivation());
  const [broadcast, setBroadcast] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(true);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const enableNotifications = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      if (permission === 'granted') {
        navigator.serviceWorker.register('/sw.js');
        sendNotification("Notifications Enabled", "You will now receive the Daily Spark and live broadcasts.");
      }
    }
  };

  const sendNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({ type: 'SHOW_NOTIFICATION', title, body });
      });
    }
  };

  useEffect(() => {
    const checkPortal = async () => {
      try {
        const res = await fetch("/api/portal-check");
        const data = await res.json();
        setPortalStatus(data);
      } catch (e) {
        setPortalStatus({ status: "ERROR", message: "Failed to reach portal check service." });
      }
    };

    checkPortal();
    // Optimized for 35k users: Poll every 2 minutes instead of 5 seconds
    const interval = setInterval(checkPortal, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "broadcasts"), orderBy("timestamp", "desc"), limit(1));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const msg = snapshot.docs[0].data().message;
        setBroadcast(msg);
        
        // Only send notification for new broadcasts, not on initial load
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" && !snapshot.metadata.fromCache) {
             // We can't easily distinguish initial load from new addition with just limit(1) and docChanges
             // A better way is to check if the timestamp is very recent
             const data = change.doc.data();
             if (data.timestamp) {
               const now = new Date().getTime();
               const broadcastTime = data.timestamp.toDate().getTime();
               // If broadcast was created in the last 10 seconds
               if (now - broadcastTime < 10000) {
                 sendNotification("Admin Broadcast 🚨", msg);
               }
             }
          }
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "broadcasts");
    });
    return () => unsub();
  }, [user]);

  const refreshSpark = () => {
    const newSpark = getRandomMotivation();
    setMotivation(newSpark);
    sendNotification("Daily Spark ⚡", newSpark.content);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <Helmet>
        <title>Home | Digital Nexus - OAU Student Portal & CBT Hub</title>
        <meta name="description" content="Access OAU ePortal, practice OAU CBT questions for ALL courses (GST, Special Electives, etc.), and download OAU study PDFs. Digital Nexus by ICEPAB is the #1 hub for OAU academic excellence." />
        <meta name="keywords" content="OAU ePortal login, OAU student portal, OAU CBT past questions, All OAU Courses, OAU Post UTME questions, OAU CGPA Calculator, ICEPAB, Digital Nexus, Great Ife, OAU academic calendar" />
        <link rel="canonical" href={`${import.meta.env.VITE_BASE_URL || 'https://oau.cbt.icepab.name.ng'}/`} />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Digital Nexus",
              "url": "${import.meta.env.VITE_BASE_URL || 'https://oau.cbt.icepab.name.ng'}",
              "description": "The ultimate OAU student super-app by ICEPAB. Practice OAU CBT for all courses, access OAU ePortal, and download study PDFs.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "${import.meta.env.VITE_BASE_URL || 'https://oau.cbt.icepab.name.ng'}/cbt?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }
          `}
        </script>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How do I access the OAU ePortal?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can access the OAU ePortal directly through Digital Nexus by clicking the 'OAU Portal' quick link or visiting eportal.oauife.edu.ng. Our Portal Pulse feature provides real-time status updates."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Where can I find OAU CBT past questions?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Digital Nexus offers a comprehensive CBT Engine with verified past questions for ALL OAU courses including GSTs, Special Electives, and Departmental courses, optimized for the ICEPAB academic standard."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I download OAU course PDFs on Digital Nexus?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our resource library includes OAU study PDFs for various courses which can be accessed to prepare for exams and Post UTME."
                  }
                }
              ]
            }
          `}
        </script>
      </Helmet>
      {user?.isAnonymous && showGuestWarning && (
        <div className="bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-300 p-4 rounded-xl flex items-start gap-3 shadow-sm relative pr-10">
          <ShieldCheck className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm sm:text-base">Guest Mode Active</p>
            <p className="text-sm mt-1 opacity-90">
              Progress is not saved to the Leaderboard.{" "}
              <button 
                onClick={login} 
                disabled={isLoggingIn}
                className="underline hover:no-underline font-bold inline-flex items-center gap-1 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="animate-spin" size={12} />
                    Connecting...
                  </>
                ) : (
                  "Connect Google Account"
                )}
              </button>
            </p>
          </div>
          <button 
            onClick={() => setShowGuestWarning(false)}
            aria-label="Dismiss warning"
            className="absolute top-4 right-4 text-orange-500 hover:text-orange-700 dark:hover:text-orange-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Broadcast Banner */}
      {broadcast && (
        <div className="bg-blue-600/10 border border-blue-500/30 text-blue-700 dark:text-blue-200 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <Zap className="text-blue-500 shrink-0" />
          <p className="font-medium text-sm sm:text-base">{broadcast}</p>
        </div>
      )}

      {/* Huge Clear Goal Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          to="/cbt" 
          id="practice-mock-btn"
          className="relative group overflow-hidden bg-blue-600 p-8 rounded-[2rem] text-white transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-500/20"
        >
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Trophy size={160} />
          </div>
          <div className="relative z-10 space-y-2">
            <BookOpen size={48} className="mb-4" />
            <h2 className="text-3xl font-black tracking-tighter">Practice Mock</h2>
            <p className="text-blue-100 font-medium opacity-80">Test your knowledge with real OAU CBT questions.</p>
          </div>
        </Link>

        <Link 
          to="/resources" 
          id="download-pdf-btn"
          className="relative group overflow-hidden bg-emerald-600 p-8 rounded-[2rem] text-white transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-emerald-500/20"
        >
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Download size={160} />
          </div>
          <div className="relative z-10 space-y-2">
            <FileText size={48} className="mb-4" />
            <h2 className="text-3xl font-black tracking-tighter">Download PDF</h2>
            <p className="text-emerald-100 font-medium opacity-80">Access the largest vault of OAU study materials.</p>
          </div>
        </Link>

        <Link 
          to="/resources?upload=true"
          id="upload-pdf-btn"
          className="relative group overflow-hidden bg-zinc-900 dark:bg-zinc-800 p-8 rounded-[2rem] text-white transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/20"
        >
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Upload size={160} />
          </div>
          <div className="relative z-10 text-left space-y-2">
            <Activity size={48} className="mb-4" />
            <h2 className="text-3xl font-black tracking-tighter">Upload PDF</h2>
            <p className="text-zinc-400 font-medium opacity-80">Help your fellow students. Share your materials.</p>
          </div>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel p-5 md:p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden" id="nexus-hero">
          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 text-[var(--foreground)]">
            <BookOpen size={120} />
          </div>
          <div className="relative z-10">
            <h1 className="text-2xl md:text-5xl font-bold tracking-tighter mb-1">
              Digital Nexus
            </h1>
            <p className="text-xs md:text-base text-[var(--foreground)]/60 mb-6 font-medium">The OAU Campus OS. Practice, Validate, Dominate.</p>
            
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("open-share-modal"))}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:scale-105 mb-6 text-sm"
            >
              <Share2 size={18} /> Share Nexus
            </button>
          </div>
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]/50 uppercase tracking-wider">
              <Activity size={16} /> Official OAU Student ePortal Status
            </div>
            <div className={`p-5 rounded-2xl border backdrop-blur-md shadow-sm cursor-pointer hover:scale-[1.02] transition-transform ${
              portalStatus.status === "ONLINE" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" :
              portalStatus.status === "OFFLINE" ? "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400" :
              "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
            }`}
            onClick={() => window.open("https://eportal.oauife.edu.ng/", "_blank")}
            >
              <div className="font-bold text-xl mb-1 flex items-center justify-between">
                {portalStatus.status}
                <Activity size={16} className={portalStatus.status === "ONLINE" ? "animate-pulse" : ""} />
              </div>
              <div className="text-sm opacity-80 font-medium">{portalStatus.message}</div>
              <div className="mt-2 text-[10px] uppercase tracking-widest opacity-50">Click to visit OAU E-Portal</div>
            </div>
          </div>
        </div>

        {/* Daily Spark */}
        <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 dark:from-blue-900/40 dark:to-purple-900/40 border border-[var(--border)] p-5 md:p-8 rounded-3xl flex flex-col justify-center relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <Zap size={16} /> The Daily Spark
            </div>
            {!notificationsEnabled && (
              <button onClick={enableNotifications} className="text-xs flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors shadow-sm">
                <BellRing size={12} /> Enable Push
              </button>
            )}
          </div>
          <blockquote className="text-lg md:text-3xl font-serif italic leading-tight mb-4 relative z-10 text-[var(--foreground)]">
            "{motivation.content}"
          </blockquote>
          <div className="text-[10px] md:text-sm text-[var(--foreground)]/60 font-medium relative z-10">— {motivation.author}</div>
          <button 
            onClick={refreshSpark}
            className="mt-6 text-[10px] bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors w-fit px-3 py-1.5 rounded-lg font-medium relative z-10"
          >
            Refresh Spark
          </button>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Link to="/cbt" className="glass-panel hover:bg-black/5 dark:hover:bg-white/10 p-6 rounded-3xl transition-all group">
          <BookOpen className="text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform" size={32} />
          <h3 className="text-lg font-bold mb-2">CBT Engine</h3>
          <p className="text-sm text-[var(--foreground)]/60 font-medium">Practice exams for ALL courses, GSTs, and more.</p>
        </Link>
        <Link to="/gpa" className="glass-panel hover:bg-black/5 dark:hover:bg-white/10 p-6 rounded-3xl transition-all group">
          <Calculator className="text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform" size={32} />
          <h3 className="text-lg font-bold mb-2">CGPA Calc</h3>
          <p className="text-sm text-[var(--foreground)]/60 font-medium">Advanced OAU CGPA Calculator & Predictor.</p>
        </Link>
        <Link to="/validate" className="glass-panel hover:bg-black/5 dark:hover:bg-white/10 p-6 rounded-3xl transition-all group">
          <ShieldCheck className="text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform" size={32} />
          <h3 className="text-lg font-bold mb-2">Validator</h3>
          <p className="text-sm text-[var(--foreground)]/60 font-medium">Crowdsource and verify new course questions.</p>
        </Link>
        <Link to="/leaderboard" className="glass-panel hover:bg-black/5 dark:hover:bg-white/10 p-6 rounded-3xl transition-all group">
          <Trophy className="text-amber-600 dark:text-amber-400 mb-4 group-hover:scale-110 transition-transform" size={32} />
          <h3 className="text-lg font-bold mb-2">Leaderboard</h3>
          <p className="text-sm text-[var(--foreground)]/60 font-medium">Rankings by Study Time. Dominate your peers.</p>
        </Link>
        <a href="https://eportal.oauife.edu.ng/" target="_blank" rel="noopener noreferrer" className="glass-panel hover:bg-black/5 dark:hover:bg-white/10 p-6 rounded-3xl transition-all group">
          <Activity className="text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform" size={32} />
          <h3 className="text-lg font-bold mb-2">OAU Portal</h3>
          <p className="text-sm text-[var(--foreground)]/60 font-medium">Direct access to the official OAU E-Portal.</p>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-3 glass-panel p-6 rounded-3xl">
          <FlashcardEngine />
        </div>
      </div>

      {/* SEO FAQ Section */}
      <div className="mt-12 space-y-8">
        <h2 className="text-xl md:text-3xl font-black tracking-tighter text-center">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Accordion 
            question="What is Digital Nexus by ICEPAB?" 
            answer="Digital Nexus is the premier academic companion for OAU students. It provides a state-of-the-art CBT Engine, direct OAU ePortal access, CGPA calculation, and verified OAU study resources, curated by Clement IfeOluwa and the ICEPAB team."
          />
          <Accordion 
            question="How does the OAU CBT Engine work?" 
            answer="Our CBT Engine simulates the official OAU examination environment. Students can practice past questions for ALL courses with real-time analytics and performance tracking to ensure exam success."
          />
          <Accordion 
            question="Official OAU ePortal Affiliation" 
            answer="Digital Nexus provides the fastest gateway to the OAU Student Portal (ePortal). We monitor the portal status 24/7 to help Great Ife students stay updated on registration, fees, and results without the frustration of downtime."
            className="md:col-span-2"
          />
        </div>
      </div>
    </motion.div>
  );
}

function Accordion({ question, answer, className = "" }: { question: string; answer: string, className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`glass-panel p-6 rounded-3xl border border-[var(--border)] ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center font-bold text-lg mb-2"
      >
        {question}
        <span className="text-blue-500">{isOpen ? "-" : "+"}</span>
      </button>
      {isOpen && (
        <p className="text-sm text-[var(--foreground)]/60 leading-relaxed font-menu animate-in slide-in-from-top-2 duration-200">
          {answer}
        </p>
      )}
    </div>
  );
}
