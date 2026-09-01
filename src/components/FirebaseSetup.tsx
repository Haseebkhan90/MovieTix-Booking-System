import { hasFirebaseConfig } from '../lib/firebase';

/** Shown when a production build has no real Firebase web API key. */
export const FirebaseSetup = () => {
  if (hasFirebaseConfig) return null;

  return (
    <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <p className="mx-auto max-w-7xl">
        Firebase API key missing — login cannot hit Google with a dummy key. Local demo:{' '}
        <code className="text-white">npm run dev</code> (emulators). Live site: paste the six{' '}
        <code className="text-white">VITE_FIREBASE_*</code> values from Firebase console → Project
        settings → Your apps.
      </p>
    </div>
  );
};
