/**
 * Client-side Firebase initialization: configures the web app and exports the Auth instance for login/sign-up flows.
 */
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  ...(typeof process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL.length > 0
    ? { databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL }
    : {}),
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

/** Realtime Database (optional): set `NEXT_PUBLIC_FIREBASE_DATABASE_URL` (same as backend `FIREBASE_DB_URL`) for live chat sync. */
export const database =
  typeof process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL.length > 0
    ? getDatabase(app)
    : null