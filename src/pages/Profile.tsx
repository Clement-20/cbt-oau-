import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { db } from "../firebase";
import { User, BadgeCheck, Upload, CreditCard, CheckCircle2, Loader2, Save, Flame, Clock, Target, Share2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast } from "../components/Toast";
import { getSettings, subscribeToSettings } from "../lib/settings";
import { Link } from "react-router-dom";

export default function Profile({ user }: { user: any }) {
  const [displayName, setDisplayName] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isShana, setIsShana] = useState(false);
  const [cbtTimeSpent, setCbtTimeSpent] = useState(0);
  const [highScoreCount, setHighScoreCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const unsubscribeSettings = subscribeToSettings((s) => {
      setIsPaymentEnabled(s.isPaymentEnabled);
    });

    const fetchProfile = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setDisplayName(data.displayName || "");
          setIsVerified(data.isVerified || false);
          setIsShana(data.isShana || false);
          setCbtTimeSpent(data.cbtTimeSpent || 0);
          setHighScoreCount(data.highScoreCount || 0);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    return () => {
      unsubscribeSettings();
    };
  }, [user]);

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
    <div className="max-w-2xl mx-auto space-y-8">
      <Helmet>
        <title>Profile | Digital Nexus</title>
        <meta name="description" content="Manage your Digital Nexus profile and verification status." />
      </Helmet>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
            <User className="text-blue-500" /> User Profile
          </h1>
          <p className="text-[var(--foreground)]/60 mt-2 font-medium">Manage your identity and verification status.</p>
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
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md shrink-0"
        >
          <Share2 size={18} /> Share Profile
        </button>
      </div>

      {/* Profile Edit Section */}
      <div className="glass-panel p-8 rounded-3xl shadow-sm space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          Profile Settings
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--foreground)]/80 mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-2xl p-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
            />
          </div>
          
          <button
            onClick={handleSaveProfile}
            disabled={saving || !displayName.trim()}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Changes
          </button>
        </div>
      </div>

      {/* Shana Status Section */}
      <div className="glass-panel p-8 rounded-3xl shadow-sm space-y-6 relative overflow-hidden">
        {isShana && (
          <div className="absolute top-0 right-0 p-6 opacity-10 text-orange-500 pointer-events-none">
            <Flame size={120} />
          </div>
        )}
        
        <h2 className="text-2xl font-bold flex items-center gap-2 relative z-10">
          Shana Status
          {isShana && <Flame className="text-orange-500" size={24} />}
        </h2>

        {isShana ? (
          <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-2xl relative z-10">
            <div className="flex items-center gap-3 text-orange-700 dark:text-orange-400 font-bold text-lg mb-2">
              <Flame size={24} /> You are a Certified Shana!
            </div>
            <p className="text-[var(--foreground)]/70 font-medium">
              You've mastered the CBT engine. Your dedication is visible to everyone on the leaderboard.
            </p>
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            <p className="text-[var(--foreground)]/70 font-medium">
              Earn the exclusive <Flame className="inline text-orange-500" size={18}/> Shana badge by proving your dedication in the CBT Engine.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-black/5 dark:bg-white/5 border border-[var(--border)] p-5 rounded-2xl">
                <div className="flex items-center gap-2 font-bold mb-2">
                  <Clock size={18} className="text-blue-500" /> Time Spent
                </div>
                <div className="text-2xl font-mono font-bold">
                  {Math.floor(cbtTimeSpent / 60)} / 60 <span className="text-sm text-[var(--foreground)]/50">mins</span>
                </div>
                <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all" 
                    style={{ width: `${Math.min((cbtTimeSpent / 3600) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-black/5 dark:bg-white/5 border border-[var(--border)] p-5 rounded-2xl">
                <div className="flex items-center gap-2 font-bold mb-2">
                  <Target size={18} className="text-emerald-500" /> High Scores (80%+)
                </div>
                <div className="text-2xl font-mono font-bold">
                  {highScoreCount} / 3 <span className="text-sm text-[var(--foreground)]/50">tests</span>
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

      {/* Verification Section */}
      {isPaymentEnabled && (
        <div className="glass-panel p-8 rounded-3xl shadow-sm space-y-6 relative overflow-hidden">
          {isVerified && (
            <div className="absolute top-0 right-0 p-6 opacity-10 text-blue-500 pointer-events-none">
              <BadgeCheck size={120} />
            </div>
          )}
          
          <h2 className="text-2xl font-bold flex items-center gap-2 relative z-10">
            Verification Status
            {isVerified && <BadgeCheck className="text-blue-500" size={24} />}
          </h2>

          {isVerified ? (
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl relative z-10">
              <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400 font-bold text-lg mb-2">
                <CheckCircle2 size={24} /> You are Verified!
              </div>
              <p className="text-[var(--foreground)]/70 font-medium">
                You have the official ICEPAB Nexus blue tick. You stand out on the leaderboard and validator queue.
              </p>
            </div>
          ) : (
            <div className="space-y-6 relative z-10">
              <p className="text-[var(--foreground)]/70 font-medium">
                Get the official blue tick to stand out. Verification requires a one-time payment of ₦1,000 and a valid Student ID or Portal Biodata screenshot (deleted immediately after verification).
              </p>

              <Link
                to="/verification"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-md w-full sm:w-auto"
              >
                <BadgeCheck size={20} /> Become Verified
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
