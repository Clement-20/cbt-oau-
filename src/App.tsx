import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider, useTheme } from "./components/theme-provider";
import { getSettings, subscribeToSettings } from "./lib/settings";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { useEffect, useState, Suspense, lazy } from "react";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, browserPopupRedirectResolver, signInAnonymously, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./utils/errorHandling";
import { LogIn, LogOut, ShieldAlert, Sun, Moon, Calculator, Share2, Menu, X, User, BadgeCheck, Flame, Loader2, Zap, HelpCircle, Users } from "lucide-react";
import { clsx } from "clsx";
import NexusBadge from "./components/NexusBadge";
import Toast from "./components/Toast";
import { updateNexusStreak } from "./utils/nexusUtils";
import StudyDeck from "./components/StudyDeck";

// Lazy load pages for code splitting (low bandwidth optimization)
const Home = lazy(() => import("./pages/Home"));
const Admin = lazy(() => import("./pages/Admin"));
const CBT = lazy(() => import("./pages/CBT"));
const Validator = lazy(() => import("./pages/Validator"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const GPA = lazy(() => import("./pages/GPA"));
const Aro = lazy(() => import("./pages/Aro"));
const Profile = lazy(() => import("./pages/Profile"));
const Setup = lazy(() => import("./pages/Setup"));
const About = lazy(() => import("./pages/About"));
const Community = lazy(() => import("./pages/Community"));
const Verification = lazy(() => import("./pages/Verification"));
const Resources = lazy(() => import("./pages/Resources"));
const StudyMode = lazy(() => import("./pages/StudyMode"));

import { ErrorBoundary } from "./components/ErrorBoundary";
import LoadingLogo from "./components/LoadingLogo";
import Tutorial from "./components/Tutorial";
import FloatingAI from "./components/FloatingAI";
import ShareModal from "./components/ShareModal";
import OfflineBanner from "./components/OfflineBanner";

import BottomNav from "./nexus-features/BottomNav";

const LoadingFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center">
    <LoadingLogo />
  </div>
);

function MainApp() {
  const [user, setUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<{ title?: string; text?: string; url?: string }>({});
  const [showStudyDeck, setShowStudyDeck] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [studyDeckContext, setStudyDeckContext] = useState<string | undefined>();
  const [studyDeckPrompt, setStudyDeckPrompt] = useState<string | undefined>();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isAIChatPage = location.pathname === "/validate" || location.pathname === "/cbt";

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Handle redirect result
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Redirect login successful", result.user);
        }
      } catch (error: any) {
        console.error("Redirect login failed", error);
        setLoginError(`Redirect login failed: ${error.message || String(error)}`);
      }
    };
    checkRedirect();

    const handleOpenAI = (e: any) => {
      if (e.detail) {
        setStudyDeckContext(e.detail.contextText);
        setStudyDeckPrompt(e.detail.initialPrompt);
      }
      setShowStudyDeck(true);
    };
    window.addEventListener("open-ai-assistant", handleOpenAI);
    
    const handleOpenShare = (e: any) => {
      if (e.detail) {
        setShareData(e.detail);
      } else {
        setShareData({});
      }
      setShowShareModal(true);
    };
    window.addEventListener("open-share-modal", handleOpenShare);
    
    return () => {
      window.removeEventListener("open-ai-assistant", handleOpenAI);
      window.removeEventListener("open-share-modal", handleOpenShare);
    };
  }, []);

  useEffect(() => {
    const unsubscribeSettings = subscribeToSettings((s) => {
      setIsPaymentEnabled(s.isPaymentEnabled);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            const newUserData = currentUser.isAnonymous ? {
              uid: currentUser.uid,
              isGuest: true,
              faculty: "Guest",
              displayName: "Guest User",
              photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
              role: "guest",
              xp: 0,
              isVerified: false,
              isShana: false,
              cbtTimeSpent: 0,
              highScoreCount: 0,
              currentStreak: 0,
              lastActiveDate: new Date().toISOString().split('T')[0],
              dailyTokenCount: 0,
              lastTokenReset: new Date().toISOString().split('T')[0],
              shanaPeriodStart: Date.now(),
              createdAt: new Date().toISOString()
            } : {
              uid: currentUser.uid,
              email: currentUser.email?.trim().toLowerCase(),
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: "student",
              xp: 0,
              isVerified: false,
              isShana: false,
              cbtTimeSpent: 0,
              highScoreCount: 0,
              currentStreak: 0,
              lastActiveDate: new Date().toISOString().split('T')[0],
              dailyTokenCount: 0,
              lastTokenReset: new Date().toISOString().split('T')[0],
              shanaPeriodStart: Date.now(),
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newUserData);
            setDbUser(newUserData);
            if (!currentUser.isAnonymous) {
              navigate("/setup");
            }
          } else {
            let userData = userSnap.data();
            if (!currentUser.isAnonymous && !userData.matricNumber && location.pathname !== "/setup") {
              navigate("/setup");
            }
            const now = Date.now();
            const shanaPeriodStart = userData.shanaPeriodStart || now;
            
            // Normalize email for existing users if not already normalized
            if (userData.email && userData.email !== userData.email.trim().toLowerCase()) {
              await updateDoc(userRef, { email: userData.email.trim().toLowerCase() });
              userData.email = userData.email.trim().toLowerCase();
            }
            
            if (now - shanaPeriodStart > 14 * 24 * 60 * 60 * 1000) {
              // Reset Shana stats every 2 weeks
              userData = {
                ...userData,
                isShana: false,
                cbtTimeSpent: 0,
                highScoreCount: 0,
                shanaPeriodStart: now
              };
              await updateDoc(userRef, {
                isShana: false,
                cbtTimeSpent: 0,
                highScoreCount: 0,
                shanaPeriodStart: now
              });
            } else if (!userData.shanaPeriodStart) {
              userData.shanaPeriodStart = now;
              await updateDoc(userRef, { shanaPeriodStart: now });
            }
            
            setDbUser(userData);
            
            // Update streak
            updateNexusStreak(currentUser.uid).then(newStreak => {
              setDbUser((prev: any) => prev ? { ...prev, currentStreak: newStreak } : prev);
            });
          }
        } else {
          setDbUser(null);
        }
      } catch (error) {
        console.error("Auth state error:", error);
        if (currentUser) {
          handleFirestoreError(error, OperationType.GET, "users");
        }
      } finally {
        setLoading(false);
      }
    });
    return () => {
      unsubscribeSettings();
      unsubscribeAuth();
    };
  }, []);

  const isIframe = window.self !== window.top;

  const login = async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      // In iframes, popups often fail due to third-party cookie restrictions.
      // We try popup first, but catch the errors common in these environments.
      await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    } catch (error: any) {
      console.error("Login failed:", error);
      const errorCode = error.code;
      
      // auth/popup-closed-by-user: User manually closed it or browser terminated it
      // auth/cancelled-popup-request: Multiple login attempts
      // auth/popup-blocked: Browser blocked the popup
      const isPopupIssue = [
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
        'auth/popup-blocked',
        'auth/internal-error' // Sometimes happens when popup fails to load resources
      ].includes(errorCode);

      if (isPopupIssue) {
        if (isIframe) {
          setLoginError("Login failed: Authentication popups are restricted in this preview window. Please click the 'Open in New Tab' icon at the top right of this panel to log in securely, or use the link below.");
        } else {
          setLoginError("Login window was closed or blocked. Please ensure popups are allowed for this site and try again.");
          // Fallback to redirect only if not in an iframe (redirects often fail to return to iframes)
          try {
            await signInWithRedirect(auth, provider);
          } catch (reError) {
            console.error("Redirect fallback failed", reError);
          }
        }
      } else if (errorCode === 'auth/network-request-failed' || error.message?.includes('DNS_PROBE_FINISHED_NXDOMAIN')) {
        setLoginError("Network/DNS Error: Unable to reach the login service. If you are on a custom domain, ensure your Firebase 'Authorized Domains' includes it. Try opening in a new tab.");
      } else {
        setLoginError(`Authentication error: ${error.message || errorCode}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const guestLogin = async () => {
    setLoginError(null);
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error("Guest login failed", error);
      setLoginError(`Guest login failed: ${error.message || String(error)}`);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <LoadingLogo />
      </div>
    );
  }

  if (dbUser?.isBanned) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-8 text-center">
        <ShieldAlert size={64} className="text-red-500 mb-6 animate-pulse" />
        <h1 className="text-4xl font-black tracking-tighter mb-4">ACCESS TERMINATED</h1>
        <p className="text-xl text-[var(--foreground)]/60 max-w-md mb-8">
          Your account has been restricted from the Digital Nexus due to a violation of our academic integrity or community guidelines.
        </p>
        <button 
          onClick={logout}
          className="bg-red-600 text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  const navLinks = [
    { path: "/cbt", label: "CBT Engine" },
    { path: "/validate", label: "Validator" },
    { path: "/leaderboard", label: "Leaderboard" },
    { path: "/study-mode", label: "Study Mode" },
    ...(isPaymentEnabled ? [{ path: "/verification", label: "Verify Student", icon: <BadgeCheck size={14} /> }] : []),
    ...(user?.email === "banmekeifeoluwa@gmail.com" ? [{ path: "/admin-dashboard", label: "Admin", icon: <ShieldAlert size={14} /> }] : []),
    { path: "/about", label: "About", icon: <Zap size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans transition-colors duration-300">
      <Helmet>
        <title>Digital Nexus | OAU CBT, ePortal Hub & Study PDFs by Clement IfeOluwa</title>
        <meta name="description" content="Digital Nexus by ICEPAB: The ultimate OAU student super-app. Practice OAU CBT for ALL courses, GSTs, and Special Electives. Access OAU ePortal, download OAU study PDFs, and prepare for OAU Post UTME." />
        <meta name="keywords" content="ICEPAB, Digital Nexus, OAU CBT, All OAU Courses, OAU ePortal login, OAU student portal, OAU Post UTME past questions, OAU CGPA Calculator, OAU study PDFs, OAU academic resources, Clement IfeOluwa, Great Ife digital hub" />
        <meta property="og:title" content="Digital Nexus | OAU CBT Hub & ePortal Access" />
        <meta property="og:description" content="The ultimate OAU student super-app. Practice OAU CBT for all courses, access OAU ePortal, and download study PDFs." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${import.meta.env.NEXT_PUBLIC_BASE_URL || 'https://oau.cbt.icepab.name.ng'}${location.pathname}`} />
        <meta property="og:image" content={`${import.meta.env.NEXT_PUBLIC_BASE_URL || 'https://oau.cbt.icepab.name.ng'}/og-image.png`} />
        <link rel="canonical" href={`${import.meta.env.NEXT_PUBLIC_BASE_URL || 'https://oau.cbt.icepab.name.ng'}${location.pathname}${location.search}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Digital Nexus | OAU Digital Hub & CBT Engine" />
        <meta name="twitter:description" content="Practice OAU CBT, access ePortal, and dominate your exams with Digital Nexus." />
        <meta name="theme-color" content="#2563eb" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Clement IfeOluwa" />
      </Helmet>
      <nav className={clsx(
        "border-b border-[var(--border)] p-4 sticky top-0 bg-[var(--background)]/80 backdrop-blur-xl z-50 shadow-sm transition-transform duration-500",
        isFocusMode && location.pathname === "/cbt" && "-translate-y-full"
      )}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-tighter flex items-center gap-2">
              Digital Nexus
            </Link>
            <div className="hidden md:flex gap-6 text-sm font-medium text-[var(--foreground)]/70">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  className={clsx(
                    "hover:text-[var(--foreground)] transition-colors flex items-center gap-1.5",
                    location.pathname === link.path && "text-blue-600 dark:text-blue-400 font-semibold"
                  )}
                >
                  {link.icon} {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-emerald-500"
              aria-label="Share app"
            >
              <Share2 size={18} />
            </button>

            <button 
              onClick={() => setShowTutorial(true)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-blue-500"
              aria-label="How to use"
            >
              <HelpCircle size={18} />
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {dbUser?.currentStreak > 0 && (
                  <div className="flex items-center gap-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full font-bold text-xs border border-orange-500/20 animate-pulse">
                    <Flame size={14} fill="currentColor" /> {dbUser.currentStreak} Day Streak
                  </div>
                )}
                <Link to="/profile" className="hidden sm:flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 p-1 pr-3 rounded-full transition-colors border border-transparent hover:border-[var(--border)]">
                  <img src={user.photoURL} alt="Avatar" loading="lazy" decoding="async" className="w-8 h-8 rounded-full border border-[var(--border)]" />
                  <span className="text-sm font-bold truncate max-w-[100px] flex items-center gap-1">
                    {dbUser?.displayName || user.displayName}
                    <NexusBadge isVerified={dbUser?.isVerified} badgeType={dbUser?.badgeType} isShana={dbUser?.isShana} badges={dbUser?.badges} />
                  </span>
                </Link>
                <button onClick={logout} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-red-500" aria-label="Log out">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={login} 
                disabled={isLoggingIn}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            )}

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] bg-[var(--background)]/95 backdrop-blur-xl z-40 p-4 border-b border-[var(--border)]">
          <div className="flex flex-col gap-4 text-lg font-medium">
            {user && (
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-3 border border-[var(--border)] bg-black/5 dark:bg-white/5">
                <img src={user.photoURL} alt="Avatar" loading="lazy" decoding="async" className="w-10 h-10 rounded-full" />
                <div className="flex flex-col">
                  <span className="font-bold flex items-center gap-1">
                    {dbUser?.displayName || user.displayName}
                    <NexusBadge isVerified={dbUser?.isVerified} badgeType={dbUser?.badgeType} isShana={dbUser?.isShana} badges={dbUser?.badges} />
                  </span>
                  <span className="text-xs text-[var(--foreground)]/50">View Profile & Verify</span>
                </div>
              </Link>
            )}
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-3"
              >
                {link.icon} {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {loginError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3">
            <ShieldAlert className="shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-medium text-sm leading-relaxed">{loginError}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button 
                  onClick={() => setLoginError(null)} 
                  className="text-xs font-bold bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  Dismiss
                </button>
                <a 
                  href={window.location.origin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                >
                  Open in New Tab
                </a>
                <button 
                  onClick={login}
                  className="text-xs font-bold border border-blue-600 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home user={user} login={login} isLoggingIn={isLoggingIn} />} />
            <Route path="/admin-dashboard" element={<Admin user={user} />} />
            <Route path="/icepab-admin" element={<Admin user={user} />} />
            <Route path="/cbt" element={<CBT user={user} isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode} />} />
            <Route path="/validate" element={<Validator user={user} />} />
            <Route path="/leaderboard" element={<Leaderboard user={user} />} />
            <Route path="/gpa" element={<GPA user={user} />} />
            <Route path="/aro" element={<Aro user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/setup" element={<Setup user={user} dbUser={dbUser} setDbUser={setDbUser} />} />
            <Route path="/about" element={<About />} />
            <Route path="/community" element={<Community user={user} />} />
            <Route path="/verification" element={<Verification user={user} />} />
            <Route path="/resources" element={<Resources user={user} />} />
            <Route path="/study-mode" element={<StudyMode user={user} />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="max-w-7xl mx-auto p-8 border-t border-[var(--border)] text-center space-y-4 opacity-60">
        <p className="text-sm font-medium">
          Copyright ©️ Clement IfeOluwa ❄️🧊 {new Date().getFullYear()}
        </p>
        <p className="text-xs">
          Lead Developer: Clement IfeOluwa ❄️🧊 | Co-developer: Nova xit
        </p>
      </footer>

      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      {showShareModal && (
        <ShareModal 
          isOpen={showShareModal} 
          onClose={() => {
            setShowShareModal(false);
            setShareData({});
          }} 
          {...shareData}
        />
      )}
      {/* {!isAIChatPage && !showStudyDeck && <FloatingAI />} */}
      {showStudyDeck && (
        <StudyDeck 
          user={user} 
          onClose={() => {
            setShowStudyDeck(false);
            setStudyDeckContext(undefined);
            setStudyDeckPrompt(undefined);
          }} 
          contextText={studyDeckContext}
          initialPrompt={studyDeckPrompt}
        />
      )}
      <BottomNav />
      <OfflineBanner />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Router>
          <ErrorBoundary>
            <MainApp />
          </ErrorBoundary>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}
