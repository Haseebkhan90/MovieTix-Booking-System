import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { ApiError, toApiError } from '../api/client';
import {
  buildHall,
  bookingCode,
  convenienceFee,
  demoSold,
  getSeatPriceMinor,
  HOLD_MINUTES,
  HALL_CAPACITY,
  seatKey,
} from './seats';
import type { AuthUser, CityInfo, HoldSummary, Movie, Ticket } from '../types';

export type CinemaShowtime = {
  id: string;
  startsAt: string;
  format: string;
  language: string;
  screen: string;
  basePriceMinor: number;
  currency: string;
  past: boolean;
};

export type CinemaRow = {
  id: string;
  name: string;
  mall: string;
  city: string;
  amenities: string[];
  currency: string;
  shows: CinemaShowtime[];
};

export type ShowInfo = {
  id: string;
  startsAt: string;
  movie: Movie;
  cinema: { name: string; mall: string; city: string };
  currency: string;
  basePriceMinor: number;
};

export type HallSeatRow = {
  id: string;
  row: string;
  number: number;
  category: string;
  priceMinor: number;
  status: 'available' | 'sold' | 'held' | 'mine';
};

export type AdminOverview = {
  gmvMinor: number;
  currency: string;
  bookingsToday: number;
  upcomingShows: number;
  cinemas: number;
};

export type AdminBookingRow = {
  id: string;
  code: string;
  customer: string;
  email: string;
  movie: string;
  cinema: string;
  city: string;
  startsAt: string;
  seats: string;
  totalMinor: number;
  currency: string;
  status: string;
};

export type AdminShowRow = {
  id: string;
  movie: string;
  cinema: string;
  city: string;
  screen: string;
  startsAt: string;
  format: string;
  sold: number;
  capacity: number;
  basePriceMinor: number;
  currency: string;
};

const asIso = (value: unknown): string => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return new Date(value).toISOString();
  return new Date().toISOString();
};

const asMillis = (value: unknown): number => {
  if (value instanceof Timestamp) return value.toMillis();
  if (value && typeof value === 'object' && 'toMillis' in value) return (value as Timestamp).toMillis();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value);
  return 0;
};

export const movieFromData = (id: string, data: DocumentData): Movie => {
  const durationMin = Number(data.durationMin ?? 0);
  const slug = String(data.slug ?? id);
  return {
    id: slug,
    movieId: slug,
    title: String(data.title ?? ''),
    imageUrl: String(data.imageUrl ?? ''),
    backdropUrl: String(data.backdropUrl ?? ''),
    description: String(data.description ?? ''),
    duration: `${Math.floor(durationMin / 60)}h ${durationMin % 60}min`,
    durationMin,
    genre: Array.isArray(data.genres) ? data.genres.map(String) : [],
    rating: Number(data.rating ?? 0),
    language: String(data.language ?? ''),
    certification: String(data.certification ?? ''),
    formats: Array.isArray(data.formats) ? data.formats.map(String) : [],
    cast: Array.isArray(data.cast) ? data.cast.map(String) : [],
    director: String(data.director ?? ''),
    status: String(data.status ?? 'now-showing'),
    releaseDate: String(data.releaseDate ?? ''),
    featured: Boolean(data.featured),
  };
};

export const profileFromData = (uid: string, data: DocumentData, email?: string | null): AuthUser => ({
  id: uid,
  email: String(data.email ?? email ?? ''),
  name: String(data.name ?? ''),
  role: String(data.role ?? 'CUSTOMER'),
  tenantId: data.tenantId ? String(data.tenantId) : null,
  phone: data.phone ? String(data.phone) : null,
});

const requireUid = () => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new ApiError(401, 'Sign in to continue');
  return uid;
};

export async function fetchCities(): Promise<CityInfo[]> {
  const snap = await getDocs(collection(db, 'cinemas'));
  const map = new Map<string, CityInfo>();
  snap.forEach((row) => {
    const d = row.data();
    const city = String(d.city ?? '');
    if (!city || map.has(city)) return;
    map.set(city, {
      city,
      country: String(d.country ?? ''),
      countryCode: String(d.countryCode ?? ''),
      currency: String(d.currency ?? 'INR'),
    });
  });
  return [...map.values()];
}

