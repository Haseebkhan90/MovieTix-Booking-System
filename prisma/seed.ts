import { prisma } from '../server/db.js';
import bcrypt from 'bcryptjs';
import { catalog } from './catalog.js';

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

async function main() {
  if (!process.env.FORCE_SEED && (await prisma.movie.count()) > 0) {
    console.log('Database already seeded — skipping. Set FORCE_SEED=1 to reset.');
    return;
  }

  await prisma.bookingSeat.deleteMany();
  await prisma.seatHold.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.show.deleteMany();
  await prisma.screen.deleteMany();
  await prisma.cinema.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.tenant.deleteMany();

  const passwordHash = await bcrypt.hash('Ticket@123', 12);

  const india = await prisma.tenant.create({
    data: {
      slug: 'movietix-in',
      name: 'MovieTix India',
      country: 'India',
      countryCode: 'IN',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      utcOffsetMinutes: 330,
      locale: 'en-IN',
      convenienceFlatMinor: 1900,
    },
  });
  const uae = await prisma.tenant.create({
    data: {
      slug: 'movietix-ae',
      name: 'MovieTix UAE',
      country: 'United Arab Emirates',
      countryCode: 'AE',
      currency: 'AED',
      timezone: 'Asia/Dubai',
      utcOffsetMinutes: 240,
      locale: 'en-AE',
      convenienceFlatMinor: 1500,
    },
  });
  const uk = await prisma.tenant.create({
    data: {
      slug: 'movietix-uk',
      name: 'MovieTix UK',
      country: 'United Kingdom',
      countryCode: 'GB',
      currency: 'GBP',
      timezone: 'Europe/London',
      utcOffsetMinutes: 60,
      locale: 'en-GB',
      convenienceFlatMinor: 99,
    },
  });
  const us = await prisma.tenant.create({
    data: {
      slug: 'movietix-us',
      name: 'MovieTix United States',
      country: 'United States',
      countryCode: 'US',
      currency: 'USD',
      timezone: 'America/New_York',
      utcOffsetMinutes: -240,
      locale: 'en-US',
      convenienceFlatMinor: 149,
    },
  });

  const cinemaDefs = [
    { tenantId: india.id, slug: 'pvr-phoenix', name: 'PVR Cinemas', mall: 'Phoenix Palladium', city: 'Mumbai', country: 'India', amenities: ['IMAX', 'Dolby Atmos', 'Recliner', 'M-Ticket'] },
    { tenantId: india.id, slug: 'inox-rcity', name: 'INOX', mall: 'R City Mall', city: 'Mumbai', country: 'India', amenities: ['4K Laser', 'M-Ticket', 'Food Court'] },
    { tenantId: india.id, slug: 'cinepolis-andheri', name: 'Cinépolis', mall: 'Fun Republic', city: 'Mumbai', country: 'India', amenities: ['VIP', 'Dolby Atmos', 'M-Ticket'] },
    { tenantId: india.id, slug: 'pvr-select-city', name: 'PVR Director’s Cut', mall: 'Select Citywalk', city: 'Delhi-NCR', country: 'India', amenities: ['IMAX', 'Recliner', 'M-Ticket'] },
    { tenantId: india.id, slug: 'pvr-orion', name: 'PVR IMAX', mall: 'Orion Mall', city: 'Bengaluru', country: 'India', amenities: ['IMAX', 'Dolby Atmos', 'M-Ticket'] },
    { tenantId: india.id, slug: 'pvr-gvk', name: 'PVR', mall: 'GVK One', city: 'Hyderabad', country: 'India', amenities: ['IMAX', 'Recliner', 'M-Ticket'] },
    { tenantId: india.id, slug: 'spi-sathyam', name: 'SPI Sathyam', mall: 'Royapettah', city: 'Chennai', country: 'India', amenities: ['4K Laser', 'M-Ticket'] },
    { tenantId: india.id, slug: 'pvr-pavilion', name: 'PVR', mall: 'Pavilion Mall', city: 'Pune', country: 'India', amenities: ['Dolby Atmos', 'M-Ticket'] },
    { tenantId: uae.id, slug: 'reel-dubai-mall', name: 'Reel Cinemas', mall: 'The Dubai Mall', city: 'Dubai', country: 'United Arab Emirates', amenities: ['IMAX', 'Platinum', 'M-Ticket'] },
    { tenantId: uae.id, slug: 'vox-yas-mall', name: 'VOX Cinemas', mall: 'Yas Mall', city: 'Abu Dhabi', country: 'United Arab Emirates', amenities: ['IMAX', 'Dolby Atmos'] },
    { tenantId: uk.id, slug: 'odeon-luxe-leicester', name: 'ODEON Luxe', mall: 'Leicester Square', city: 'London', country: 'United Kingdom', amenities: ['IMAX', 'Dolby Atmos'] },
    { tenantId: us.id, slug: 'amc-empire-42', name: 'AMC Empire 25', mall: 'Times Square', city: 'New York', country: 'United States', amenities: ['Dolby Cinema', 'IMAX', 'Recliner'] },
    { tenantId: us.id, slug: 'amc-century-city', name: 'AMC Century City', mall: 'Westfield', city: 'Los Angeles', country: 'United States', amenities: ['Dolby Cinema', 'M-Ticket'] },
  ];

  const cinemas = [];
  for (const def of cinemaDefs) {
    const cinema = await prisma.cinema.create({
      data: {
        ...def,
        address: `${def.mall}, ${def.city}`,
        amenities: JSON.stringify(def.amenities),
        screens: {
          create: [
            { name: 'Screen 1', rows: 8, seatsPerRow: 12 },
            { name: 'Screen 2', rows: 8, seatsPerRow: 12 },
          ],
        },
      },
      include: { screens: true, tenant: true },
    });
    cinemas.push(cinema);
  }

  const movies = [];
  for (const movie of catalog) {
    movies.push(
      await prisma.movie.create({
        data: {
          slug: movie.slug,
          title: movie.title,
          imageUrl: movie.imageUrl,
          backdropUrl: movie.backdropUrl,
          description: movie.description,
          durationMin: movie.durationMin,
          genres: JSON.stringify(movie.genres),
          language: movie.language,
          certification: movie.certification,
          formats: JSON.stringify(movie.formats),
          cast: JSON.stringify(movie.cast),
          director: movie.director,
          status: movie.status,
          releaseDate: movie.releaseDate,
          featured: movie.featured,
          rating: movie.rating,
        },
      })
    );
  }

  const nowShowing = catalog.filter((m) => m.status === 'now-showing');
  const now = new Date();
  const showRows: {
    movieId: string;
    cinemaId: string;
    screenId: string;
    startsAt: Date;
    format: string;
    language: string;
    basePriceMinor: number;
    currency: string;
  }[] = [];

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
        const movieMeta = titles[i];
        const movie = movies.find((m) => m.slug === movieMeta.slug);
        if (!movie) continue;
        const screen = cinema.screens[i % cinema.screens.length];
        const slots = [TIMES[i % TIMES.length], TIMES[(i + 2) % TIMES.length]];
        for (const hm of slots) {
          showRows.push({
            movieId: movie.id,
            cinemaId: cinema.id,
            screenId: screen.id,
            startsAt: localToUtc(dateKey, hm, offset),
            format: movieMeta.formats.includes('IMAX') && hm === '19:45' ? 'IMAX' : '2D',
            language: movie.language,
            basePriceMinor: priceFor(movieMeta.inrPrice, cinema.tenant.currency),
            currency: cinema.tenant.currency,
          });
        }
      }
    }
  }

  const chunk = 200;
  for (let i = 0; i < showRows.length; i += chunk) {
    await prisma.show.createMany({ data: showRows.slice(i, i + chunk) });
  }

  await prisma.user.createMany({
    data: [
      {
        email: 'guest@movietix.app',
        name: 'Guest User',
        passwordHash,
        role: 'CUSTOMER',
      },
      {
        email: 'admin@movietix.app',
        name: 'PVR India Admin',
        passwordHash,
        role: 'TENANT_ADMIN',
        tenantId: india.id,
      },
      {
        email: 'platform@movietix.app',
        name: 'MovieTix Platform',
        passwordHash,
        role: 'PLATFORM_ADMIN',
      },
    ],
  });

  await prisma.promoCode.create({
    data: { code: 'BOOKNOW10', percentOff: 10, active: true },
  });

  const showCount = await prisma.show.count();
  console.log(`Seeded ${movies.length} movies, ${cinemas.length} cinemas, ${showCount} shows`);
  console.log('Demo logins (password Ticket@123): guest@movietix.app · admin@movietix.app · platform@movietix.app');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
