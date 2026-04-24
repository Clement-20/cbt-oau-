import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "../components/Toast";
import { useEffect } from "react";

export const triggerNotification = async (userId: string, message: string, type: 'followed' | 'new_resource') => {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      message,
      type,
      timestamp: serverTimestamp(),
      read: false
    });
  } catch (e) {
    console.error("Failed to trigger notification", e);
  }
};

export const useNotifications = (userId?: string) => {
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          toast(data.message);
        }
      });
    });

    return () => unsubscribe();
  }, [userId]);
};
