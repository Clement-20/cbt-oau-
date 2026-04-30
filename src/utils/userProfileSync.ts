import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "./errorHandling";

export async function syncDisplayNameEverywhere(userId: string, newDisplayName: string) {
  if (!userId || !newDisplayName) return;

  try {
    let batch = writeBatch(db);
    let batchCount = 0;

    const commitBatchIfNeeded = async () => {
      if (batchCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    };

    // 1. Update resources
    const resourcesRef = collection(db, "resources");
    const qResources = query(resourcesRef, where("userId", "==", userId));
    const resourcesSnap = await getDocs(qResources);
    for (const docSnap of resourcesSnap.docs) {
      batch.update(docSnap.ref, { uploadedBy: newDisplayName });
      batchCount++;
      await commitBatchIfNeeded();
    }

    // 2. Update community_reviews
    const reviewsRef = collection(db, "community_reviews");
    const qReviews = query(reviewsRef, where("userId", "==", userId));
    const reviewsSnap = await getDocs(qReviews);
    for (const docSnap of reviewsSnap.docs) {
      batch.update(docSnap.ref, { userName: newDisplayName });
      batchCount++;
      await commitBatchIfNeeded();
    }

    // 3. Update reports
    const reportsRef = collection(db, "reports");
    const qReports = query(reportsRef, where("reportedBy", "==", userId));
    const reportsSnap = await getDocs(qReports);
    for (const docSnap of reportsSnap.docs) {
      batch.update(docSnap.ref, { reporterName: newDisplayName });
      batchCount++;
      await commitBatchIfNeeded();
    }

    // 4. Update test_results
    const testResultsRef = collection(db, "test_results");
    const qTestResults = query(testResultsRef, where("userId", "==", userId));
    const testResultsSnap = await getDocs(qTestResults);
    for (const docSnap of testResultsSnap.docs) {
      batch.update(docSnap.ref, { userName: newDisplayName });
      batchCount++;
      await commitBatchIfNeeded();
    }

    // 5. Update pending_questions
    const pendingQuestionsRef = collection(db, "pending_questions");
    const qPendingQuestions = query(pendingQuestionsRef, where("authorId", "==", userId));
    const pendingSnap = await getDocs(qPendingQuestions);
    for (const docSnap of pendingSnap.docs) {
      batch.update(docSnap.ref, { authorName: newDisplayName });
      batchCount++;
      await commitBatchIfNeeded();
    }

    if (batchCount > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error("Failed to sync display name everywhere:", error);
    // Silent catch, as this is a background sync 
  }
}
