/**
 * Firestore User Sync — Creates or updates a user document on login.
 *
 * Called after a successful Google Sign-In. On first login, creates
 * the base `users/{uid}` document with default fields matching the
 * Firestore schema. On subsequent logins, updates `lastActiveAt`.
 *
 * @see ARCHITECTURE.md §2.3 — `users` collection schema
 */

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./config";

/**
 * Sync a Firebase Auth user to Firestore.
 *
 * - If `users/{uid}` does NOT exist → create with default student fields.
 * - If it exists → update `lastActiveAt` only.
 */
export async function syncUserToFirestore(user: User): Promise<void> {
  if (!db) {
    console.warn("[userSync] Firestore not initialized — skipping sync.");
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    // ─── First-time user: create base document ───
    await setDoc(userRef, {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      googleUid: user.uid,
      role: "student",
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      onboardingComplete: false,
      streakCount: 0,
      streakLastDate: null,
      xp: 0,
      diagnosticComplete: false,
      totalTopicsMastered: 0,
      totalPracticeAttempts: 0,
      weakTopics: [],
    });
  } else {
    // ─── Returning user: update lastActiveAt ───
    await setDoc(
      userRef,
      { lastActiveAt: serverTimestamp() },
      { merge: true }
    );
  }
}
