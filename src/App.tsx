import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { ThemeProvider, useTheme } from "./components/theme-provider";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { useEffect, useState, Suspense, lazy } from "react";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, browserPopupRedirectResolver, signInAnonymously } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./utils/errorHandling";
import { LogIn, LogOut, ShieldAlert, Sun, Moon, Calculator, Share2, Menu, X, User, BadgeCheck, Flame, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import NexusBadge from "./components/NexusBadge";
import Toast from "./components/Toast";

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

const LoadingFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-[var(--foreground)]/60">
    <Loader2 className="animate-spin mb-4 text-blue-500" size={40} />
    <p className="font-medium">Loading Nexus...</p>
  </div>
);

function MainApp() {
  const [user, setUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
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
              shanaPeriodStart: Date.now(),
              createdAt: new Date().toISOString()
            } : {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: "student",
              xp: 0,
              isVerified: false,
              isShana: false,
              cbtTimeSpent: 0,
              highScoreCount: 0,
              shanaPeriodStart: Date.now(),
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newUserData);
            setDbUser(newUserData);
            if (!currentUser.isAnonymous) {
              window.location.href = "/setup";
            }
          } else {
            let userData = userSnap.data();
            if (!currentUser.isAnonymous && !userData.matricNumber && window.location.pathname !== "/setup") {
              window.location.href = "/setup";
            }
            const now = Date.now();
            const shanaPeriodStart = userData.shanaPeriodStart || now;
            
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
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, "users");
        }
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    setLoginError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/network-request-failed') {
        setLoginError("Login failed: Network error. This is often caused by ad blockers, privacy extensions (like Privacy Badger or Brave Shields), or disabled third-party cookies. Please disable them for this site and try again, or open the app in a new tab.");
      } else {
        setLoginError(`Login failed: ${error.message || String(error)}`);
      }
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
    return <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">Loading Nexus...</div>;
  }

  const navLinks = [
    { path: "/cbt", label: "CBT Engine" },
    { path: "/validate", label: "Validator" },
    { path: "/leaderboard", label: "Leaderboard" },
    { path: "/gpa", label: "CGPA", icon: <Calculator size={14} /> },
    { path: "/aro", label: "Aro Gen", icon: <Share2 size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans transition-colors duration-300">
      <Helmet>
        <title>ICEPAB Nexus | OAU Digital Hub</title>
        <meta name="description" content="The ultimate digital hub for OAU students. Access CBT practice, CGPA calculator, Leaderboard, and more." />
      </Helmet>
      <nav className="border-b border-[var(--border)] p-4 sticky top-0 bg-[var(--background)]/80 backdrop-blur-xl z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-tighter flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-500">ICEPAB</span> Nexus
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

            {user ? (
              <div className="flex items-center gap-3">
                {user.email === "banmekeifeoluwa@gmail.com" && (
                   <Link to="/icepab-admin" className="hidden sm:flex text-xs bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full items-center gap-1.5 font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors">
                     <ShieldAlert size={14} /> Admin
                   </Link>
                )}
                <Link to="/profile" className="hidden sm:flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 p-1 pr-3 rounded-full transition-colors border border-transparent hover:border-[var(--border)]">
                  <img src={user.photoURL} alt="Avatar" loading="lazy" decoding="async" className="w-8 h-8 rounded-full border border-[var(--border)]" />
                  <span className="text-sm font-bold truncate max-w-[100px] flex items-center gap-1">
                    {dbUser?.displayName || user.displayName}
                    <NexusBadge isVerified={dbUser?.isVerified} badgeType={dbUser?.badgeType} isShana={dbUser?.isShana} />
                  </span>
                </Link>
                <button onClick={logout} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-red-500" aria-label="Log out">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button onClick={login} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-md">
                <LogIn size={16} /> Sign In
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
                    <NexusBadge isVerified={dbUser?.isVerified} badgeType={dbUser?.badgeType} isShana={dbUser?.isShana} />
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
            {user?.email === "banmekeifeoluwa@gmail.com" && (
              <Link to="/icepab-admin" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-xl text-red-500 flex items-center gap-3 bg-red-500/10">
                <ShieldAlert size={18} /> Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {loginError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3">
            <ShieldAlert className="shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-medium">{loginError}</p>
              <button 
                onClick={() => setLoginError(null)} 
                className="mt-2 text-sm underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/icepab-admin" element={<Admin user={user} />} />
            <Route path="/cbt" element={<CBT user={user} />} />
            <Route path="/validate" element={<Validator user={user} />} />
            <Route path="/leaderboard" element={<Leaderboard user={user} />} />
            <Route path="/gpa" element={<GPA user={user} />} />
            <Route path="/aro" element={<Aro user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/setup" element={<Setup user={user} dbUser={dbUser} setDbUser={setDbUser} />} />
          </Routes>
        </Suspense>
      </main>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Router>
          <MainApp />
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}
