/**
 * Firebase Client SDK initialization with Offline Persistence.
 *
 * Uses the modern `persistentLocalCache` API (not the deprecated
 * `enableIndexedDbPersistence`) so cached lesson content, flashcards,
 * and dashboard progress remain accessible on patchy mobile networks.
 *
 * Guarded against missing env vars so `next build` doesn't crash
 * during static page pre-rendering (SSR).
 *
 * @see ARCHITECTURE.md §4.4 — Firebase Client Initialization with Offline Persistence
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
  type Firestore,
} from "firebase/firestore";

// ─── Firebase Config (from NEXT_PUBLIC env vars — safe to expose) ───
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ─── Guard: skip initialization when env vars are missing (build-time SSR) ───
const isMissingConfig = !firebaseConfig.apiKey || !firebaseConfig.projectId;

// ─── Singleton Initialization ───
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let googleProvider: GoogleAuthProvider | undefined;

if (!isMissingConfig) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  // ─── AUTH: Google SSO ───
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: "select_account", // Always show account picker
  });

  // ─── FIRESTORE: With Offline Persistence ───
  // Uses the modern persistent cache API (replaces deprecated enableIndexedDbPersistence).
  // Enables:
  //   ✅ Cached lessons readable offline
  //   ✅ Flashcard deck review offline
  //   ✅ Dashboard shows last-synced state
  //   ✅ Offline writes auto-sync on reconnect
  //   ✅ Multiple browser tabs — no lock errors
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    }),
  });
}

export { app, auth, googleProvider, db };
