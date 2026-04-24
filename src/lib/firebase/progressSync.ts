/**
 * progressSync.ts — Client-side Firestore progress helpers.
 *
 * awardXP: Atomically increments the user's xp field and totalTopicsMastered
 * counter using Firestore's server-side increment() — no read needed, no race
 * conditions, safe for concurrent updates.
 *
 * @see ARCHITECTURE.md §2.3 — users schema (xp, totalTopicsMastered fields)
 */

import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

/**
 * Award XP to a user and increment their totalTopicsMastered counter.
 *
 * Uses Firestore's atomic increment() so concurrent calls from different
 * devices never overwrite each other — safe for offline-first apps.
 *
 * @param uid       - Firebase Auth UID of the student.
 * @param xpAmount  - Number of XP points to add (e.g. 50 for a perfect score).
 * @throws          - Rethrows Firestore errors for the caller to handle.
 */
export async function awardXP(uid: string, xpAmount: number): Promise<void> {
  if (!db) {
    throw new Error("[progressSync] Firestore is not initialized.");
  }

  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    // ── Atomic server-side increment — never causes read-modify-write races ──
    xp: increment(xpAmount),
    totalTopicsMastered: increment(1),
  });
}
