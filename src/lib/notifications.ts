import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "../components/Toast";
import { useEffect } from "react";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";

export const triggerNotification = async (userId: string, message: string, type: 'followed' | 'new_resource') => {
  const path = "notifications";
  try {
    await addDoc(collection(db, path), {
      userId,
      message,
      type,
      timestamp: serverTimestamp(),
      read: false
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, path);
  }
};

export const useNotifications = (userId?: string) => {
  useEffect(() => {
    if (!userId) return;

    const path = "notifications";
    const q = query(
      collection(db, path),
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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [userId]);
};
