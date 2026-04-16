/**
 * Google SSO authentication helpers.
 *
 * v2: Phone OTP has been removed entirely. Google Sign-In is unlimited
 * on the Firebase Spark (free) plan — no per-auth cost.
 *
 * @see ARCHITECTURE.md §4.4 — src/lib/firebase/auth.ts
 */

import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, googleProvider, db } from "./config";

/**
 * Sign in with Google via popup. Creates a new Firestore user doc
 * on first login; updates `lastActiveAt` for returning users.
 */
export async function signInWithGoogle(): Promise<User> {
  if (!auth || !googleProvider || !db) {
    throw new Error("Firebase not initialized. Check your .env.local configuration.");
  }

  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Check if user exists in Firestore
  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    // First-time user — create base document, redirect to onboarding
    await setDoc(userRef, {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      googleUid: user.uid,
      role: "student", // Default role; admin can promote to teacher
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      onboardingComplete: false,
      streakCount: 0,
      xp: 0,
      diagnosticComplete: false,
    });
  } else {
    // Returning user — update lastActiveAt
    await setDoc(userRef, { lastActiveAt: serverTimestamp() }, { merge: true });
  }

  return user;
}

/**
 * Sign out the current user.
 */
export async function signOutUser(): Promise<void> {
  if (!auth) {
    throw new Error("Firebase not initialized. Check your .env.local configuration.");
  }
  await signOut(auth);
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    // During SSR / build, return a no-op unsubscribe
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
