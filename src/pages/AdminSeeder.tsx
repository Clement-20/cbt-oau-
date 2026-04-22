import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { ShieldCheck, Database, Send, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast } from "../components/Toast";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";

export default function AdminSeeder({ user, dbUser }: { user: any, dbUser?: any }) {
  const [jsonData, setJsonData] = useState("");
  const [collectionName, setCollectionName] = useState("courses");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  const isAdmin = dbUser?.email === "banmekeifeoluwa@gmail.com";

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <AlertTriangle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Restricted Area</h1>
        <p className="text-[var(--foreground)]/60">This page is only accessible to the lead developer.</p>
      </div>
    );
  }

  const handleSeed = async () => {
    if (!jsonData.trim()) {
      toast("Please paste some JSON data first!");
      return;
    }

    setIsProcessing(true);
    setResults({ success: 0, failed: 0 });

    try {
      const data = JSON.parse(jsonData);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        try {
          // Use course code or id as document ID if available
          const docId = item.code || item.id || item.courseCode || `seed_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          
          await setDoc(doc(db, collectionName, docId), {
            ...item,
            updatedAt: serverTimestamp(),
            seededAt: serverTimestamp()
          });
          
          setResults(prev => ({ ...prev, success: prev.success + 1 }));
        } catch (err) {
          console.error("Error seeding item:", err);
          setResults(prev => ({ ...prev, failed: prev.failed + 1 }));
        }
      }

      toast(`Seeding complete! Success: ${items.length} items processed.`);
    } catch (error) {
      console.error("Invalid JSON:", error);
      toast("Invalid JSON format. Please check your data.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Helmet>
        <title>Database Seeder | Admin</title>
      </Helmet>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-600/10 rounded-2xl">
          <Database className="text-red-600" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Seeder</h1>
          <p className="text-[var(--foreground)]/50">Push bulk academic data directly to Firestore.</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 opacity-60 uppercase tracking-wider">Target Collection</label>
            <input 
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
            />
          </div>
          <div className="flex items-end">
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl px-4 py-3 w-full flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
              <ShieldCheck size={18} />
              Authenticated as Lead Dev
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 opacity-60 uppercase tracking-wider">JSON Payload (Array or Object)</label>
          <textarea 
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            placeholder='[ { "code": "GST 111", "title": "Use of English", "category": "GST", "questions": [...] } ]'
            className="w-full h-96 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-xs leading-relaxed"
          ></textarea>
        </div>

        <button 
          onClick={handleSeed}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" />
              <span>Processing JSON Data...</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>Push to Firestore</span>
            </>
          )}
        </button>

        {results.success > 0 || results.failed > 0 ? (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
              <CheckCircle2 size={18} />
              {results.success} Success
            </div>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
              <AlertTriangle size={18} />
              {results.failed} Failed
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8 p-6 glass-panel rounded-3xl">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-yellow-500" />
          Critical Security Notice
        </h3>
        <ul className="text-sm text-[var(--foreground)]/60 space-y-2 list-disc pl-5">
          <li>This tool uses <code className="bg-black/10 dark:bg-white/10 px-1 rounded text-red-500">setDoc</code> which overwrites existing data with same IDs.</li>
          <li>Ensure your categories (e.g., "Post-UTME") are spelled correctly to respect guest filtering.</li>
          <li>For the CBT engine, ensure the JSON includes a <code className="bg-black/10 dark:bg-white/10 px-1 rounded text-blue-500">questions</code> array.</li>
        </ul>
      </div>
    </div>
  );
}
