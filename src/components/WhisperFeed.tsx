import React, { useState, useEffect } from 'react';
import { rtdb } from '../firebase';
import { ref, push, onValue, query, limitToLast, orderByChild } from 'firebase/database';

const BANNED_WORDS = ['spam', 'badword1', 'badword2'];

export default function WhisperFeed({ user }: { user: any }) {
  const [whispers, setWhispers] = useState<any[]>([]);
  const [newWhisper, setNewWhisper] = useState('');
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    const whispersRef = query(ref(rtdb, 'whispers'), limitToLast(50));
    const unsubscribe = onValue(whispersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
        setWhispers(list.reverse());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postCount >= 5) {
      alert("Limit reached for today!");
      return;
    }
    
    const containsBanned = BANNED_WORDS.some(word => newWhisper.toLowerCase().includes(word));
    if (containsBanned) {
      alert("Message contains forbidden content.");
      return;
    }

    await push(ref(rtdb, 'whispers'), {
      text: newWhisper,
      timestamp: Date.now(),
      author: user.displayName || 'Anonymous'
    });
    setNewWhisper('');
    setPostCount(prev => prev + 1);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <h2 className="text-xl font-bold">Nexus Whisper</h2>
      <div className="h-64 overflow-y-auto space-y-2">
        {whispers.map(w => (
          <div key={w.id} className="bg-black/5 dark:bg-white/5 p-3 rounded-xl text-sm">
            <span className="font-bold">{w.author}: </span>{w.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
          value={newWhisper}
          onChange={(e) => setNewWhisper(e.target.value)}
          className="flex-1 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)]"
          placeholder="Whisper something..."
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl">Post</button>
      </form>
    </div>
  );
}
