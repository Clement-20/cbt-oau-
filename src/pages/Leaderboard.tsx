import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { db } from "../firebase";
import { Trophy, Medal, Award, Flame } from "lucide-react";
import NexusBadge from "../components/NexusBadge";
import { Helmet } from "react-helmet-async";

const LeaderboardRow = React.memo(({ leader, index }: { leader: any, index: number }) => {
  return (
    <div className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
      <div className="col-span-2 flex justify-center">
        {index === 0 ? <Trophy className="text-yellow-500 drop-shadow-md" size={28} /> :
         index === 1 ? <Medal className="text-slate-400 drop-shadow-md" size={28} /> :
         index === 2 ? <Award className="text-amber-700 drop-shadow-md" size={28} /> :
         <span className="font-mono text-lg font-bold text-[var(--foreground)]/30">#{index + 1}</span>}
      </div>
      <div className="col-span-6 flex items-center gap-4">
        <img src={leader.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.uid}`} alt={leader.displayName} loading="lazy" decoding="async" className="w-12 h-12 rounded-full border border-[var(--border)] shadow-sm" />
        <div>
          <div className="font-bold text-base flex items-center gap-1">
            {leader.displayName}
            <NexusBadge isVerified={leader.isVerified} badgeType={leader.badgeType} isShana={leader.isShana} />
          </div>
          <div className="text-xs font-medium text-[var(--foreground)]/50 uppercase tracking-wider">{leader.role}</div>
        </div>
      </div>
      <div className="col-span-4 flex justify-end items-center gap-2 font-mono text-xl font-bold text-amber-600 dark:text-amber-400">
        <Flame size={18} className="text-orange-500" />
        {leader.xp || 0}
      </div>
    </div>
  );
});

export default function Leaderboard({ user }: { user: any }) {
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
      const users: any[] = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setLeaders(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "users");
    });
    return () => unsub();
  }, [user]);

  if (!user) {
    return <div className="text-center py-20 text-[var(--foreground)]/60 font-medium">Sign in to access the Leaderboard.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Helmet>
        <title>Leaderboard | ICEPAB Nexus</title>
        <meta name="description" content="View the top-performing OAU students on the ICEPAB Nexus Leaderboard." />
      </Helmet>
      <div>
        <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
          <Trophy className="text-amber-500" /> Leaderboard
        </h1>
        <p className="text-[var(--foreground)]/60 mt-2 font-medium">Real-time rankings based on Study Time & CBT performance.</p>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-5 border-b border-[var(--border)] bg-black/5 dark:bg-white/5 text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-widest">
          <div className="col-span-2 text-center">Rank</div>
          <div className="col-span-6">Student</div>
          <div className="col-span-4 text-right">Study Points (XP)</div>
        </div>
        
        <div className="divide-y divide-[var(--border)]">
          {leaders.map((leader, index) => (
            <LeaderboardRow key={leader.id} leader={leader} index={index} />
          ))}
          {leaders.length === 0 && (
            <div className="p-10 text-center text-[var(--foreground)]/50 font-medium">No data available yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
