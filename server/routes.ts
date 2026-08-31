import { z } from 'zod';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './db.js';
import {
  clearSession,
  hashPassword,
  loadUser,
  readUser,
  requireRole,
  requireUser,
  setSession,
  toAuth,
  verifyPassword,
} from './auth.js';
import { env } from './env.js';
import {
  bookingCode,
  buildHall,
  CATEGORY_LABEL,
  convenienceFee,
  getSeatPriceMinor,
  seatKey,
} from './seats.js';

const splitCsv = (value: string) => JSON.parse(value) as string[];

const movieDto = (movie: {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  backdropUrl: string;
  description: string;
  durationMin: number;
  genres: string;
  language: string;
  certification: string;
  formats: string;
  cast: string;
  director: string;
  status: string;
  releaseDate: string;
  featured: boolean;
  rating: number;
}) => ({
  id: movie.slug,
  movieId: movie.id,
  title: movie.title,
  imageUrl: movie.imageUrl,
  backdropUrl: movie.backdropUrl,
  description: movie.description,
  duration: `${Math.floor(movie.durationMin / 60)}h ${movie.durationMin % 60}min`,
  durationMin: movie.durationMin,
  genre: splitCsv(movie.genres),
  language: movie.language,
  certification: movie.certification,
  formats: splitCsv(movie.formats),
  cast: splitCsv(movie.cast),
  director: movie.director,
  status: movie.status,
  releaseDate: movie.releaseDate,
  featured: movie.featured,
  rating: movie.rating,
});

const demoSold = (showId: string, key: string) => {
  let hash = 0;
  const s = `${showId}:${key}`;
  for (let i = 0; i < s.length; i += 1) hash = (hash << 5) - hash + s.charCodeAt(i);
  return Math.abs(hash) % 10 < 2;
};

const sendError = (reply: FastifyReply, status: number, message: string) =>
  reply.code(status).send({ error: message });

