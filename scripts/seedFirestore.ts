import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp, getFirestore, type DocumentData, type DocumentReference, type Firestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync } from 'node:fs';
import { catalog } from '../prisma/catalog.ts';

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID || 'demo-movietix';
const DEMO_PASSWORD = 'Ticket@123';
const TIMES = ['10:00', '13:15', '16:30', '19:45', '22:30'];

const priceFor = (inr: number, currency: string) => {
  if (currency === 'INR') return inr * 100;
  if (currency === 'AED') return Math.round(inr * 18);
  if (currency === 'GBP') return Math.round(inr * 4.2);
  return Math.round(inr * 4.8);
};

const localToUtc = (ymd: string, hm: string, offsetMinutes: number) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const [hh, mm] = hm.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - offsetMinutes * 60 * 1000);
};

const ymd = (date: Date, offsetMinutes: number) => {
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
};

const commitInBatches = async (db: Firestore, rows: Array<{ ref: DocumentReference; data: DocumentData }>) => {
  const chunk = 400;
  for (let i = 0; i < rows.length; i += chunk) {
    const batch = db.batch();
    for (const row of rows.slice(i, i + chunk)) batch.set(row.ref, row.data);
    await batch.commit();
  }
};

const init = () => {
  const usingEmu = Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);
  if (usingEmu) {
    process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
    initializeApp({ projectId: PROJECT_ID });
    return;
  }
  const jsonPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (jsonPath && existsSync(jsonPath)) {
    initializeApp({ credential: cert(JSON.parse(readFileSync(jsonPath, 'utf8'))), projectId: PROJECT_ID });
    return;
  }
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
};

async function ensureAuthUser(email: string, name: string, claims: Record<string, string | null>) {
  const auth = getAuth();
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { password: DEMO_PASSWORD, displayName: name });
    uid = existing.uid;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== 'auth/user-not-found') throw error;
    const created = await auth.createUser({
      email,
      password: DEMO_PASSWORD,
      displayName: name,
      emailVerified: true,
    });
    uid = created.uid;
  }
  await auth.setCustomUserClaims(
    uid,
    Object.fromEntries(Object.entries(claims).filter(([, value]) => value != null))
  );
  return uid;
}

