import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";

export const getSettings = async () => {
  const path = "settings/global";
  try {
    const settingsRef = doc(db, "settings", "global");
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      return settingsSnap.data();
    }
    return { isPaymentEnabled: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const subscribeToSettings = (callback: (settings: any) => void) => {
  const path = "settings/global";
  const settingsRef = doc(db, "settings", "global");
  return onSnapshot(settingsRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback({ isPaymentEnabled: true });
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const updateSettings = async (settings: { [key: string]: any }) => {
  const path = "settings/global";
  try {
    const settingsRef = doc(db, "settings", "global");
    await setDoc(settingsRef, settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
