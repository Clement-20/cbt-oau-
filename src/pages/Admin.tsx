import React, { useState } from "react";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { db } from "../firebase";
import { ShieldAlert, Send, Search, BadgeCheck, Loader2 } from "lucide-react";

export default function Admin({ user }: { user: any }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  if (!user || user.email !== "banmekeifeoluwa@gmail.com") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert size={64} className="text-red-500 mb-4 drop-shadow-lg" />
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-[var(--foreground)]/60 mt-2 font-medium">You do not have Overlord privileges.</p>
      </div>
    );
  }

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "broadcasts"), {
        message,
        authorId: user.uid,
        timestamp: serverTimestamp()
      });
      setMessage("");
      alert("Broadcast sent to all students instantly!");
    } catch (error) {
      console.error("Error sending broadcast:", error);
      alert("Failed to send broadcast.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const q = query(collection(db, "users"), where("email", "==", searchEmail.trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        setSearchResult({ id: userDoc.id, ...userDoc.data() });
      } else {
        alert("User not found.");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "users");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleVerifyUser = async () => {
    if (!searchResult) return;
    
    try {
      const userRef = doc(db, "users", searchResult.id);
      await updateDoc(userRef, { isVerified: true });
      setSearchResult({ ...searchResult, isVerified: true });
      alert("User verified successfully!");
    } catch (error) {
      console.error("Error verifying user:", error);
      alert("Failed to verify user.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
          <ShieldAlert className="text-red-600 dark:text-red-500" /> Admin Overlord
        </h1>
        <p className="text-[var(--foreground)]/60 mt-2 font-medium">Manage the Nexus. Your actions are immediate.</p>
      </div>

      <div className="glass-panel p-8 rounded-3xl shadow-sm">
        <h2 className="text-2xl font-bold mb-2">Live Push Broadcast</h2>
        <p className="text-sm text-[var(--foreground)]/60 mb-8 font-medium">
          Push a 1-line Clement IfeOluwa quote or critical update to all students instantly.
        </p>
        
        <form onSubmit={handleBroadcast} className="space-y-6">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter broadcast message..."
            className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-2xl p-5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-40 font-medium"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold transition-colors shadow-md disabled:opacity-50"
          >
            {loading ? "Broadcasting..." : "Send Broadcast"} <Send size={20} />
          </button>
        </form>
      </div>

      <div className="glass-panel p-8 rounded-3xl shadow-sm space-y-6">
        <h2 className="text-2xl font-bold mb-2">User Management</h2>
        <p className="text-sm text-[var(--foreground)]/60 mb-6 font-medium">
          Search for users to manually verify them (free of charge).
        </p>

        <form onSubmit={handleSearchUser} className="flex gap-3">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="User Email..."
            className="flex-1 bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            required
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 px-4 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
          >
            {searchLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} Search
          </button>
        </form>

        {searchResult && (
          <div className="mt-6 p-6 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={searchResult.photoURL || `https://ui-avatars.com/api/?name=${searchResult.displayName}`} alt="Avatar" className="w-12 h-12 rounded-full" />
              <div>
                <div className="font-bold flex items-center gap-1">
                  {searchResult.displayName}
                  {searchResult.isVerified && <BadgeCheck size={16} className="text-blue-500" />}
                </div>
                <div className="text-sm text-[var(--foreground)]/60">{searchResult.email}</div>
              </div>
            </div>
            
            {!searchResult.isVerified ? (
              <button
                onClick={handleVerifyUser}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm"
              >
                <BadgeCheck size={16} /> Verify User
              </button>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-full">
                Verified
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