export async function fetchMovies(opts: {
  city: string;
  search?: string;
  genre?: string;
  language?: string;
}): Promise<Movie[]> {
  const [movieSnap, showSnap] = await Promise.all([
    getDocs(collection(db, 'movies')),
    getDocs(
      query(
        collection(db, 'shows'),
        where('city', '==', opts.city),
        where('startsAt', '>=', Timestamp.fromDate(new Date())),
        orderBy('startsAt'),
        limit(250)
      )
    ),
  ]);

  const priceBySlug = new Map<string, { priceMinor: number; currency: string }>();
  showSnap.forEach((row) => {
    const d = row.data();
    const slug = String(d.movieSlug ?? '');
    if (!slug || priceBySlug.has(slug)) return;
    priceBySlug.set(slug, {
      priceMinor: Number(d.basePriceMinor ?? 0),
      currency: String(d.currency ?? 'INR'),
    });
  });

  const search = (opts.search ?? '').trim().toLowerCase();
  return movieSnap.docs
    .map((row) => {
      const movie = movieFromData(row.id, row.data());
      const price = priceBySlug.get(movie.id);
      return {
        ...movie,
        priceMinor: price?.priceMinor ?? 0,
        currency: price?.currency ?? 'INR',
      };
    })
    .filter((movie) => {
      if (movie.status !== 'coming-soon' && !priceBySlug.has(movie.id)) return false;
      const matchesSearch =
        !search ||
        movie.title.toLowerCase().includes(search) ||
        movie.genre.some((g) => g.toLowerCase().includes(search)) ||
        movie.language.toLowerCase().includes(search);
      const matchesGenre = !opts.genre || opts.genre === 'All' || movie.genre.includes(opts.genre);
      const matchesLanguage = !opts.language || opts.language === 'All' || movie.language === opts.language;
      return matchesSearch && matchesGenre && matchesLanguage;
    });
}

export async function fetchMovie(slug: string): Promise<Movie> {
  const snap = await getDoc(doc(db, 'movies', slug));
  if (!snap.exists()) throw new ApiError(404, 'Movie not found');
  return movieFromData(snap.id, snap.data());
}

export async function fetchShowtimes(slug: string, city: string, dateKey: string): Promise<CinemaRow[]> {
  const [cinemaSnap, showSnap] = await Promise.all([
    getDocs(query(collection(db, 'cinemas'), where('city', '==', city))),
    getDocs(
      query(
        collection(db, 'shows'),
        where('movieSlug', '==', slug),
        where('city', '==', city),
        where('startsDateLocal', '==', dateKey)
      )
    ),
  ]);

  const showsByCinema = new Map<string, CinemaShowtime[]>();
  showSnap.forEach((row) => {
    const d = row.data();
    const cinemaId = String(d.cinemaId ?? '');
    const startsAt = asIso(d.startsAt);
    const list = showsByCinema.get(cinemaId) ?? [];
    list.push({
      id: row.id,
      startsAt,
      format: String(d.format ?? '2D'),
      language: String(d.language ?? ''),
      screen: String(d.screen ?? 'Screen 1'),
      basePriceMinor: Number(d.basePriceMinor ?? 0),
      currency: String(d.currency ?? 'INR'),
      past: Date.parse(startsAt) < Date.now(),
    });
    showsByCinema.set(cinemaId, list);
  });

  return cinemaSnap.docs.map((row) => {
    const d = row.data();
    const shows = (showsByCinema.get(row.id) ?? []).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return {
      id: row.id,
      name: String(d.name ?? ''),
      mall: String(d.mall ?? ''),
      city: String(d.city ?? ''),
      amenities: Array.isArray(d.amenities) ? d.amenities.map(String) : [],
      currency: String(d.currency ?? 'INR'),
      shows,
    };
  });
}

