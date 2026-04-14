import { doc, getDoc, updateDoc, increment, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const NEXUS_DAILY_LIMIT = 10;

export interface NexusQuota {
  dailyTokenCount: number;
  lastTokenReset: string;
}

export interface NexusStreak {
  currentStreak: number;
  lastActiveDate: string;
}

/**
 * Checks if the user has enough "Nexus Energy" (tokens) for an AI interaction.
 * Resets the count if it's a new day.
 */
export async function checkAndUseNexusEnergy(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return { allowed: false, remaining: 0 };
  
  const data = userSnap.data();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  let dailyTokenCount = data.dailyTokenCount || 0;
  let lastTokenReset = data.lastTokenReset || today;
  
  // Reset if it's a new day
  if (lastTokenReset !== today) {
    dailyTokenCount = 0;
    lastTokenReset = today;
    await updateDoc(userRef, {
      dailyTokenCount: 0,
      lastTokenReset: today
    });
  }
  
  if (dailyTokenCount >= NEXUS_DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  // Increment token count
  await updateDoc(userRef, {
    dailyTokenCount: increment(1)
  });
  
  return { allowed: true, remaining: NEXUS_DAILY_LIMIT - (dailyTokenCount + 1) };
}

/**
 * Updates the user's study streak.
 */
export async function updateNexusStreak(userId: string): Promise<number> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return 0;
  
  const data = userSnap.data();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lastActiveDate = data.lastActiveDate || "";
  
  if (lastActiveDate === today) return data.currentStreak || 0;
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  let newStreak = 1;
  if (lastActiveDate === yesterdayStr) {
    newStreak = (data.currentStreak || 0) + 1;
  }
  
  const updates: any = {
    currentStreak: newStreak,
    lastActiveDate: today
  };
  
  // Reward: Consistency badge at 5-day streak
  if (newStreak >= 5) {
    const badges = data.badges || [];
    if (!badges.includes("Consistency")) {
      updates.badges = [...badges, "Consistency"];
      // Also trigger a broadcast for this achievement
      await setDoc(doc(db, "broadcasts", `streak_${userId}_${Date.now()}`), {
        message: `🔥 ${data.displayName || 'A student'} just hit a 5-day study streak! Consistency is key!`,
        timestamp: new Date(),
        type: "achievement"
      });
    }
  }
  
  await updateDoc(userRef, updates);
  return newStreak;
}
