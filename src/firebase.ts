import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, updateProfile } from 'firebase/auth'
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore'
import type { Store } from '@reduxjs/toolkit'
import { setAll } from './redux/slices/tasksSlice'
import { setAllProductivity } from './redux/slices/productivitySlice'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Start anonymous auth and sync the store with Firestore document `users/{uid}`
export async function startSync(store: Store) {
  // If Firebase config is missing (e.g. env vars not set), skip auth and syncing.
  const hasKey = !!firebaseConfig.apiKey && !!firebaseConfig.projectId
  if (!hasKey) {
    // helpful developer message to guide setup
    // eslint-disable-next-line no-console
    console.warn(
      'Firebase config missing or incomplete. Skipping Firestore sync.\n' +
        'Make sure to set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID in your .env file as described in the README.'
    )
    return
  }

  // Do not perform anonymous sign-in. Application requires explicit user sign-up/sign-in.

  onAuthStateChanged(auth, (user: User | null) => {
    if (!user) {
      // eslint-disable-next-line no-console
      console.log('onAuthStateChanged: no user signed in')
      return
    }
    const uid = user.uid
    const docRef = doc(db, 'users', uid)
    // eslint-disable-next-line no-console
    console.log(`onAuthStateChanged: signed-in uid=${uid}, doc=users/${uid}`)

    // Listen for remote changes and update Redux
    onSnapshot(docRef, (snapshot) => {
      const data = snapshot.data()
      if (!data) return
      // tasks may be saved either as an array or as an object with `items`.
      if (data.tasks) {
        const tasksPayload = Array.isArray(data.tasks) ? data.tasks : data.tasks.items || []
        store.dispatch(setAll(tasksPayload))
      }
      if (data.productivity) store.dispatch(setAllProductivity(data.productivity))
    })

    // Persist local changes back to Firestore
    let last = ''
    store.subscribe(() => {
      try {
        const s = JSON.stringify(store.getState())
        if (s === last) return
        last = s
        const state = store.getState() as any
        // write tasks.items (array) and productivity object
        const payload = { tasks: state.tasks?.items || [], productivity: state.productivity || {} }
        try {
          // Firestore rejects undefined values. Remove them by serializing/deserializing.
          const cleaned = JSON.parse(JSON.stringify(payload))
          setDoc(docRef, cleaned).catch((err) => {
            // eslint-disable-next-line no-console
            console.error('Failed to write user state to Firestore', err)
          })
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to prepare user state for Firestore', err)
        }
      } catch (e) {
        // ignore
      }
    })
  })
}

export { auth, db }

// Helpers for UI actions
export async function signUpWithEmail(email: string, password: string) {
  const res = await createUserWithEmailAndPassword(auth, email, password)
  try {
    // set a sensible displayName (use local-part of email)
    const local = email.split('@')[0]
    await updateProfile(res.user, { displayName: local })
  } catch (e) {
    // ignore profile update errors
  }
  return res
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  return signInWithPopup(auth, provider)
}

export function signOutUser() {
  return signOut(auth)
}
