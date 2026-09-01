import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const trimEnv = (value: string | undefined) => (value ?? '').trim().replace(/^['"]|['"]$/g, '');

const envApiKey = trimEnv(import.meta.env.VITE_FIREBASE_API_KEY);
const envProjectId = trimEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID) || 'demo-movietix';

/** Real Google API keys look like AIza… (39 chars). Dummy strings hit production and fail. */
export const hasRealFirebaseKey = /^AIza[0-9A-Za-z_-]{20,}$/.test(envApiKey);

const emulatorFlag = trimEnv(import.meta.env.VITE_USE_EMULATORS).toLowerCase();

export const usingEmulators =
  emulatorFlag === 'true' || (import.meta.env.DEV && emulatorFlag !== 'false' && !hasRealFirebaseKey);

export const hasFirebaseConfig = usingEmulators || hasRealFirebaseKey;

const firebaseConfig = {
  apiKey: hasRealFirebaseKey ? envApiKey : 'fake-api-key',
  authDomain: trimEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || `${envProjectId}.firebaseapp.com`,
  projectId: envProjectId,
  storageBucket: trimEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || `${envProjectId}.appspot.com`,
  messagingSenderId: trimEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || '0',
  appId: trimEnv(import.meta.env.VITE_FIREBASE_APP_ID) || '1:0:web:demo',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const g = globalThis as unknown as { __MOVIETIX_EMU__?: boolean };

if (usingEmulators && !g.__MOVIETIX_EMU__) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  g.__MOVIETIX_EMU__ = true;
}
