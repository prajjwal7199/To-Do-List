import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import type { Store } from "@reduxjs/toolkit";
import { setAll } from "./redux/slices/tasksSlice";
import { setAllProductivity } from "./redux/slices/productivitySlice";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Start anonymous auth and sync the store with Firestore document `users/{uid}`
export async function startSync(store: Store) {
  // If Firebase config is missing (e.g. env vars not set), skip auth and syncing.
  const hasKey = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
  if (!hasKey) {
    // helpful developer message to guide setup
    // eslint-disable-next-line no-console
    console.warn(
      "Firebase config missing or incomplete. Skipping Firestore sync.\n" +
        "Make sure to set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID in your .env file as described in the README.",
    );
    return;
  }

  // Do not perform anonymous sign-in. Application requires explicit user sign-up/sign-in.

  onAuthStateChanged(auth, (user: User | null) => {
    if (!user) {
      // eslint-disable-next-line no-console
      console.log("onAuthStateChanged: no user signed in");
      return;
    }
    const uid = user.uid;
    const docRef = doc(db, "users", uid);
    // eslint-disable-next-line no-console
    console.log(`onAuthStateChanged: signed-in uid=${uid}, doc=users/${uid}`);

    // Track last server payload to avoid read/write loops
    let lastServerPayload = "";

    // Listen for remote changes and update Redux only when remote differs
    onSnapshot(docRef, (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      const tasksPayload = data.tasks
        ? Array.isArray(data.tasks)
          ? data.tasks
          : data.tasks.items || []
        : [];
      const productivityPayload = data.productivity || {};

      const serverPayload = {
        tasks: tasksPayload,
        productivity: productivityPayload,
      };
      const serverStr = JSON.stringify(serverPayload);

      // if server payload equals last known server payload, no-op
      if (serverStr === lastServerPayload) return;
      lastServerPayload = serverStr;

      // Only update Redux if local state differs from server
      try {
        const state = store.getState() as any;
        const localPayload = {
          tasks: state.tasks?.items || [],
          productivity: state.productivity || {},
        };
        const localStr = JSON.stringify(localPayload);
        if (localStr !== serverStr) {
          store.dispatch(setAll(tasksPayload));
          store.dispatch(setAllProductivity(productivityPayload));
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error comparing local and server state", e);
      }
    });

    // Persist local changes back to Firestore if they differ from last server payload.
    // Use a debounce to avoid rapid write loops on transient state changes.
    let writeTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleWrite = (payload: any, payloadStr: string) => {
      if (writeTimer) clearTimeout(writeTimer);
      writeTimer = setTimeout(() => {
        writeTimer = null;
        // optimistic update of lastServerPayload to avoid immediate loop
        lastServerPayload = payloadStr;
        try {
          const cleaned = JSON.parse(JSON.stringify(payload));
          setDoc(docRef, cleaned).catch((err) => {
            // eslint-disable-next-line no-console
            console.error("Failed to write user state to Firestore", err);
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Failed to prepare user state for Firestore", err);
        }
      }, 300);
    };

    store.subscribe(() => {
      try {
        const state = store.getState() as any;
        const payload = {
          tasks: state.tasks?.items || [],
          productivity: state.productivity || {},
        };
        const payloadStr = JSON.stringify(payload);
        if (payloadStr === lastServerPayload) return;
        scheduleWrite(payload, payloadStr);
      } catch (e) {
        // ignore
      }
    });
  });
}

export { auth, db };

// Helpers for UI actions
export async function signUpWithEmail(email: string, password: string) {
  const res = await createUserWithEmailAndPassword(auth, email, password);
  try {
    // set a sensible displayName (use local-part of email)
    const local = email.split("@")[0];
    await updateProfile(res.user, { displayName: local });
  } catch (e) {
    // ignore profile update errors
  }
  return res;
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export function signOutUser() {
  return signOut(auth);
}
