import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export const getSettings = async () => {
  const settingsRef = doc(db, "settings", "global");
  const settingsSnap = await getDoc(settingsRef);
  if (settingsSnap.exists()) {
    return settingsSnap.data();
  }
  return { isPaymentEnabled: true };
};

export const subscribeToSettings = (callback: (settings: any) => void) => {
  const settingsRef = doc(db, "settings", "global");
  return onSnapshot(settingsRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback({ isPaymentEnabled: true });
    }
  });
};

export const updateSettings = async (settings: { [key: string]: any }) => {
  const settingsRef = doc(db, "settings", "global");
  await setDoc(settingsRef, settings, { merge: true });
};
