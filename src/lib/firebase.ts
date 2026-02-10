import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
    initializeFirestore,
    memoryLocalCache,
    getFirestore,
    Firestore
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getFunctions, Functions } from "firebase/functions";

// REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (Singleton pattern)
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);

// Initialize Firestore
// CRITICAL: We strictly use memoryLocalCache to avoid "Unexpected state" errors
// caused by corrupted IndexedDB in the browser.
let db: Firestore;

try {
    // Attempt to initialize with specific settings
    // This throws if Firestore is already initialized (e.g. during HMR)
    db = initializeFirestore(app, {
        localCache: memoryLocalCache(),
    });
} catch (e) {
    // If already initialized, use the existing instance
    console.warn("Firestore already initialized, using existing instance.");
    db = getFirestore(app);
}

export { db };
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);
