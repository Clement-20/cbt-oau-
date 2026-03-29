import React, { useState } from "react";
import { CloudUpload, CloudDownload, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { toast } from "../components/Toast";
import { motion, AnimatePresence } from "motion/react";

interface SyncButtonProps {
  storageKey: string;
  collectionName: string;
  onSyncComplete?: (data: any) => void;
}

export default function SyncButton({ storageKey, collectionName, onSyncComplete }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");

  const syncToCloud = async () => {
    if (!auth.currentUser) {
      toast("Please sign in to sync your data to the cloud.");
      return;
    }

    setIsSyncing(true);
    setSyncStatus("idle");

    try {
      const localData = localStorage.getItem(storageKey);
      if (!localData) {
        toast("No local data found to sync.");
        setIsSyncing(false);
        return;
      }

      const parsedData = JSON.parse(localData);
      await setDoc(doc(db, collectionName, auth.currentUser.uid), {
        ...parsedData,
        lastSynced: new Date().toISOString(),
        userId: auth.currentUser.uid
      });

      setSyncStatus("success");
      toast("Data synced to cloud successfully! ☁️");
      setTimeout(() => setSyncStatus("idle"), 3000);
    } catch (error) {
      console.error("Sync failed", error);
      setSyncStatus("error");
      toast("Failed to sync data. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const syncFromCloud = async () => {
    if (!auth.currentUser) {
      toast("Please sign in to fetch your cloud data.");
      return;
    }

    setIsSyncing(true);
    setSyncStatus("idle");

    try {
      const docSnap = await getDoc(doc(db, collectionName, auth.currentUser.uid));
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        localStorage.setItem(storageKey, JSON.stringify(cloudData));
        if (onSyncComplete) onSyncComplete(cloudData);
        setSyncStatus("success");
        toast("Cloud data restored to local storage! 📥");
        setTimeout(() => setSyncStatus("idle"), 3000);
      } else {
        toast("No cloud data found for your account.");
      }
    } catch (error) {
      console.error("Fetch failed", error);
      setSyncStatus("error");
      toast("Failed to fetch cloud data.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={syncToCloud}
        disabled={isSyncing}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
      >
        {isSyncing ? <Loader2 className="animate-spin" size={14} /> : <CloudUpload size={14} />}
        Sync to Cloud
      </button>
      
      <button
        onClick={syncFromCloud}
        disabled={isSyncing}
        className="flex items-center gap-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-blue-500/20"
      >
        {isSyncing ? <Loader2 className="animate-spin" size={14} /> : <CloudDownload size={14} />}
        Restore
      </button>

      <AnimatePresence>
        {syncStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="text-emerald-500"
          >
            <CheckCircle2 size={20} />
          </motion.div>
        )}
        {syncStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="text-red-500"
          >
            <AlertCircle size={20} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
