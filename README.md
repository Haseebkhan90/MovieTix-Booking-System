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

## Production (single URL)

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
