# MovieTix Cloud

Multi-tenant cinema booking SaaS: customer app + cinema ops dashboard + booking API.

Cities ship with India, UAE, UK, and US inventory. Seats are held in the database (not the browser). Tickets belong to signed-in users.

## You need Node 20+ only

No separate Postgres, Redis, or backend knowledge required. SQLite is the default database so one command runs the whole product.

```bash
npm install
npm run db:setup
npm run dev
```

Open http://127.0.0.1:5173

### Demo accounts (password `Ticket@123`)

| Email | Role |
|---|---|
| guest@movietix.app | Customer |
| admin@movietix.app | Cinema admin (India chain) |
| platform@movietix.app | Platform admin |

Promo: `BOOKNOW10`  
Test card: `4242 4242 4242 4242`

## What runs

- **Web** Vite/React on `:5173` (proxies `/api` → API)
- **API** Fastify on `:4000`
- **DB** SQLite at `data/movietix.db` (Prisma)

Cinema dashboard: http://127.0.0.1:5173/admin

## Deploy on Railway

1. Open https://railway.com → **Login with GitHub**
2. **New project** → **Deploy from GitHub repo** → `MovieTix-Booking-System`
3. Pick branch `main` (merge PR #3 first if it is still open)
4. Wait for the first deploy. Then open the service → **Settings → Networking → Generate domain**
5. **Variables** tab → add:

```
NODE_ENV=production
JWT_SECRET=any-long-random-string
DATABASE_URL=file:../data/movietix.db
APP_URL=https://YOUR-APP.up.railway.app
```

Replace `APP_URL` with the domain Railway just generated. Save — it will redeploy.

6. **Volumes** → **Add volume** → mount path `/app/data`  
   (Iske bina tickets sleep/restart pe gayab ho sakti hain.)

Site: `https://YOUR-APP.up.railway.app`  
Admin: `https://YOUR-APP.up.railway.app/admin`  
Login: `guest@movietix.app` / `Ticket@123`

Railway new accounts ko trial credit milta hai (~$5). Woh khatam hone ke baad card lagta hai. Turso/Vercel ke muqable yeh “always free” nahi, lekin setup Vercel jaisa simple hai aur Node API yahan sahi chalti hai.

---

## Deploy for free on Vercel (like a static site)

Vercel cannot keep a SQLite *file*, so production uses **Turso** — free SQLite in the cloud (GitHub login). Hosting stays on Vercel Hobby (free).

### 1. Create a free Turso database (~2 min)

1. Open https://turso.tech → **Sign in with GitHub**
2. **Create Database** → name `movietix` → region close to you
3. Copy **LibSQL URL** (`libsql://…turso.io`)
4. Create a token: dashboard → database → **Tokens** → **Create token** → copy it

### 2. Put secrets on Vercel

Vercel project (this GitHub repo) → **Settings → Environment Variables** → Production:

| Name | Value |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://….turso.io` |
| `TURSO_AUTH_TOKEN` | the token |
| `JWT_SECRET` | any long random string |
| `APP_URL` | `https://YOUR-PROJECT.vercel.app` |
| `NODE_ENV` | `production` |

### 3. Deploy

Push `main` (or merge the Cloud PR). Vercel builds, creates tables, seeds movies, and gives you a public URL.

Same demo logins: `guest@movietix.app` / `Ticket@123`

First load can take ~10s (serverless cold start). After that it feels like a normal Vercel app.

---

## Local production build

```bash
npm run db:setup
npm run build
npm start
```

Then open http://127.0.0.1:4000 — the API serves the built web app.

Docker:

```bash
docker build -t movietix .
docker run -p 4000:4000 -v movietix-data:/app/data movietix
```

Set `JWT_SECRET` in production. Payments are currently authorized in demo mode after Luhn-valid cards; plug Stripe/Razorpay into `POST /api/checkout` when you have keys.

## API map

- `POST /api/auth/register` `POST /api/auth/login` `POST /api/auth/logout` `GET /api/me`
- `GET /api/meta` `GET /api/movies` `GET /api/movies/:slug/showtimes`
- `GET /api/shows/:id/seats` `POST /api/holds` `POST /api/checkout`
- `GET /api/tickets`
- `GET /api/admin/overview` `GET /api/admin/bookings` `GET /api/admin/shows`
