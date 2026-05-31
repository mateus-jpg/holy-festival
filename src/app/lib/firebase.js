import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasValue = (value) => Boolean(value && !value.startsWith('REPLACE_WITH_'));

const hasFirebaseConfig = Boolean(
  hasValue(firebaseConfig.apiKey) &&
  hasValue(firebaseConfig.authDomain) &&
  hasValue(firebaseConfig.projectId) &&
  hasValue(firebaseConfig.appId)
);

export const isFirebaseConfigured = hasFirebaseConfig;

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export const googleProvider = app ? new GoogleAuthProvider() : null;
export const facebookProvider = app ? new FacebookAuthProvider() : null;

export default app;
