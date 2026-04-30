import { collection, addDoc, doc, writeBatch, limit, getDocs, updateDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "../components/Toast";
import { useEffect } from "react";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
}

export const sendDevicePing = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200]
    });
  }
};

export const triggerNotification = async (userId: string, title: string, message: string, type: string) => {
  const path = "notifications";
  try {
    await addDoc(collection(db, path), {
      userId,
      title,
      message,
      type,
      timestamp: serverTimestamp(),
      read: false
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, path);
  }
};

export const markNotificationRead = async (id: string) => {
  try {
    await updateDoc(doc(db, "notifications", id), { read: true });
  } catch(e) {
    handleFirestoreError(e, OperationType.UPDATE, `notifications/${id}`);
  }
};

export const notifyFollowers = async (uploaderId: string, uploaderName: string, title: string, message: string, type: string) => {
  try {
    const followersQ = query(collection(db, "users"), where("followedUploaders", "array-contains", uploaderId), limit(500));
    const snapshot = await getDocs(followersQ);
    if (snapshot.empty) return;
    
    const batch = writeBatch(db);
    let count = 0;
    
    snapshot.forEach((userDoc) => {
      const notifRef = doc(collection(db, "notifications"));
      batch.set(notifRef, {
        userId: userDoc.id,
        title,
        message,
        type,
        read: false,
        timestamp: serverTimestamp() // Using serverTimestamp instead of createdAt for consistency
      });
      count++;
    });
    
    if (count > 0) await batch.commit();
  } catch (error) {
    console.error("Failed to notify followers:", error);
  }
};

export const useNotifications = (userId?: string) => {
  useEffect(() => {
    // Request permission whenever the hook is active (often good in PWAs instead of button)
    requestNotificationPermission();

    if (!userId) return;

    const path = "notifications";
    const q = query(
      collection(db, path),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    let isInitialLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          
          // Show toast for everything
          toast(data.message);
          
          // Only ping device if it's a new notification natively arriving 
          // (not initial batch on load, unless they're new anyway, but to prevent spam on reload we check isInitialLoad)
          if (!isInitialLoad && !change.doc.metadata.hasPendingWrites) {
            sendDevicePing(data.title || "New Notification", data.message);
          }
        }
      });
      isInitialLoad = false;
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    // Also listen to admin broadcasts
    const broadcastQ = query(collection(db, "broadcasts"), limit(10));
    let isBroadInit = true;
    const unsubBroad = onSnapshot(broadcastQ, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (!isBroadInit && !change.doc.metadata.hasPendingWrites) {
            const title = "Admin Broadcast 📣";
            toast(`Broadcast: ${data.message}`);
            sendDevicePing(title, data.message);
          }
        }
      });
      isBroadInit = false;
    });

    return () => {
      unsubscribe();
      unsubBroad();
    };
  }, [userId]);
};