export async function fetchShow(showId: string): Promise<ShowInfo> {
  const snap = await getDoc(doc(db, 'shows', showId));
  if (!snap.exists()) throw new ApiError(404, 'Show not found');
  const d = snap.data();
  const movieSnap = await getDoc(doc(db, 'movies', String(d.movieSlug)));
  const movie = movieSnap.exists()
    ? movieFromData(movieSnap.id, movieSnap.data())
    : movieFromData(String(d.movieSlug), { title: d.movieTitle, slug: d.movieSlug });
  return {
    id: snap.id,
    startsAt: asIso(d.startsAt),
    movie,
    cinema: {
      name: String(d.cinemaName ?? ''),
      mall: String(d.cinemaMall ?? ''),
      city: String(d.city ?? ''),
    },
    currency: String(d.currency ?? 'INR'),
    basePriceMinor: Number(d.basePriceMinor ?? 0),
  };
}

const mapHallSeats = (showId: string, basePriceMinor: number, uid: string | null, docs: Map<string, DocumentData>): HallSeatRow[] => {
  const now = Date.now();
  return buildHall().map((seat) => {
    const row = docs.get(seat.seatKey);
    let status: HallSeatRow['status'] = 'available';
    if (demoSold(showId, seat.seatKey) || row?.status === 'booked') status = 'sold';
    else if (row?.status === 'held' && Number(row.holdUntil ?? 0) > now) {
      status = row.holdUserId === uid ? 'mine' : 'held';
    }
    return {
      id: seat.seatKey,
      row: seat.row,
      number: seat.number,
      category: seat.category,
      priceMinor: getSeatPriceMinor(basePriceMinor, seat.category),
      status,
    };
  });
};

export function listenSeats(
  showId: string,
  basePriceMinor: number,
  uid: string | null,
  onSeats: (seats: HallSeatRow[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'shows', showId, 'seats'), (snap) => {
    const docs = new Map<string, DocumentData>();
    snap.forEach((row) => docs.set(row.id, row.data()));
    onSeats(mapHallSeats(showId, basePriceMinor, uid, docs));
  });
}

export async function createHold(showId: string, seats: Array<{ row: string; number: number }>): Promise<HoldSummary> {
  try {
    return await createHoldInner(showId, seats);
  } catch (err) {
    throw toApiError(err);
  }
}

