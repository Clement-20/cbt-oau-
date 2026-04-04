import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { toast } from './Toast';
import { Loader2, Send } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

const BANNED_WORDS = ['spam', 'badword1', 'badword2'];

export default function WhisperFeed({ user }: { user: any }) {
  const [whispers, setWhispers] = useState<any[]>([]);
  const [newWhisper, setNewWhisper] = useState('');
  const [postCount, setPostCount] = useState(0);
  const [isPosting, setIsPosting] = useState(false);

  const DAILY_LIMIT = 5;
  const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  const getWhisperCount = () => {
    if (!user) return 0;
    const key = `whisper_count_${user.uid}`;
    const data = localStorage.getItem(key);
    
    if (!data) return 0;
    
    const { count, timestamp } = JSON.parse(data);
    const now = Date.now();
    
    // If 24 hours have passed, reset
    if (now - timestamp > RESET_INTERVAL_MS) {
      localStorage.removeItem(key);
      return 0;
    }
    
    return count;
  };

  const incrementWhisperCount = () => {
    if (!user) return;
    const key = `whisper_count_${user.uid}`;
    const newCount = getWhisperCount() + 1;
    localStorage.setItem(key, JSON.stringify({ count: newCount, timestamp: Date.now() }));
    setPostCount(newCount);
  };

  useEffect(() => {
    if (user) {
      setPostCount(getWhisperCount());
    }
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'whispers'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setWhispers(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'whispers');
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhisper.trim()) return;
    if (!user) {
      toast("Please sign in to whisper.");
      return;
    }
    if (postCount >= DAILY_LIMIT) {
      toast("Daily whisper limit reached! 🤫");
      return;
    }
    
    const containsBanned = BANNED_WORDS.some(word => newWhisper.toLowerCase().includes(word));
    if (containsBanned) {
      toast("Message contains forbidden content.");
      return;
    }

    setIsPosting(true);
    try {
      await addDoc(collection(db, 'whispers'), {
        text: newWhisper,
        timestamp: serverTimestamp(),
        author: user.displayName || 'Anonymous',
        authorUid: user.uid
      });
      setNewWhisper('');
      incrementWhisperCount();
      toast("Whisper sent! 🌬️");
    } catch (error) {
      console.error("Error posting whisper:", error);
      handleFirestoreError(error, OperationType.CREATE, 'whispers');
      toast("Failed to send whisper. Try again.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Nexus Whisper</h2>
        <span className="text-[10px] uppercase font-bold text-[var(--foreground)]/40 tracking-widest">
          {DAILY_LIMIT - postCount} whispers left today
        </span>
      </div>
      <div className="h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {whispers.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[var(--foreground)]/30 italic text-sm">
            No whispers yet. Be the first!
          </div>
        ) : (
          whispers.map(w => (
            <div key={w.id} className="bg-black/5 dark:bg-white/5 p-3 rounded-xl text-sm animate-in slide-in-from-bottom-2 duration-300">
              <span className="font-bold text-blue-500">{w.author}: </span>{w.text}
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
          value={newWhisper}
          onChange={(e) => setNewWhisper(e.target.value)}
          className="flex-1 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          placeholder="Whisper something..."
          disabled={isPosting}
        />
        <button 
          type="submit"
          disabled={isPosting || !newWhisper.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 flex items-center justify-center min-w-[80px]"
        >
          {isPosting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
