import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, writeBatch, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "./errorHandling";

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  
  return false;
}

export function sendDevicePing(title: string, options?: NotificationOptions) {
  if (Notification.permission === "granted") {
    // Add default icon if not provided
    const notifyOptions: NotificationOptions = {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200],
      ...options
    };
    new Notification(title, notifyOptions);
  }
}

export function listenToNotifications(userId: string, onNewNotification: (title: string, message: string) => void) {
  const q = query(
    collection(db, "notifications"), 
    where("userId", "==", userId),
    where("read", "==", false)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      // Only ping for newly added notifications while the user is listening
      if (change.type === "added") {
        const data = change.doc.data();
        // Just checking if it has a valid time to distinguish initial load vs new if needed,
        // but simple docChanges 'added' is enough for most cases.
        // If it comes from server (not local write) ping them
        if (!change.doc.metadata.hasPendingWrites) {
          onNewNotification(data.title, data.message);
        }
      }
    });
  }, (error) => {
    console.error("Notifications Listener Error:", error);
  });
}

// Same for Admin broadcasts
export function listenToBroadcasts(onNewBroadcast: (title: string, message: string) => void) {
  const q = query(collection(db, "broadcasts"), limit(10));
  let isInitialLoad = true;
  
  return onSnapshot(q, (snapshot) => {
    if (isInitialLoad) {
      isInitialLoad = false;
      return; 
    }
    
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        if (!change.doc.metadata.hasPendingWrites) {
          onNewBroadcast("Campus Admin Broadcast", data.message);
        }
      }
    });
  });
}

export async function createNotification(userId: string, title: string, message: string, type: string) {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function notifyFollowersOfUpload(uploaderId: string, uploaderName: string, resourceTitle: string) {
  try {
    const followersQ = query(
      collection(db, "users"), 
      where("followedUploaders", "array-contains", uploaderId),
      limit(500)
    );
    
    const snapshot = await getDocs(followersQ);
    if (snapshot.empty) return;
    
    const batch = writeBatch(db);
    let count = 0;
    
    snapshot.forEach((userDoc) => {
      const notifRef = doc(collection(db, "notifications"));
      batch.set(notifRef, {
        userId: userDoc.id,
        title: "New Material Uploaded! 📚",
        message: `${uploaderName} just uploaded "${resourceTitle}". Check it out!`,
        type: "upload",
        read: false,
        createdAt: new Date().toISOString()
      });
      count++;
    });
    
    if (count > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error("Failed to notify followers:", error);
  }
}

export async function markNotificationRead(notifId: string) {
  try {
    await updateDoc(doc(db, "notifications", notifId), {
      read: true
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notifId}`);
  }
}