async function main() {
  init();
  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });

  const existing = await db.collection('movies').limit(1).get();
  if (!process.env.FORCE_SEED && !existing.empty) {
    console.log('Firestore already seeded — skipping. Set FORCE_SEED=1 to reset catalog.');
    return;
  }

  const tenants = [
    { id: 'movietix-in', slug: 'movietix-in', name: 'MovieTix India', country: 'India', countryCode: 'IN', currency: 'INR', timezone: 'Asia/Kolkata', utcOffsetMinutes: 330, locale: 'en-IN', convenienceBps: 1200, convenienceFlatMinor: 1900 },
    { id: 'movietix-ae', slug: 'movietix-ae', name: 'MovieTix UAE', country: 'United Arab Emirates', countryCode: 'AE', currency: 'AED', timezone: 'Asia/Dubai', utcOffsetMinutes: 240, locale: 'en-AE', convenienceBps: 1200, convenienceFlatMinor: 1500 },
    { id: 'movietix-uk', slug: 'movietix-uk', name: 'MovieTix UK', country: 'United Kingdom', countryCode: 'GB', currency: 'GBP', timezone: 'Europe/London', utcOffsetMinutes: 60, locale: 'en-GB', convenienceBps: 1200, convenienceFlatMinor: 99 },
    { id: 'movietix-us', slug: 'movietix-us', name: 'MovieTix United States', country: 'United States', countryCode: 'US', currency: 'USD', timezone: 'America/New_York', utcOffsetMinutes: -240, locale: 'en-US', convenienceBps: 1200, convenienceFlatMinor: 149 },
  ];
  const tenantById = Object.fromEntries(tenants.map((t) => [t.id, t]));

  const cinemaDefs = [
    { tenantId: 'movietix-in', slug: 'pvr-phoenix', name: 'PVR Cinemas', mall: 'Phoenix Palladium', city: 'Mumbai', country: 'India' },
    { tenantId: 'movietix-in', slug: 'inox-rcity', name: 'INOX', mall: 'R City Mall', city: 'Mumbai', country: 'India' },
    { tenantId: 'movietix-in', slug: 'cinepolis-andheri', name: 'Cinépolis', mall: 'Fun Republic', city: 'Mumbai', country: 'India' },
    { tenantId: 'movietix-in', slug: 'pvr-select-city', name: 'PVR Director’s Cut', mall: 'Select Citywalk', city: 'Delhi-NCR', country: 'India' },
    { tenantId: 'movietix-in', slug: 'pvr-orion', name: 'PVR IMAX', mall: 'Orion Mall', city: 'Bengaluru', country: 'India' },
    { tenantId: 'movietix-in', slug: 'pvr-gvk', name: 'PVR', mall: 'GVK One', city: 'Hyderabad', country: 'India' },
    { tenantId: 'movietix-in', slug: 'spi-sathyam', name: 'SPI Sathyam', mall: 'Royapettah', city: 'Chennai', country: 'India' },
    { tenantId: 'movietix-in', slug: 'pvr-pavilion', name: 'PVR', mall: 'Pavilion Mall', city: 'Pune', country: 'India' },
    { tenantId: 'movietix-ae', slug: 'reel-dubai-mall', name: 'Reel Cinemas', mall: 'The Dubai Mall', city: 'Dubai', country: 'United Arab Emirates' },
    { tenantId: 'movietix-ae', slug: 'vox-yas-mall', name: 'VOX Cinemas', mall: 'Yas Mall', city: 'Abu Dhabi', country: 'United Arab Emirates' },
    { tenantId: 'movietix-uk', slug: 'odeon-luxe-leicester', name: 'ODEON Luxe', mall: 'Leicester Square', city: 'London', country: 'United Kingdom' },
    { tenantId: 'movietix-us', slug: 'amc-empire-42', name: 'AMC Empire 25', mall: 'Times Square', city: 'New York', country: 'United States' },
    { tenantId: 'movietix-us', slug: 'amc-century-city', name: 'AMC Century City', mall: 'Westfield', city: 'Los Angeles', country: 'United States' },
  ];

  const amenitiesBySlug: Record<string, string[]> = {
    'pvr-phoenix': ['IMAX', 'Dolby Atmos', 'Recliner', 'M-Ticket'],
    'inox-rcity': ['4K Laser', 'M-Ticket', 'Food Court'],
    'cinepolis-andheri': ['VIP', 'Dolby Atmos', 'M-Ticket'],
    'pvr-select-city': ['IMAX', 'Recliner', 'M-Ticket'],
    'pvr-orion': ['IMAX', 'Dolby Atmos', 'M-Ticket'],
    'pvr-gvk': ['IMAX', 'Recliner', 'M-Ticket'],
    'spi-sathyam': ['4K Laser', 'M-Ticket'],
    'pvr-pavilion': ['Dolby Atmos', 'M-Ticket'],
    'reel-dubai-mall': ['IMAX', 'Platinum', 'M-Ticket'],
    'vox-yas-mall': ['IMAX', 'Dolby Atmos'],
    'odeon-luxe-leicester': ['IMAX', 'Dolby Atmos'],
    'amc-empire-42': ['Dolby Cinema', 'IMAX', 'Recliner'],
    'amc-century-city': ['Dolby Cinema', 'M-Ticket'],
  };

  const writes: Array<{ ref: DocumentReference; data: DocumentData }> = [];

  for (const tenant of tenants) {
    writes.push({ ref: db.collection('tenants').doc(tenant.id), data: tenant });
  }

  for (const movie of catalog) {
    writes.push({
      ref: db.collection('movies').doc(movie.slug),
      data: {
        slug: movie.slug,
        title: movie.title,
        imageUrl: movie.imageUrl,
        backdropUrl: movie.backdropUrl,
        description: movie.description,
        durationMin: movie.durationMin,
        genres: movie.genres,
        language: movie.language,
        certification: movie.certification,
        formats: movie.formats,
        cast: movie.cast,
        director: movie.director,
        status: movie.status,
        releaseDate: movie.releaseDate,
        featured: movie.featured,
        rating: movie.rating,
        inrPrice: movie.inrPrice,
      },
    });
  }

  const cinemas = cinemaDefs.map((def) => {
    const tenant = tenantById[def.tenantId];
    return {
      ...def,
      tenant,
      amenities: amenitiesBySlug[def.slug] ?? ['M-Ticket'],
    };
  });

  for (const cinema of cinemas) {
    writes.push({
      ref: db.collection('cinemas').doc(cinema.slug),
      data: {
        slug: cinema.slug,
        tenantId: cinema.tenantId,
        name: cinema.name,
        mall: cinema.mall,
        city: cinema.city,
        country: cinema.country,
        countryCode: cinema.tenant.countryCode,
        currency: cinema.tenant.currency,
        timezone: cinema.tenant.timezone,
        utcOffsetMinutes: cinema.tenant.utcOffsetMinutes,
        address: `${cinema.mall}, ${cinema.city}`,
        amenities: cinema.amenities,
        screens: [
          { name: 'Screen 1', rows: 8, seatsPerRow: 12 },
          { name: 'Screen 2', rows: 8, seatsPerRow: 12 },
        ],
        convenienceBps: cinema.tenant.convenienceBps,
        convenienceFlatMinor: cinema.tenant.convenienceFlatMinor,
      },
    });
  }

  writes.push({
    ref: db.collection('promoCodes').doc('BOOKNOW10'),
    data: { code: 'BOOKNOW10', percentOff: 10, active: true },
  });

  const nowShowing = catalog.filter((m) => m.status === 'now-showing');
  const now = new Date();
  let showCount = 0;

  for (const cinema of cinemas) {
    const offset = cinema.tenant.utcOffsetMinutes;
    const titles = nowShowing.filter((m) => {
      if (cinema.tenant.countryCode === 'IN') return true;
      if (m.language === 'English') return true;
      if (cinema.tenant.countryCode === 'AE') return m.language !== 'Telugu' || m.slug === 'rrr';
      return false;
    });
    for (let day = 0; day < 7; day += 1) {
      const d = new Date(now.getTime() + day * 86400000);
      const dateKey = ymd(d, offset);
      for (let i = 0; i < titles.length; i += 1) {
        const movie = titles[i];
        const screen = i % 2 === 0 ? 'Screen 1' : 'Screen 2';
        const slots = [TIMES[i % TIMES.length], TIMES[(i + 2) % TIMES.length]];
        for (const hm of slots) {
          const startsAt = localToUtc(dateKey, hm, offset);
          const showId = `${cinema.slug}_${movie.slug}_${dateKey.replaceAll('-', '')}_${hm.replace(':', '')}`;
          writes.push({
            ref: db.collection('shows').doc(showId),
            data: {
              movieSlug: movie.slug,
              movieTitle: movie.title,
              cinemaId: cinema.slug,
              cinemaName: cinema.name,
              cinemaMall: cinema.mall,
              city: cinema.city,
              country: cinema.country,
              screen,
              startsAt: Timestamp.fromDate(startsAt),
              startsDateLocal: dateKey,
              format: movie.formats.includes('IMAX') && hm === '19:45' ? 'IMAX' : '2D',
              language: movie.language,
              basePriceMinor: priceFor(movie.inrPrice, cinema.tenant.currency),
              currency: cinema.tenant.currency,
              tenantId: cinema.tenantId,
              utcOffsetMinutes: offset,
              convenienceBps: cinema.tenant.convenienceBps,
              convenienceFlatMinor: cinema.tenant.convenienceFlatMinor,
              soldCount: 0,
              capacity: 96,
            },
          });
          showCount += 1;
        }
      }
    }
  }

  await commitInBatches(db, writes);

  const guestUid = await ensureAuthUser('guest@movietix.app', 'Guest User', { role: 'CUSTOMER', tenantId: null });
  const adminUid = await ensureAuthUser('admin@movietix.app', 'PVR India Admin', { role: 'TENANT_ADMIN', tenantId: 'movietix-in' });
  const platformUid = await ensureAuthUser('platform@movietix.app', 'MovieTix Platform', { role: 'PLATFORM_ADMIN', tenantId: null });

  await db.collection('users').doc(guestUid).set({
    email: 'guest@movietix.app',
    name: 'Guest User',
    role: 'CUSTOMER',
    tenantId: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  await db.collection('users').doc(adminUid).set({
    email: 'admin@movietix.app',
    name: 'PVR India Admin',
    role: 'TENANT_ADMIN',
    tenantId: 'movietix-in',
    createdAt: FieldValue.serverTimestamp(),
  });
  await db.collection('users').doc(platformUid).set({
    email: 'platform@movietix.app',
    name: 'MovieTix Platform',
    role: 'PLATFORM_ADMIN',
    tenantId: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log(`Seeded ${catalog.length} movies, ${cinemas.length} cinemas, ${showCount} shows`);
  console.log('Demo logins (password Ticket@123): guest@movietix.app · admin@movietix.app · platform@movietix.app');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
