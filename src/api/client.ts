export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const toApiError = (err: unknown): ApiError => {
  if (err instanceof ApiError) return err;
  const code = (err as { code?: string }).code;
  if (code === 'auth/email-already-in-use') return new ApiError(409, 'An account with this email already exists');
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return new ApiError(401, 'Invalid email or password');
  }
  if (code === 'auth/weak-password') return new ApiError(400, 'Password must be at least 8 characters');
  if (code === 'auth/too-many-requests') return new ApiError(429, 'Too many attempts. Try again in a minute.');
  const message = err instanceof Error ? err.message : '';
  if (
    code === 'auth/invalid-api-key' ||
    code?.includes('api-key-not-valid') ||
    message.toLowerCase().includes('api-key-not-valid') ||
    message.toLowerCase().includes('invalid-api-key')
  ) {
    return new ApiError(
      401,
      'Firebase API key is missing. Local: run npm run dev. Live: add the six VITE_FIREBASE_* values from Firebase console → Project settings → Your apps.'
    );
  }
  if (code === 'permission-denied') return new ApiError(403, 'You do not have access to that');
  if (code === 'unavailable') return new ApiError(503, 'Firestore is starting up — wait a second and refresh.');
  return new ApiError(500, err instanceof Error ? err.message : 'Request failed');
};

export const formatMoney = (amountMinor: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'INR' ? 0 : 2,
  }).format(amountMinor / 100);
