import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { db } from "../firebase";
import { User, BadgeCheck, Upload, CreditCard, CheckCircle2, Loader2, Save, Flame, Clock, Target } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast } from "../components/Toast";

export default function Profile({ user }: { user: any }) {
  const [displayName, setDisplayName] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isShana, setIsShana] = useState(false);
  const [cbtTimeSpent, setCbtTimeSpent] = useState(0);
  const [highScoreCount, setHighScoreCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Verification Flow State
  // "idle" | "uploading" | "paying" | "success"
  const [verifyStep, setVerifyStep] = useState("idle");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDisplayName(data.displayName || "");
          setIsVerified(data.isVerified || false);
          setIsShana(data.isShana || false);
          setCbtTimeSpent(data.cbtTimeSpent || 0);
          setHighScoreCount(data.highScoreCount || 0);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "users");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
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

  const startVerification = () => setVerifyStep("uploading");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const proceedToPayment = () => {
    if (!file) return toast("Please upload your Student ID or Portal Biodata first.");
    setVerifyStep("paying");
  };

  const simulatePayment = () => {
    setVerifyStep("processing");
    setTimeout(async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        await updateDoc(docRef, { isVerified: true });
        setIsVerified(true);
        setVerifyStep("success");
        setFile(null); // "Delete" the file after verification
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        toast("Payment succeeded but verification failed. Please contact admin.");
        setVerifyStep("idle");
      }
    }, 2000);
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
        <title>Profile | ICEPAB Nexus</title>
        <meta name="description" content="Manage your ICEPAB Nexus profile and verification status." />
      </Helmet>
      <div>
        <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
          <User className="text-blue-500" /> User Profile
        </h1>
        <p className="text-[var(--foreground)]/60 mt-2 font-medium">Manage your identity and verification status.</p>
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

            {verifyStep === "idle" && (
              <button
                onClick={startVerification}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-md w-full sm:w-auto"
              >
                <BadgeCheck size={20} /> Become Verified
              </button>
            )}

            {verifyStep === "uploading" && (
              <div className="bg-black/5 dark:bg-white/5 border border-[var(--border)] p-6 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><Upload size={18} /> Step 1: Upload ID</h3>
                <p className="text-sm text-[var(--foreground)]/60">Upload your Student ID or Portal Biodata screenshot. This will be securely processed and deleted.</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)]/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-500/10 file:text-blue-600 dark:file:text-blue-400 hover:file:bg-blue-500/20 transition-all cursor-pointer"
                />
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setVerifyStep("idle")} className="px-4 py-2 rounded-xl font-bold text-[var(--foreground)]/60 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">Cancel</button>
                  <button onClick={proceedToPayment} disabled={!file} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-colors disabled:opacity-50">Continue to Payment</button>
                </div>
              </div>
            )}

            {verifyStep === "paying" && (
              <div className="bg-black/5 dark:bg-white/5 border border-[var(--border)] p-6 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><CreditCard size={18} /> Step 2: Payment</h3>
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-center">
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Total Amount</div>
                  <div className="text-3xl font-bold">₦1,000</div>
                </div>
                <p className="text-sm text-[var(--foreground)]/60 text-center">This is a simulated payment for the prototype.</p>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setVerifyStep("uploading")} className="px-4 py-2 rounded-xl font-bold text-[var(--foreground)]/60 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">Back</button>
                  <button onClick={simulatePayment} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold transition-colors flex justify-center items-center gap-2">
                    Pay ₦1,000 Now
                  </button>
                </div>
              </div>
            )}

            {verifyStep === "processing" && (
              <div className="bg-black/5 dark:bg-white/5 border border-[var(--border)] p-10 rounded-2xl flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-blue-500" size={40} />
                <p className="font-bold text-lg">Processing Payment & Verifying ID...</p>
                <p className="text-sm text-[var(--foreground)]/50">Please do not close this window.</p>
              </div>
            )}
            
            {verifyStep === "success" && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-2xl flex flex-col items-center justify-center space-y-4 text-center animate-in zoom-in">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 mb-2">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="font-bold text-2xl text-emerald-700 dark:text-emerald-400">Verification Complete!</h3>
                <p className="text-[var(--foreground)]/70 font-medium">Your ID has been verified and deleted from our servers. Enjoy your blue tick!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
