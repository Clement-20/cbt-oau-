import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, count } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { db } from "../firebase";
import { User, BadgeCheck, Upload, CreditCard, CheckCircle2, Loader2, Save, Flame, Clock, Target, Share2, ThumbsUp, Users, Twitter, Linkedin, ExternalLink, Star, FileText } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast } from "../components/Toast";
import { subscribeToSettings } from "../lib/settings";
import { Link } from "react-router-dom";
import { useAcademicStore } from "../lib/academicStore";

export default function Profile({ user }: { user: any }) {
  const [displayName, setDisplayName] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isShana, setIsShana] = useState(false);
  const [cbtTimeSpent, setCbtTimeSpent] = useState(0);
  const [highScoreCount, setHighScoreCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(true);
  
  // Social Stats
  const [stats, setStats] = useState({
    uploads: 0,
    totalLikes: 0,
    followers: 0
  });

  const { followedUploaders, favoriteResources } = useAcademicStore();
  const [favoriteMaterials, setFavoriteMaterials] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const unsubscribeSettings = subscribeToSettings((s) => {
      setIsPaymentEnabled(s.isPaymentEnabled);
    });

    const fetchProfileData = async () => {
      try {
        // Fetch User Doc
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setDisplayName(data.displayName || "");
          setIsVerified(data.isVerified || false);
          setIsShana(data.isShana || false);
          setCbtTimeSpent(data.cbtTimeSpent || 0);
          setHighScoreCount(data.highScoreCount || 0);
        }

        // Fetch Uploads & Likes
        const resourcesQ = query(collection(db, "resources"), where("userId", "==", user.uid));
        const resourcesSnap = await getDocs(resourcesQ);
        let totalLikes = 0;
        resourcesSnap.forEach(doc => {
          totalLikes += (doc.data().likes || 0);
        });

        // Fetch Followers (Query users where followedUploaders contains user.uid)
        const followersQ = query(collection(db, "users"), where("followedUploaders", "array-contains", user.uid));
        const followersSnap = await getDocs(followersQ);

        setStats({
          uploads: resourcesSnap.size,
          totalLikes,
          followers: followersSnap.size
        });

      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      } finally {
        setLoading(false);
      }
    };

    const fetchFavorites = async () => {
      if (favoriteResources.length === 0) {
        setFavoriteMaterials([]);
        return;
      }
      setLoadingFavorites(true);
      try {
        const q = query(collection(db, "resources"), where("__name__", "in", favoriteResources.slice(0, 10)));
        const snap = await getDocs(q);
        const mats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFavoriteMaterials(mats);
      } catch (e) {
        console.error("Error fetching favorites", e);
      } finally {
        setLoadingFavorites(false);
      }
    };

    fetchProfileData();
    fetchFavorites();

    return () => {
      unsubscribeSettings();
    };
  }, [user, favoriteResources]);

  const handleSaveProfile = async () => {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, { displayName });
      toast("Profile updated successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      toast("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="text-center py-20 text-[var(--foreground)]/60 font-medium">Sign in to access your profile.</div>;
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <Helmet>
        <title>Profile | Digital Nexus</title>
        <meta name="description" content="Manage your Digital Nexus profile and verification status." />
      </Helmet>

      {/* Profile Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-[40px]"></div>
        <div className="px-8 -mt-12 flex flex-col sm:flex-row items-end gap-6">
          <div className="relative">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
              alt={displayName} 
              className="w-32 h-32 rounded-[40px] border-4 border-[var(--background)] bg-[var(--background)] shadow-xl"
            />
            {isVerified && (
              <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-2xl shadow-lg border-4 border-[var(--background)]">
                <BadgeCheck size={24} />
              </div>
            )}
          </div>
          <div className="flex-1 pb-2">
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
              {displayName || "Student"}
              {isVerified && <span className="text-xs bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest font-black">ICEPAB Scholar</span>}
            </h1>
            <p className="text-[var(--foreground)]/50 font-bold text-sm tracking-tight">{user.email}</p>
          </div>
          <button 
            onClick={() => {
              const text = `Check out my student profile on Digital Nexus! ${isShana ? "I'm a Certified Shana! 🔥" : ""} ${isVerified ? "I'm Verified! ✅" : ""}`;
              window.dispatchEvent(new CustomEvent("open-share-modal", {
                detail: {
                  title: `${displayName}'s Profile`,
                  text: text,
                  url: window.location.origin
                }
              }));
            }}
            className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 text-[var(--foreground)] border border-[var(--border)] px-5 py-3 rounded-2xl font-bold transition-all shadow-sm mb-2 hover:scale-105 active:scale-95"
          >
            <Share2 size={18} /> Share
          </button>
        </div>
      </div>

      {/* Social Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Uploads", value: stats.uploads, icon: Upload, color: "text-blue-500" },
          { label: "Likes", value: stats.totalLikes, icon: ThumbsUp, color: "text-emerald-500" },
          { label: "Followers", value: stats.followers, icon: Users, color: "text-purple-500" },
          { label: "Following", value: followedUploaders.length, icon: Users, color: "text-amber-500" },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-4 rounded-3xl text-center border border-[var(--border)]">
            <div className={`w-10 h-10 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-2 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div className="text-xl font-black tracking-tighter">{stat.value}</div>
            <div className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Profile Edit Section */}
      <div className="glass-panel p-8 rounded-[40px] shadow-sm space-y-6">
        <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
          Profile Settings
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-[var(--foreground)]/40 uppercase tracking-widest ml-2 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should students see you?"
              className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-2xl p-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSaveProfile}
              disabled={saving || !displayName.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Changes
            </button>

            {user.email === "banmekeifeoluwa@gmail.com" && (
              <Link
                to="/admin-dashboard"
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-red-500/20"
              >
                <BadgeCheck size={18} /> Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Verification Section */}
      {isPaymentEnabled && (
        <div className="glass-panel p-8 rounded-[40px] shadow-sm space-y-6 relative overflow-hidden border-2 border-blue-500/20">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
          
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2 relative z-10">
            Verification Status
            {isVerified && <BadgeCheck className="text-blue-500" size={24} />}
          </h2>

          {isVerified ? (
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl relative z-10">
              <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400 font-black text-xl mb-2">
                <CheckCircle2 size={24} /> You are Verified!
              </div>
              <p className="text-[var(--foreground)]/70 font-bold">
                You have the official ICEPAB Nexus blue tick. Your uploads are prioritized and you stand out in the community.
              </p>
            </div>
          ) : (
            <div className="space-y-6 relative z-10">
              <p className="text-[var(--foreground)]/70 font-bold">
                Get the official ICEPAB Scholar badge. Verification grants unlimited AI explanations, ability to contribute materials to the marketplace, and priority resource ranking.
              </p>

              <Link
                to="/verification"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 w-full sm:w-auto"
              >
                <CreditCard size={20} /> Verify for ₦500
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Shana Status Section */}
      <div className="glass-panel p-8 rounded-[40px] shadow-sm space-y-6 relative overflow-hidden border-2 border-orange-500/20">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl"></div>
        
        <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2 relative z-10">
          Shana Mastery
          {isShana && <Flame className="text-orange-500" size={24} />}
        </h2>

        {isShana ? (
          <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl relative z-10">
            <div className="flex items-center gap-3 text-orange-700 dark:text-orange-400 font-black text-xl mb-2">
              <Flame size={24} /> Certified Shana!
            </div>
            <p className="text-[var(--foreground)]/70 font-bold">
              You've mastered the CBT engine. Your dedication is visible to everyone on the leaderboard.
            </p>
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            <p className="text-[var(--foreground)]/70 font-bold">
              Earn the exclusive <Flame className="inline text-orange-500" size={18}/> Shana badge by proving your dedication in the CBT Engine.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-black/5 dark:bg-white/5 border border-[var(--border)] p-5 rounded-3xl">
                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest mb-2 opacity-40">
                  <Clock size={14} /> Time Spent
                </div>
                <div className="text-2xl font-black tracking-tighter">
                  {Math.floor(cbtTimeSpent / 60)} / 60 <span className="text-xs text-[var(--foreground)]/50">MINS</span>
                </div>
                <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all" 
                    style={{ width: `${Math.min((cbtTimeSpent / 3600) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-black/5 dark:bg-white/5 border border-[var(--border)] p-5 rounded-3xl">
                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest mb-2 opacity-40">
                  <Target size={14} /> High Scores
                </div>
                <div className="text-2xl font-black tracking-tighter">
                  {highScoreCount} / 3 <span className="text-xs text-[var(--foreground)]/50">TESTS</span>
                </div>
                <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all" 
                    style={{ width: `${Math.min((highScoreCount / 3) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Saved Materials Section */}
      <div className="glass-panel p-8 rounded-[40px] shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <Star className="text-rose-500 fill-rose-500" size={24} /> Saved Materials
          </h2>
          <Link to="/resources" className="text-xs font-bold text-blue-600 hover:underline px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">View All</Link>
        </div>

        {loadingFavorites ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-blue-500" size={24} />
          </div>
        ) : favoriteMaterials.length > 0 ? (
          <div className="space-y-3">
            {favoriteMaterials.map((mat) => (
              <a 
                key={mat.id}
                href={mat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl hover:bg-rose-500/5 hover:border-rose-500/30 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${mat.type === 'PDF' ? 'bg-red-500/10 text-red-500' : mat.type === 'Image' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-sm tracking-tight group-hover:text-rose-600 transition-colors">{mat.title}</div>
                    <div className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest">{mat.course} • {mat.type}</div>
                  </div>
                </div>
                <ExternalLink size={16} className="text-[var(--foreground)]/20 group-hover:text-rose-500 transition-opacity" />
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-black/5 dark:bg-white/5 rounded-3xl border-2 border-dashed border-[var(--border)]">
            <Star className="mx-auto text-[var(--foreground)]/10 mb-4" size={40} />
            <p className="text-sm font-bold text-[var(--foreground)]/40">You haven't saved any materials yet.</p>
            <Link to="/resources" className="text-xs font-black text-rose-500 uppercase mt-4 inline-block hover:underline">Browse Marketplace</Link>
          </div>
        )}
      </div>

      {/* Support & Links */}
      <div className="glass-panel p-8 rounded-[40px] shadow-sm space-y-6">
        <h2 className="text-2xl font-black tracking-tighter">Nexus Support</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a 
            href="https://x.com/clementifeoluwa" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-3xl hover:bg-blue-500/5 hover:border-blue-500/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg">
                <Twitter size={24} />
              </div>
              <div>
                <div className="font-black tracking-tighter">Founder's X</div>
                <div className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest">Updates & Support</div>
              </div>
            </div>
            <ExternalLink size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>

          <a 
            href="https://linkedin.com/in/clementifeoluwa" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-5 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-3xl hover:bg-blue-700/5 hover:border-blue-700/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0077b5] text-white flex items-center justify-center shadow-lg">
                <Linkedin size={24} />
              </div>
              <div>
                <div className="font-black tracking-tighter">LinkedIn</div>
                <div className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest">Professional Connect</div>
              </div>
            </div>
            <ExternalLink size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>
    </div>
  );
}
