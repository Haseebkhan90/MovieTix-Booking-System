# MovieTix

Cinema booking app (BookMyShow-style) on **Firebase Auth + Cloud Firestore + Firebase Hosting**. No Node API, no SQL. Seats are held in Firestore so two people cannot buy the same seat.

## Local demo (no Firebase account)

Needs Node 20+ and Java 21+ (already used by the Firestore emulator).

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173

That command starts Auth + Firestore emulators, seeds movies/cinemas/shows, then Vite.

### Demo accounts (password `Ticket@123`)

| Email | Role |
|---|---|
| guest@movietix.app | Customer |
| admin@movietix.app | Cinema admin (India chain) |
| platform@movietix.app | Platform admin |

Promo: `BOOKNOW10`  
Test card: `4242 4242 4242 4242`

Cinema dashboard: http://127.0.0.1:5173/admin  
Emulator UI: http://127.0.0.1:4000

## Live site needs a real web API key

A hosted build (Vercel / Firebase Hosting) cannot log in with the dummy emulator key. That shows `auth/api-key-not-valid`. Paste the six `VITE_FIREBASE_*` values into `.env.local` (or the host’s env vars) and rebuild. Local `npm run dev` does not need them.



1. Open https://console.firebase.google.com and create a project (Spark / free plan is enough).
2. Build → **Authentication** → Get started → **Email/Password** → Enable.
3. Build → **Firestore Database** → Create database → start in **production mode** (rules in this repo will be deployed). Pick any region.
4. Build → **Hosting** → Get started (skip the CLI wizard if you want — we deploy from this repo).
5. Project settings (gear) → **Your apps** → add a **Web** app. Copy the `firebaseConfig` object.

Send these six values (paste as-is):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

6. Optional, for seeding the real database: Project settings → **Service accounts** → **Generate new private key**. Save the JSON as `serviceAccount.json` (do not commit it) and send it privately.

Then live deploy:

```bash
# put the six VITE_ values in .env.local
# VITE_USE_EMULATORS=false
firebase login
firebase use YOUR_PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json npm run seed
npm run deploy
```

Hosting URL will look like `https://YOUR_PROJECT_ID.web.app`.

## How data is stored

- `movies/{slug}` catalog
- `cinemas/{slug}` venues + city/currency
- `shows/{id}` showtimes (no pre-created seat docs)
- `shows/{id}/seats/{D-5}` written only when a seat is held or booked
- `bookings/{id}` confirmed tickets
- `users/{uid}` profile + role
- `promoCodes/BOOKNOW10`

Empty seat = available. A deterministic hash marks ~20% of seats as demo-sold so halls look live without 150k documents.

## Security

Firestore rules in `firestore.rules`: catalog is public-read; holds/bookings require Auth; admin queries require `TENANT_ADMIN` or `PLATFORM_ADMIN`.

Spark plan: no Cloud Functions. Checkout runs as a client Firestore transaction.
