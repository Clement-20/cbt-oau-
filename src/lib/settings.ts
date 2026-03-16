import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export const getSettings = async () => {
  const settingsRef = doc(db, "settings", "global");
  const settingsSnap = await getDoc(settingsRef);
  if (settingsSnap.exists()) {
    return settingsSnap.data();
  }
  return { isPaymentEnabled: true };
};

export const updateSettings = async (settings: { isPaymentEnabled: boolean }) => {
  const settingsRef = doc(db, "settings", "global");
  await updateDoc(settingsRef, settings);
};