async function createHoldInner(showId: string, seats: Array<{ row: string; number: number }>): Promise<HoldSummary> {
  const uid = requireUid();
  if (!seats.length || seats.length > 10) throw new ApiError(400, 'Select between 1 and 10 seats');

  const showSnap = await getDoc(doc(db, 'shows', showId));
  if (!showSnap.exists()) throw new ApiError(404, 'Show not found');
  const show = showSnap.data();
  if (asMillis(show.startsAt) < Date.now()) throw new ApiError(400, 'This show has already started');

  const hall = buildHall();
  const selected = seats.map((s) => {
    const key = seatKey(s.row, s.number);
    const found = hall.find((h) => h.seatKey === key);
    if (!found) throw new ApiError(400, `Invalid seat ${key}`);
    return found;
  });
  const keys = selected.map((s) => s.seatKey);
  for (const key of keys) {
    if (demoSold(showId, key)) throw new ApiError(409, 'Those seats are no longer available');
  }

  const prevSnap = await getDocs(query(collection(db, 'shows', showId, 'seats'), where('holdUserId', '==', uid)));
  const holdId = `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const holdUntil = Date.now() + HOLD_MINUTES * 60 * 1000;

  await runTransaction(db, async (tx) => {
    const selectedRefs = keys.map((key) => doc(db, 'shows', showId, 'seats', key));
    const prevRefs = prevSnap.docs.map((row) => row.ref);
    const unique = new Map(selectedRefs.concat(prevRefs).map((ref) => [ref.path, ref]));
    const reads = new Map<string, DocumentData | undefined>();
    for (const ref of unique.values()) {
      const snap = await tx.get(ref);
      reads.set(ref.path, snap.exists() ? snap.data() : undefined);
    }

    for (const key of keys) {
      const data = reads.get(doc(db, 'shows', showId, 'seats', key).path);
      if (!data) continue;
      if (data.status === 'booked') throw new ApiError(409, 'One or more seats were just booked');
      if (data.status === 'held' && Number(data.holdUntil ?? 0) > Date.now() && data.holdUserId !== uid) {
        throw new ApiError(409, 'Those seats were just taken. Pick another.');
      }
    }

    for (const row of prevSnap.docs) {
      if (!keys.includes(row.id)) tx.delete(row.ref);
    }
    for (const seat of selected) {
      tx.set(doc(db, 'shows', showId, 'seats', seat.seatKey), {
        status: 'held',
        holdId,
        holdUserId: uid,
        holdUntil,
        row: seat.row,
        number: seat.number,
        category: seat.category,
        updatedAt: Date.now(),
      });
    }
  });

  const movieSnap = await getDoc(doc(db, 'movies', String(show.movieSlug)));
  const movie = movieSnap.exists()
    ? movieFromData(movieSnap.id, movieSnap.data())
    : movieFromData(String(show.movieSlug), { title: show.movieTitle, slug: show.movieSlug });
  const lines = selected.map((seat) => ({
    id: seat.seatKey,
    row: seat.row,
    number: seat.number,
    category: seat.category,
    label: seat.seatKey,
    priceMinor: getSeatPriceMinor(Number(show.basePriceMinor ?? 0), seat.category),
  }));
  const subtotalMinor = lines.reduce((sum, s) => sum + s.priceMinor, 0);
  const feeMinor = convenienceFee(subtotalMinor, Number(show.convenienceBps ?? 1200), Number(show.convenienceFlatMinor ?? 1900));

  return {
    holdId,
    expiresAt: new Date(holdUntil).toISOString(),
    showId,
    movie,
    cinema: {
      name: String(show.cinemaName ?? ''),
      mall: String(show.cinemaMall ?? ''),
      city: String(show.city ?? ''),
    },
    startsAt: asIso(show.startsAt),
    seats: lines,
    subtotalMinor,
    feeMinor,
    discountMinor: 0,
    totalMinor: subtotalMinor + feeMinor,
    currency: String(show.currency ?? 'INR'),
  };
}

export async function checkoutHold(holdId: string, promoCode?: string) {
  try {
    await checkoutHoldInner(holdId, promoCode);
  } catch (err) {
    throw toApiError(err);
  }
}

async function checkoutHoldInner(holdId: string, promoCode?: string) {
  const uid = requireUid();
  const user = auth.currentUser;
  const raw = sessionStorage.getItem('movietix.hold');
  if (!raw) throw new ApiError(410, 'Your seat hold expired. Please select seats again.');
  const hold = JSON.parse(raw) as HoldSummary;
  if (hold.holdId !== holdId) throw new ApiError(410, 'Your seat hold expired. Please select seats again.');

  const profileSnap = await getDoc(doc(db, 'users', uid));
  const profile = profileSnap.data() ?? {};

  await runTransaction(db, async (tx) => {
    const showRef = doc(db, 'shows', hold.showId);
    const showSnap = await tx.get(showRef);
    if (!showSnap.exists()) throw new ApiError(404, 'Show not found');
    const show = showSnap.data();

    const seatRefs = hold.seats.map((s) => doc(db, 'shows', hold.showId, 'seats', seatKey(s.row, s.number)));
    const seatSnaps = [];
    for (const ref of seatRefs) {
      seatSnaps.push(await tx.get(ref));
    }

    for (const snap of seatSnaps) {
      if (!snap.exists()) throw new ApiError(410, 'Your seat hold expired. Please select seats again.');
      const d = snap.data();
      if (d.status !== 'held' || d.holdUserId !== uid || d.holdId !== holdId || Number(d.holdUntil ?? 0) < Date.now()) {
        throw new ApiError(410, 'Your seat hold expired. Please select seats again.');
      }
    }

    let discountMinor = 0;
    let appliedPromo: string | undefined;
    const code = promoCode?.trim().toUpperCase();
    if (code) {
      const promoSnap = await tx.get(doc(db, 'promoCodes', code));
      if (!promoSnap.exists() || promoSnap.data()?.active === false) throw new ApiError(400, 'Invalid promo code');
      discountMinor = Math.round((hold.subtotalMinor * Number(promoSnap.data()?.percentOff ?? 0)) / 100);
      appliedPromo = code;
    }

    const feeMinor = hold.feeMinor;
    const totalMinor = hold.subtotalMinor + feeMinor - discountMinor;
    const ticketCode = bookingCode();
    const qrPayload = JSON.stringify({ v: 1, code: ticketCode, show: hold.showId, seats: hold.seats.map((s) => seatKey(s.row, s.number)) });
    const bookingRef = doc(collection(db, 'bookings'));

    tx.set(bookingRef, {
      code: ticketCode,
      userId: uid,
      customerName: String(profile.name ?? user?.displayName ?? 'Guest'),
      customerEmail: String(profile.email ?? user?.email ?? ''),
      tenantId: show.tenantId ?? null,
      cinemaId: show.cinemaId,
      cinemaName: show.cinemaName,
      cinemaMall: show.cinemaMall,
      city: show.city,
      country: show.country ?? '',
      showId: hold.showId,
      startsAt: show.startsAt,
      movieSlug: show.movieSlug,
      movieTitle: hold.movie.title,
      movie: {
        id: hold.movie.id,
        title: hold.movie.title,
        imageUrl: hold.movie.imageUrl,
        backdropUrl: hold.movie.backdropUrl,
        description: hold.movie.description,
        durationMin: hold.movie.durationMin,
        genres: hold.movie.genre,
        language: hold.movie.language,
        certification: hold.movie.certification,
        formats: hold.movie.formats,
        cast: hold.movie.cast,
        director: hold.movie.director,
        status: hold.movie.status,
        releaseDate: hold.movie.releaseDate,
        featured: hold.movie.featured,
        rating: hold.movie.rating,
      },
      seats: hold.seats.map((s) => ({
        seatKey: seatKey(s.row, s.number),
        row: s.row,
        number: s.number,
        category: s.category,
        priceMinor: s.priceMinor,
      })),
      status: 'CONFIRMED',
      subtotalMinor: hold.subtotalMinor,
      feeMinor,
      discountMinor,
      totalMinor,
      currency: hold.currency,
      promoCode: appliedPromo ?? null,
      qrPayload,
      createdAt: serverTimestamp(),
    });

    for (const snap of seatSnaps) {
      tx.update(snap.ref, {
        status: 'booked',
        bookingId: bookingRef.id,
        holdId: null,
        holdUserId: null,
        holdUntil: 0,
        updatedAt: Date.now(),
      });
    }

    tx.update(showRef, { soldCount: Number(show.soldCount ?? 0) + seatSnaps.length });
  });
}

const ticketFromBooking = (id: string, d: DocumentData): Ticket => {
  const movie = d.movie && typeof d.movie === 'object'
    ? movieFromData(String(d.movieSlug ?? d.movie.id), d.movie)
    : movieFromData(String(d.movieSlug ?? ''), { title: d.movieTitle, slug: d.movieSlug });
  const seats = Array.isArray(d.seats)
    ? d.seats.map((s: DocumentData) => ({
        id: String(s.seatKey ?? `${s.row}-${s.number}`),
        row: String(s.row ?? ''),
        number: Number(s.number ?? 0),
        category: (s.category ?? 'regular') as Ticket['seats'][number]['category'],
      }))
    : [];
  return {
    id,
    code: String(d.code ?? ''),
    movie,
    cinema: {
      name: String(d.cinemaName ?? ''),
      mall: String(d.cinemaMall ?? ''),
      city: String(d.city ?? ''),
      country: d.country ? String(d.country) : undefined,
    },
    showDate: asIso(d.startsAt),
    seats,
    subtotalMinor: Number(d.subtotalMinor ?? 0),
    convenienceFee: Number(d.feeMinor ?? 0),
    discount: Number(d.discountMinor ?? 0),
    totalAmount: Number(d.totalMinor ?? 0),
    currency: String(d.currency ?? 'INR'),
    purchaseDate: asIso(d.createdAt),
    qrPayload: d.qrPayload ? String(d.qrPayload) : undefined,
    city: d.city ? String(d.city) : undefined,
  };
};

export async function fetchTickets(): Promise<Ticket[]> {
  const uid = requireUid();
  const snap = await getDocs(
    query(collection(db, 'bookings'), where('userId', '==', uid), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((row) => ticketFromBooking(row.id, row.data()));
}

const staffTenant = (user: AuthUser) =>
  user.role === 'PLATFORM_ADMIN' || !user.tenantId ? null : user.tenantId;

export async function fetchAdminOverview(user: AuthUser): Promise<AdminOverview> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const tenantId = staffTenant(user);
  const bookingQuery = tenantId
    ? query(collection(db, 'bookings'), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'), limit(200))
    : query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(200));
  const [bookingSnap, showSnap, cinemaSnap] = await Promise.all([
    getDocs(bookingQuery),
    tenantId
      ? getDocs(query(collection(db, 'shows'), where('tenantId', '==', tenantId), where('startsAt', '>=', Timestamp.fromDate(new Date())), limit(500)))
      : getDocs(query(collection(db, 'shows'), where('startsAt', '>=', Timestamp.fromDate(new Date())), limit(500))),
    tenantId
      ? getDocs(query(collection(db, 'cinemas'), where('tenantId', '==', tenantId)))
      : getDocs(collection(db, 'cinemas')),
  ]);

  const today = bookingSnap.docs.filter((row) => asMillis(row.data().createdAt) >= start.getTime());
  const gmv = today.reduce((sum, row) => sum + Number(row.data().totalMinor ?? 0), 0);
  return {
    gmvMinor: gmv,
    currency: today[0]?.data().currency ?? bookingSnap.docs[0]?.data().currency ?? 'INR',
    bookingsToday: today.length,
    upcomingShows: showSnap.size,
    cinemas: cinemaSnap.size,
  };
}

export async function fetchAdminBookings(user: AuthUser): Promise<AdminBookingRow[]> {
  const tenantId = staffTenant(user);
  const snap = await getDocs(
    tenantId
      ? query(collection(db, 'bookings'), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'), limit(100))
      : query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(100))
  );
  return snap.docs.map((row) => {
    const d = row.data();
    const seats = Array.isArray(d.seats) ? d.seats.map((s: DocumentData) => `${s.row}${s.number}`).join(', ') : '';
    return {
      id: row.id,
      code: String(d.code ?? ''),
      customer: String(d.customerName ?? ''),
      email: String(d.customerEmail ?? ''),
      movie: String(d.movieTitle ?? d.movie?.title ?? ''),
      cinema: `${d.cinemaName ?? ''}, ${d.cinemaMall ?? ''}`,
      city: String(d.city ?? ''),
      startsAt: asIso(d.startsAt),
      seats,
      totalMinor: Number(d.totalMinor ?? 0),
      currency: String(d.currency ?? 'INR'),
      status: String(d.status ?? 'CONFIRMED'),
    };
  });
}

export async function fetchAdminShows(user: AuthUser): Promise<AdminShowRow[]> {
  const tenantId = staffTenant(user);
  const since = Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000));
  const snap = await getDocs(
    tenantId
      ? query(collection(db, 'shows'), where('tenantId', '==', tenantId), where('startsAt', '>=', since), orderBy('startsAt'), limit(80))
      : query(collection(db, 'shows'), where('startsAt', '>=', since), orderBy('startsAt'), limit(80))
  );
  return snap.docs.map((row) => {
    const d = row.data();
    return {
      id: row.id,
      movie: String(d.movieTitle ?? d.movieSlug ?? ''),
      cinema: `${d.cinemaName ?? ''} · ${d.cinemaMall ?? ''}`,
      city: String(d.city ?? ''),
      screen: String(d.screen ?? ''),
      startsAt: asIso(d.startsAt),
      format: String(d.format ?? '2D'),
      sold: Number(d.soldCount ?? 0),
      capacity: HALL_CAPACITY,
      basePriceMinor: Number(d.basePriceMinor ?? 0),
      currency: String(d.currency ?? 'INR'),
    };
  });
}
