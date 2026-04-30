import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "./errorHandling";

export async function toggleFollowInFirestore(currentUid: string, targetUid: string, isFollowing: boolean) {
  if (!currentUid || !targetUid || currentUid === targetUid) return;

  try {
    const userRef = doc(db, "users", currentUid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return;
    
    await updateDoc(userRef, {
      followedUploaders: isFollowing ? arrayRemove(targetUid) : arrayUnion(targetUid)
    });
  } catch (error) {
    console.error("Failed to sync follow status in Firestore:", error);
    handleFirestoreError(error, OperationType.UPDATE, `users/${currentUid}`);
  }
}
