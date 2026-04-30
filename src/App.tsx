import NexusLogo from "./components/NexusLogo";
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider, useTheme } from "./components/theme-provider";
import { getSettings, subscribeToSettings } from "./lib/settings";
import { Helmet } from "./components/Helmet";
import { useEffect, useState, Suspense, lazy } from "react";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./utils/errorHandling";
import { LogIn, LogOut, ShieldAlert, Sun, Moon, Calculator, Share2, Menu, X, User, Flame, Loader2, Zap, HelpCircle, MessageSquare, MessageCircle } from "lucide-react";
import { clsx } from "clsx";
import NexusBadge from "./components/NexusBadge";
import Toast from "./components/Toast";
import { updateNexusStreak } from "./utils/nexusUtils";
import { useAcademicStore } from "./lib/academicStore";
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
const Resources = lazy(() => import("./pages/Resources"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StudyMode = lazy(() => import("./pages/StudyMode"));
const AdminSeeder = lazy(() => import("./pages/AdminSeeder"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PostUTME = lazy(() => import("./pages/PostUTME"));
const Reviews = lazy(() => import("./pages/Reviews"));

import { ErrorBoundary } from "./components/ErrorBoundary";
import ConfirmModal from "./components/ConfirmModal";
import LoadingLogo from "./components/LoadingLogo";
import Tutorial from "./components/Tutorial";
import ShareModal from "./components/ShareModal";
import OfflineBanner from "./components/OfflineBanner";
import InstallPwaBanner from "./components/InstallPwaBanner";
import SignInPromptBanner from "./components/SignInPromptBanner";
import { useNotifications } from "./lib/notifications";

import BottomNav from "./nexus-features/BottomNav";
import CommandPalette from "./components/CommandPalette";

const LoadingFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center">
    <LoadingLogo />
  </div>
);

function MainApp() {
  const [user, setUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<{ title?: string; text?: string; url?: string }>({});
  const [showStudyDeck, setShowStudyDeck] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [studyDeckContext, setStudyDeckContext] = useState<string | undefined>();
  const [studyDeckPrompt, setStudyDeckPrompt] = useState<string | undefined>();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  useNotifications(user?.uid);

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
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Keep loading true while we resolve the database profile
      setLoading(true);
      
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
              createdAt: serverTimestamp()
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
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, newUserData);
            setDbUser(newUserData);
            if (!currentUser.isAnonymous) {
              navigate("/setup");
            }
          } else {
            let userData = userSnap.data();
            
            // CRITICAL: Immediate termination if banned
            if (userData.isBanned) {
              setDbUser(userData);
              setUser(currentUser);
              setLoading(false);
              return;
            }

            if (!currentUser.isAnonymous && (!userData.faculty || !userData.department) && location.pathname !== "/setup") {
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
            }
            
            setDbUser(userData);
            
            // Hydrate local store with firestore followers to ensure honesty
            if (userData.followedUploaders) {
              useAcademicStore.setState({ followedUploaders: userData.followedUploaders });
            }
            
            // Update streak asynchronously without blocking the UI
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
      const signInPromise = signInWithPopup(auth, provider);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('auth/timeout')), 15000)
      );
      
      await Promise.race([signInPromise, timeoutPromise]);
    } catch (error: any) {
      console.error("Login failed:", error);
      const errorCode = error.message === 'auth/timeout' ? 'auth/timeout' : error.code;
      
      // auth/popup-closed-by-user: User manually closed it or browser terminated it
      // auth/cancelled-popup-request: Multiple login attempts
      // auth/popup-blocked: Browser blocked the popup
      const isPopupIssue = [
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
        'auth/popup-blocked',
        'auth/internal-error',
        'auth/timeout'
      ].includes(errorCode);

      if (isPopupIssue) {
        if (errorCode === 'auth/timeout') {
            setLoginError("Login timed out. Authentication popups may be blocked or restricted in this preview window. Please click the 'Open in New Tab' icon at the top right of this panel to log in securely.");
        } else if (isIframe) {
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
    { path: "/post-utme", label: "Post-UTME Test" },
    { path: "/reviews", label: "Reviews", icon: <MessageSquare size={14} /> },
    ...(user?.email === "banmekeifeoluwa@gmail.com" ? [{ path: "/admin-dashboard", label: "Admin", icon: <ShieldAlert size={14} /> }] : []),
    { path: "/about", label: "About", icon: <Zap size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans transition-colors duration-300 overflow-x-hidden">
      <Helmet>
        <title>Digital Nexus | OAU CBT Practice & CGPA Calculator</title>
        <meta name="keywords" content="OAU CBT, GST 111 OAU, OAU CGPA Calculator, Obafemi Awolowo University, Great Ife, OAU e-portal, Digital Nexus, ICEPAB, Clement IfeOluwa, OAU Past Questions, OAU Post-UTME, OAU Freshers Guide" />
        
        {/* Add this for better SEO on the new domain */}
        <link rel="canonical" href="https://oau.cbt.icepab.name.ng" />
        
        {/* OpenGraph for WhatsApp/Twitter previews */}
        <meta property="og:title" content="Digital Nexus - The Ultimate OAU Student App" />
        <meta property="og:description" content="Master your OAU CBT exams, calculate your GP, and access campus resources instantly." />
        <meta property="og:url" content="https://oau.cbt.icepab.name.ng" />
      </Helmet>
      <nav className={clsx(
        "border-b border-[var(--border)] p-4 sticky top-0 bg-[var(--background)]/80 backdrop-blur-xl z-50 shadow-sm transition-transform duration-500",
        isFocusMode && location.pathname === "/cbt" && "-translate-y-full"
      )}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-tighter flex items-center gap-2">
              <NexusLogo className="w-8 h-8" />
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
                <button onClick={() => setShowLogoutConfirm(true)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-red-500" aria-label="Log out">
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
            <Route path="/admin-settings" element={<AdminDashboard user={user} dbUser={dbUser} />} />
            <Route path="/icepab-admin" element={<Admin user={user} />} />
            <Route path="/admin/seed" element={<AdminSeeder user={user} dbUser={dbUser} />} />
            <Route path="/cbt" element={<CBT user={user} dbUser={dbUser} isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode} />} />
            <Route path="/validate" element={<Validator user={user} />} />
            <Route path="/leaderboard" element={<Leaderboard user={user} />} />
            <Route path="/post-utme" element={<PostUTME />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/gpa" element={<GPA user={user} />} />
            <Route path="/aro" element={<Aro user={user} />} />
            <Route path="/profile" element={<Profile user={user} dbUser={dbUser} setDbUser={setDbUser} />} />
            <Route path="/profile/:id" element={<Profile user={user} dbUser={dbUser} setDbUser={setDbUser} />} />
            <Route path="/setup" element={<Setup user={user} dbUser={dbUser} setDbUser={setDbUser} />} />
            <Route path="/about" element={<About />} />
            <Route path="/community" element={<Community user={user} />} />
            <Route path="/resources" element={<Resources user={user} />} />
            <Route path="/study-mode" element={<StudyMode user={user} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="max-w-7xl mx-auto p-8 border-t border-[var(--border)] text-center space-y-4 opacity-60">
        <p className="text-sm font-medium">
          Copyright ©️ ICEPAB Digital Nexus {new Date().getFullYear()}
        </p>
        <p className="text-xs italic">
          The official OAU Student Super-App. Built for Learning and Culture.
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
      {/* {showStudyDeck && (
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
      )} */}
      <BottomNav />
      <CommandPalette />
      <OfflineBanner />
      <InstallPwaBanner />
      <SignInPromptBanner user={user} login={login} />
      <Toast />
      
      <ConfirmModal 
        isOpen={showLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of Digital Nexus?"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <ErrorBoundary>
          <MainApp />
        </ErrorBoundary>
      </Router>
    </ThemeProvider>
  );
}
