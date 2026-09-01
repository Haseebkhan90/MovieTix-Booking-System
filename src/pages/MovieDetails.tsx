import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Clock, MapPin, Star } from 'lucide-react';
import { api, formatMoney } from '../api/client';
import { Movie } from '../types';
import { useCity } from '../context/CityContext';

type Showtime = {
  id: string;
  startsAt: string;
  format: string;
  language: string;
  screen: string;
  basePriceMinor: number;
  currency: string;
  past: boolean;
};

type CinemaRow = {
  id: string;
  name: string;
  mall: string;
  city: string;
  amenities: string[];
  currency: string;
  shows: Showtime[];
};

const dateKeys = (count = 7) => {
  const out: string[] = [];
  const start = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    out.push(`${y}-${m}-${day}`);
  }
  return out;
};

const formatDay = (key: string) => {
  const d = new Date(`${key}T12:00:00`);
  return {
    wk: d.toLocaleDateString(undefined, { weekday: 'short' }),
    day: d.getDate(),
    mo: d.toLocaleDateString(undefined, { month: 'short' }),
  };
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export const MovieDetails = () => {
  const { id } = useParams();
  const { city } = useCity();
  const navigate = useNavigate();
  const dates = useMemo(() => dateKeys(7), []);
  const [dateKey, setDateKey] = useState(dates[0]);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [cinemas, setCinemas] = useState<CinemaRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api<Movie>(`/movies/${id}`)
      .then(setMovie)
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api<{ cinemas: CinemaRow[] }>(`/movies/${id}/showtimes?city=${encodeURIComponent(city)}&date=${dateKey}`)
      .then((data) => setCinemas(data.cinemas))
      .catch((err) => setError(err.message));
  }, [id, city, dateKey]);

  if (error && !movie) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Movie not found</h1>
        <Link to="/" className="btn-primary mt-6">Back to movies</Link>
      </div>
    );
  }
  if (!movie) return <div className="px-4 py-24 text-center text-zinc-400">Loading…</div>;

  const comingSoon = movie.status === 'coming-soon';

  return (
    <div>
      <section className="relative min-h-[360px] overflow-hidden">
        <img src={movie.backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-bg via-cinema-bg/80 to-cinema-bg/30" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[220px_1fr]">
          <img src={movie.imageUrl} alt={movie.title} className="h-80 w-full rounded-2xl object-cover shadow-2xl md:h-auto" />
          <div className="flex flex-col justify-end">
            <p className="text-sm text-cinema-accent">{comingSoon ? 'Coming soon' : `Now showing in ${city}`}</p>
            <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{movie.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
              <span className="inline-flex items-center gap-1 text-cinema-gold">
                <Star className="h-4 w-4 fill-current" />
                {movie.rating.toFixed(1)}/10
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5">{movie.certification}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{movie.duration}</span>
              <span>{movie.language}</span>
              <span>{movie.formats.join(' • ')}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {movie.genre.map((g) => (
                <span key={g} className="chip">{g}</span>
              ))}
            </div>
            <p className="mt-5 max-w-2xl text-zinc-300">{movie.description}</p>
            <p className="mt-4 text-sm text-zinc-400"><span className="text-zinc-200">Director:</span> {movie.director}</p>
            <p className="text-sm text-zinc-400"><span className="text-zinc-200">Cast:</span> {movie.cast.join(', ')}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {comingSoon ? (
          <div className="card-surface p-8 text-center">
            <p className="text-lg font-semibold">Bookings open closer to release</p>
            <Link to="/" className="btn-primary mt-6">Browse now showing</Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              {dates.map((key) => {
                const meta = formatDay(key);
                const active = key === dateKey;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDateKey(key)}
                    className={`min-w-[84px] rounded-2xl border px-3 py-3 text-center ${
                      active ? 'border-cinema-accent bg-cinema-accent text-white' : 'border-cinema-border bg-cinema-card text-zinc-300'
                    }`}
                  >
                    <div className="text-[10px] uppercase">{meta.wk}</div>
                    <div className="text-lg font-bold">{meta.day}</div>
                    <div className="text-[10px] uppercase">{meta.mo}</div>
                  </button>
                );
              })}
            </div>
            <div className="space-y-4">
              {cinemas.map((cinema) => (
                <div key={cinema.id} className="card-surface p-5">
                  <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">{cinema.name}: {cinema.mall}</h3>
                      <p className="flex items-center gap-1 text-sm text-zinc-400"><MapPin className="h-3.5 w-3.5" />{cinema.city}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cinema.amenities.map((a) => (
                        <span key={a} className="chip">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cinema.shows.length === 0 && <p className="text-sm text-zinc-500">No shows this date</p>}
                    {cinema.shows.map((show) => (
                      <button
                        key={show.id}
                        type="button"
                        disabled={show.past}
                        onClick={() => navigate(`/movie/${id}/seats?show=${show.id}`)}
                        className="rounded-xl border border-emerald-500/40 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-600"
                      >
                        {formatTime(show.startsAt)}
                        <span className="ml-2 text-[10px] text-zinc-400">{show.format}</span>
                        <span className="ml-2 text-[10px] text-zinc-500">{formatMoney(show.basePriceMinor, show.currency)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