export const registerRoutes = async (app: FastifyInstance) => {
  app.get('/api/health', async () => ({ ok: true, service: 'movietix-api' }));

  app.get('/api/meta', async () => {
    const cinemas = await prisma.cinema.findMany({
      include: { tenant: true },
      orderBy: [{ country: 'asc' }, { city: 'asc' }, { name: 'asc' }],
    });
    const citiesMap = new Map<
      string,
      { city: string; country: string; countryCode: string; currency: string }
    >();
    cinemas.forEach((c) => {
      if (!citiesMap.has(c.city)) {
        citiesMap.set(c.city, {
          city: c.city,
          country: c.country,
          countryCode: c.tenant.countryCode,
          currency: c.tenant.currency,
        });
      }
    });
    return {
      cities: [...citiesMap.values()],
      holdMinutes: env.holdMinutes,
    };
  });

  app.get('/api/me', async (request) => {
    const session = readUser(request);
    if (!session) return { user: null };
    const user = await loadUser(session.id);
    return { user };
  });

  app.post('/api/auth/register', async (request, reply) => {
    const body = z
      .object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        phone: z.string().optional(),
      })
      .parse(request.body);
    const exists = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (exists) return sendError(reply, 409, 'An account with this email already exists');
    const user = await prisma.user.create({
      data: {
        name: body.name.trim(),
        email: body.email.toLowerCase(),
        passwordHash: await hashPassword(body.password),
        phone: body.phone,
        role: 'CUSTOMER',
      },
    });
    const auth = toAuth(user);
    setSession(reply, auth);
    return { user: auth };
  });

  app.post('/api/auth/login', async (request, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return sendError(reply, 401, 'Invalid email or password');
    }
    const auth = toAuth(user);
    setSession(reply, auth);
    return { user: auth };
  });

  app.post('/api/auth/logout', async (_request, reply) => {
    clearSession(reply);
    return { ok: true };
  });

  app.get('/api/movies', async (request) => {
    const q = z
      .object({
        city: z.string().optional(),
        search: z.string().optional(),
        genre: z.string().optional(),
        language: z.string().optional(),
      })
      .parse(request.query);

    const now = new Date();
    const cityFilter = q.city
      ? { cinema: { city: q.city } }
      : {};

    const movies = await prisma.movie.findMany({
      where: {
        OR: [
          { status: 'coming-soon' },
          {
            shows: {
              some: {
                startsAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
                ...cityFilter,
              },
            },
          },
        ],
      },
      include: {
        shows: {
          where: {
            startsAt: { gte: now },
            ...cityFilter,
          },
          orderBy: { startsAt: 'asc' },
          take: 1,
        },
      },
    });

    return movies
      .map((movie) => ({
        ...movieDto(movie),
        priceMinor: movie.shows[0]?.basePriceMinor ?? 0,
        currency: movie.shows[0]?.currency ?? 'INR',
        cityHasShows: movie.shows.length > 0 || movie.status === 'coming-soon',
      }))
      .filter((movie) => {
        const s = (q.search ?? '').trim().toLowerCase();
        const matchesSearch =
          !s ||
          movie.title.toLowerCase().includes(s) ||
          movie.genre.some((g) => g.toLowerCase().includes(s)) ||
          movie.language.toLowerCase().includes(s);
        const matchesGenre = !q.genre || q.genre === 'All' || movie.genre.includes(q.genre);
        const matchesLanguage = !q.language || q.language === 'All' || movie.language === q.language;
        return matchesSearch && matchesGenre && matchesLanguage;
      });
  });

  app.get('/api/movies/:slug', async (request, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(request.params);
    const movie = await prisma.movie.findUnique({ where: { slug } });
    if (!movie) return sendError(reply, 404, 'Movie not found');
    return movieDto(movie);
  });

  app.get('/api/movies/:slug/showtimes', async (request, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(request.params);
    const q = z
      .object({
        city: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(request.query);

    const movie = await prisma.movie.findUnique({ where: { slug } });
    if (!movie) return sendError(reply, 404, 'Movie not found');

    const cinemas = await prisma.cinema.findMany({
      where: { city: q.city },
      include: { tenant: true, screens: true },
    });

    const dayStart = new Date(`${q.date}T00:00:00.000Z`);
    const result = [];

    for (const cinema of cinemas) {
      const offset = cinema.tenant.utcOffsetMinutes;
      const localStartUtc = new Date(Date.parse(`${q.date}T00:00:00Z`) - offset * 60 * 1000);
      const localEndUtc = new Date(localStartUtc.getTime() + 24 * 60 * 60 * 1000);
      const shows = await prisma.show.findMany({
        where: {
          movieId: movie.id,
          cinemaId: cinema.id,
          startsAt: { gte: localStartUtc, lt: localEndUtc },
        },
        include: { screen: true },
        orderBy: { startsAt: 'asc' },
      });
      result.push({
        id: cinema.id,
        slug: cinema.slug,
        name: cinema.name,
        mall: cinema.mall,
        city: cinema.city,
        country: cinema.country,
        amenities: splitCsv(cinema.amenities),
        currency: cinema.tenant.currency,
        timezone: cinema.tenant.timezone,
        shows: shows.map((show) => ({
          id: show.id,
          startsAt: show.startsAt.toISOString(),
          format: show.format,
          language: show.language,
          screen: show.screen.name,
          basePriceMinor: show.basePriceMinor,
          currency: show.currency,
          past: show.startsAt.getTime() < Date.now(),
        })),
      });
    }

    return { movie: movieDto(movie), date: q.date, cinemas: result, dayStart };
  });

  app.get('/api/shows/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const show = await prisma.show.findUnique({
      where: { id },
      include: {
        movie: true,
        cinema: { include: { tenant: true } },
        screen: true,
      },
    });
    if (!show) return sendError(reply, 404, 'Show not found');
    return {
      id: show.id,
      startsAt: show.startsAt.toISOString(),
      format: show.format,
      language: show.language,
      basePriceMinor: show.basePriceMinor,
      currency: show.currency,
      movie: movieDto(show.movie),
      cinema: {
        id: show.cinema.id,
        name: show.cinema.name,
        mall: show.cinema.mall,
        city: show.cinema.city,
        country: show.cinema.country,
        amenities: splitCsv(show.cinema.amenities),
      },
      screen: show.screen.name,
      tenant: {
        currency: show.cinema.tenant.currency,
        timezone: show.cinema.tenant.timezone,
      },
    };
  });

  app.get('/api/shows/:id/seats', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const session = readUser(request);
    const show = await prisma.show.findUnique({ where: { id } });
    if (!show) return sendError(reply, 404, 'Show not found');

    const now = new Date();
    const [holds, booked] = await Promise.all([
      prisma.seatHold.findMany({ where: { showId: id, expiresAt: { gt: now } } }),
      prisma.bookingSeat.findMany({ where: { showId: id } }),
    ]);
    const bookedSet = new Set(booked.map((s) => s.seatKey));
    const holdMap = new Map(holds.map((h) => [h.seatKey, h]));

    const seats = buildHall().map((seat) => {
      const hold = holdMap.get(seat.seatKey);
      const sold = bookedSet.has(seat.seatKey) || demoSold(id, seat.seatKey);
      const mine = Boolean(hold && session && hold.userId === session.id);
      return {
        id: seat.seatKey,
        row: seat.row,
        number: seat.number,
        category: seat.category,
        label: CATEGORY_LABEL[seat.category],
        priceMinor: getSeatPriceMinor(show.basePriceMinor, seat.category),
        status: sold ? 'sold' : hold && !mine ? 'held' : mine ? 'mine' : 'available',
      };
    });

    return { showId: id, currency: show.currency, seats };
  });

  app.post('/api/holds', async (request, reply) => {
    const user = requireUser(request);
    const body = z
      .object({
        showId: z.string(),
        seats: z.array(z.object({ row: z.string(), number: z.number().int().min(1).max(12) })).min(1).max(10),
      })
      .parse(request.body);

    const show = await prisma.show.findUnique({
      where: { id: body.showId },
      include: { cinema: { include: { tenant: true } }, movie: true },
    });
    if (!show) return sendError(reply, 404, 'Show not found');
    if (show.startsAt.getTime() < Date.now()) return sendError(reply, 400, 'This show has already started');

    const keys = body.seats.map((s) => seatKey(s.row, s.number));
    const hall = buildHall();
    const selected = keys.map((key) => {
      const found = hall.find((s) => s.seatKey === key);
      if (!found) throw Object.assign(new Error(`Invalid seat ${key}`), { statusCode: 400 });
      return found;
    });

    const holdId = `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const expiresAt = new Date(Date.now() + env.holdMinutes * 60 * 1000);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.seatHold.deleteMany({
          where: { OR: [{ expiresAt: { lt: new Date() } }, { userId: user.id }] },
        });
        const taken = await tx.bookingSeat.findMany({
          where: { showId: show.id, seatKey: { in: keys } },
        });
        if (taken.length) throw Object.assign(new Error('One or more seats were just booked'), { statusCode: 409 });
        const blocked = keys.filter((key) => demoSold(show.id, key));
        if (blocked.length) throw Object.assign(new Error('Those seats are no longer available'), { statusCode: 409 });
        await tx.seatHold.createMany({
          data: selected.map((seat) => ({
            holdId,
            showId: show.id,
            userId: user.id,
            seatKey: seat.seatKey,
            row: seat.row,
            number: seat.number,
            category: seat.category,
            expiresAt,
          })),
        });
      });
    } catch (error) {
      const code = (error as { code?: string; statusCode?: number }).statusCode ?? 409;
      const message = error instanceof Error ? error.message : 'Seats unavailable';
      if ((error as { code?: string }).code === 'P2002') {
        return sendError(reply, 409, 'Those seats were just taken. Pick another.');
      }
      return sendError(reply, code, message);
    }

    const lines = selected.map((seat) => ({
      ...seat,
      priceMinor: getSeatPriceMinor(show.basePriceMinor, seat.category),
    }));
    const subtotalMinor = lines.reduce((sum, s) => sum + s.priceMinor, 0);
    const tenant = show.cinema.tenant;
    const feeMinor = convenienceFee(subtotalMinor, tenant.convenienceBps, tenant.convenienceFlatMinor);

    return {
      holdId,
      expiresAt: expiresAt.toISOString(),
      showId: show.id,
      movie: movieDto(show.movie),
      cinema: { name: show.cinema.name, mall: show.cinema.mall, city: show.cinema.city },
      startsAt: show.startsAt.toISOString(),
      seats: lines,
      subtotalMinor,
      feeMinor,
      discountMinor: 0,
      totalMinor: subtotalMinor + feeMinor,
      currency: show.currency,
    };
  });

  app.post('/api/checkout', async (request, reply) => {
    const user = requireUser(request);
    const body = z
      .object({
        holdId: z.string(),
        promoCode: z.string().optional(),
      })
      .parse(request.body);

    const holds = await prisma.seatHold.findMany({
      where: { holdId: body.holdId, userId: user.id, expiresAt: { gt: new Date() } },
      include: { show: { include: { cinema: { include: { tenant: true } }, movie: true } } },
    });
    if (!holds.length) return sendError(reply, 410, 'Your seat hold expired. Please select seats again.');

    const show = holds[0].show;
    const tenant = show.cinema.tenant;
    const lines = holds.map((h) => ({
      seatKey: h.seatKey,
      row: h.row,
      number: h.number,
      category: h.category,
      priceMinor: getSeatPriceMinor(show.basePriceMinor, h.category),
    }));
    const subtotalMinor = lines.reduce((sum, s) => sum + s.priceMinor, 0);
    const feeMinor = convenienceFee(subtotalMinor, tenant.convenienceBps, tenant.convenienceFlatMinor);
    let discountMinor = 0;
    let promoCode: string | undefined;
    if (body.promoCode?.trim()) {
      const promo = await prisma.promoCode.findFirst({
        where: {
          code: body.promoCode.trim().toUpperCase(),
          active: true,
          OR: [{ tenantId: tenant.id }, { tenantId: null }],
        },
      });
      if (!promo) return sendError(reply, 400, 'Invalid promo code');
      discountMinor = Math.round((subtotalMinor * promo.percentOff) / 100);
      promoCode = promo.code;
    }
    const totalMinor = subtotalMinor + feeMinor - discountMinor;
    const code = bookingCode();
    const qrPayload = JSON.stringify({
      v: 1,
      code,
      show: show.id,
      seats: lines.map((s) => s.seatKey),
    });

    try {
      const booking = await prisma.$transaction(async (tx) => {
        const created = await tx.booking.create({
          data: {
            code,
            userId: user.id,
            tenantId: tenant.id,
            cinemaId: show.cinemaId,
            showId: show.id,
            status: 'CONFIRMED',
            subtotalMinor,
            feeMinor,
            discountMinor,
            totalMinor,
            currency: show.currency,
            promoCode,
            qrPayload,
            seats: {
              create: lines.map((s) => ({
                showId: show.id,
                seatKey: s.seatKey,
                row: s.row,
                number: s.number,
                category: s.category,
                priceMinor: s.priceMinor,
              })),
            },
          },
        });
        await tx.seatHold.deleteMany({ where: { holdId: body.holdId } });
        return created;
      });

      return {
        booking: {
          id: booking.id,
          code: booking.code,
          totalMinor: booking.totalMinor,
          currency: booking.currency,
          movieTitle: show.movie.title,
        },
      };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        return sendError(reply, 409, 'A selected seat was booked by someone else. Pick new seats.');
      }
      throw error;
    }
  });

  app.get('/api/tickets', async (request) => {
    const user = requireUser(request);
    const tickets = await prisma.booking.findMany({
      where: { userId: user.id, status: 'CONFIRMED' },
      include: {
        show: { include: { movie: true } },
        cinema: true,
        seats: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return tickets.map((t) => ({
      id: t.id,
      code: t.code,
      movie: movieDto(t.show.movie),
      cinema: { name: t.cinema.name, mall: t.cinema.mall, city: t.cinema.city, country: t.cinema.country },
      showDate: t.show.startsAt.toISOString(),
      seats: t.seats.map((s) => ({
        id: s.seatKey,
        row: s.row,
        number: s.number,
        category: s.category,
      })),
      subtotalMinor: t.subtotalMinor,
      convenienceFee: t.feeMinor,
      discount: t.discountMinor,
      totalAmount: t.totalMinor,
      currency: t.currency,
      purchaseDate: t.createdAt.toISOString(),
      qrPayload: t.qrPayload,
    }));
  });

  app.get('/api/admin/overview', async (request) => {
    const user = requireRole(request, ['TENANT_ADMIN', 'MANAGER', 'STAFF', 'PLATFORM_ADMIN']);
    const tenantWhere = user.role === 'PLATFORM_ADMIN' || !user.tenantId ? {} : { tenantId: user.tenantId };
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [bookings, shows, cinemas] = await Promise.all([
      prisma.booking.findMany({
        where: { ...tenantWhere, createdAt: { gte: start }, status: 'CONFIRMED' },
      }),
      prisma.show.count({
        where: {
          startsAt: { gte: new Date() },
          cinema: tenantWhere,
        },
      }),
      prisma.cinema.count({ where: tenantWhere }),
    ]);
    const gmv = bookings.reduce((sum, b) => sum + b.totalMinor, 0);
    const tickets = bookings.reduce((sum, b) => sum + 1, 0);
    return {
      gmvMinor: gmv,
      currency: bookings[0]?.currency ?? 'INR',
      bookingsToday: tickets,
      upcomingShows: shows,
      cinemas,
    };
  });

  app.get('/api/admin/bookings', async (request) => {
    const user = requireRole(request, ['TENANT_ADMIN', 'MANAGER', 'STAFF', 'PLATFORM_ADMIN']);
    const tenantWhere = user.role === 'PLATFORM_ADMIN' || !user.tenantId ? {} : { tenantId: user.tenantId };
    const bookings = await prisma.booking.findMany({
      where: tenantWhere,
      include: { show: { include: { movie: true } }, cinema: true, seats: true, user: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return bookings.map((b) => ({
      id: b.id,
      code: b.code,
      customer: b.user.name,
      email: b.user.email,
      movie: b.show.movie.title,
      cinema: `${b.cinema.name}, ${b.cinema.mall}`,
      city: b.cinema.city,
      startsAt: b.show.startsAt.toISOString(),
      seats: b.seats.map((s) => `${s.row}${s.number}`).join(', '),
      totalMinor: b.totalMinor,
      currency: b.currency,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
    }));
  });

  app.get('/api/admin/shows', async (request) => {
    const user = requireRole(request, ['TENANT_ADMIN', 'MANAGER', 'STAFF', 'PLATFORM_ADMIN']);
    const tenantWhere = user.role === 'PLATFORM_ADMIN' || !user.tenantId ? {} : { tenantId: user.tenantId };
    const shows = await prisma.show.findMany({
      where: { cinema: tenantWhere, startsAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } },
      include: { movie: true, cinema: true, screen: true, _count: { select: { bookingSeats: true } } },
      orderBy: { startsAt: 'asc' },
      take: 80,
    });
    return shows.map((s) => ({
      id: s.id,
      movie: s.movie.title,
      cinema: `${s.cinema.name} · ${s.cinema.mall}`,
      city: s.cinema.city,
      screen: s.screen.name,
      startsAt: s.startsAt.toISOString(),
      format: s.format,
      sold: s._count.bookingSeats,
      capacity: 8 * 12,
      basePriceMinor: s.basePriceMinor,
      currency: s.currency,
    }));
  });

  app.post('/api/admin/shows', async (request, reply) => {
    const user = requireRole(request, ['TENANT_ADMIN', 'MANAGER', 'PLATFORM_ADMIN']);
    const body = z
      .object({
        movieSlug: z.string(),
        cinemaId: z.string(),
        screenId: z.string(),
        startsAt: z.string(),
        format: z.string().default('2D'),
        basePriceMinor: z.number().int().positive(),
      })
      .parse(request.body);
    const cinema = await prisma.cinema.findUnique({
      where: { id: body.cinemaId },
      include: { tenant: true },
    });
    if (!cinema) return sendError(reply, 404, 'Cinema not found');
    if (user.role !== 'PLATFORM_ADMIN' && user.tenantId && cinema.tenantId !== user.tenantId) {
      return sendError(reply, 403, 'That cinema is outside your chain');
    }
    const movie = await prisma.movie.findUnique({ where: { slug: body.movieSlug } });
    if (!movie) return sendError(reply, 404, 'Movie not found');
    const show = await prisma.show.create({
      data: {
        movieId: movie.id,
        cinemaId: cinema.id,
        screenId: body.screenId,
        startsAt: new Date(body.startsAt),
        format: body.format,
        language: movie.language,
        basePriceMinor: body.basePriceMinor,
        currency: cinema.tenant.currency,
      },
    });
    return { id: show.id };
  });

  app.get('/api/admin/cinemas', async (request) => {
    const user = requireRole(request, ['TENANT_ADMIN', 'MANAGER', 'STAFF', 'PLATFORM_ADMIN']);
    const tenantWhere = user.role === 'PLATFORM_ADMIN' || !user.tenantId ? {} : { tenantId: user.tenantId };
    const cinemas = await prisma.cinema.findMany({
      where: tenantWhere,
      include: { screens: true, tenant: true },
    });
    return cinemas.map((c) => ({
      id: c.id,
      name: c.name,
      mall: c.mall,
      city: c.city,
      country: c.country,
      screens: c.screens,
      currency: c.tenant.currency,
    }));
  });

  app.get('/api/admin/movies', async (request) => {
    requireRole(request, ['TENANT_ADMIN', 'MANAGER', 'STAFF', 'PLATFORM_ADMIN']);
    const movies = await prisma.movie.findMany({ orderBy: { title: 'asc' } });
    return movies.map(movieDto);
  });
};

export const handleRouteError = (error: unknown, reply: FastifyReply, request: FastifyRequest) => {
  if (error instanceof z.ZodError) {
    return reply.code(400).send({ error: error.issues[0]?.message ?? 'Invalid request' });
  }
  const status = (error as { statusCode?: number }).statusCode;
  if (status) return reply.code(status).send({ error: (error as Error).message });
  request.log.error(error);
  return reply.code(500).send({ error: 'Something went wrong. Please try again.' });
};
