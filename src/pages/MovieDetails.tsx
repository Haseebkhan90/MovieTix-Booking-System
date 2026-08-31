import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Clock, MapPin, Star } from 'lucide-react';
import { getMovieById } from '../data/movies';
import { SHOW_TIMES, getCinemasByCity } from '../data/cinemas';
import { useCity } from '../context/CityContext';
import { formatINR, formatShowDate, getShowDates, isShowtimePast, toDateKey } from '../utils/booking';

export const MovieDetails = () => {
  const { id } = useParams();
  const movie = getMovieById(Number(id));
  const { city } = useCity();
  const navigate = useNavigate();
  const dates = useMemo(() => getShowDates(7), []);
  const [dateKey, setDateKey] = useState(toDateKey(dates[0]));
  const cinemas = getCinemasByCity(city);

  if (!movie) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Movie not found</h1>
        <Link to="/" className="btn-primary mt-6">
          Back to movies
        </Link>
      </div>
    );
  }

  const comingSoon = movie.status === 'coming-soon';

  const book = (cinemaId: string, time: string) => {
    navigate(`/movie/${movie.id}/seats?cinema=${cinemaId}&date=${dateKey}&time=${encodeURIComponent(time)}`);
  };

  return (
    <div>
      <section className="relative min-h-[360px] overflow-hidden">
        <img src={movie.backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-bg via-cinema-bg/80 to-cinema-bg/30" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[220px_1fr]">
          <img
            src={movie.imageUrl}
            alt={movie.title}
            className="h-80 w-full rounded-2xl object-cover shadow-2xl md:h-auto"
          />
          <div className="flex flex-col justify-end">
            <p className="text-sm text-cinema-accent">{comingSoon ? 'Coming soon' : `Now showing in ${city}`}</p>
            <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{movie.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
              <span className="inline-flex items-center gap-1 text-cinema-gold">
                <Star className="h-4 w-4 fill-current" />
                {movie.rating.toFixed(1)}/10
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5">{movie.certification}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {movie.duration}
              </span>
              <span>{movie.language}</span>
              <span>{movie.formats.join(' • ')}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {movie.genre.map((g) => (
                <span key={g} className="chip">
                  {g}
                </span>
              ))}
            </div>
            <p className="mt-5 max-w-2xl text-zinc-300">{movie.description}</p>
            <p className="mt-4 text-sm text-zinc-400">
              <span className="text-zinc-200">Director:</span> {movie.director}
            </p>
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-200">Cast:</span> {movie.cast.join(', ')}
            </p>
            <p className="mt-3 text-sm text-zinc-400">Tickets from {formatINR(movie.price)}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {comingSoon ? (
          <div className="card-surface p-8 text-center">
            <p className="text-lg font-semibold">Bookings open closer to release</p>
            <p className="mt-2 text-zinc-400">
              Expected {new Date(movie.releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <Link to="/" className="btn-primary mt-6">
              Browse now showing
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              {dates.map((d) => {
                const key = toDateKey(d);
                const active = key === dateKey;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDateKey(key)}
                    className={`min-w-[84px] rounded-2xl border px-3 py-3 text-center ${
                      active
                        ? 'border-cinema-accent bg-cinema-accent text-white'
                        : 'border-cinema-border bg-cinema-card text-zinc-300'
                    }`}
                  >
                    <div className="text-[10px] uppercase">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                    <div className="text-lg font-bold">{d.getDate()}</div>
                    <div className="text-[10px] uppercase">{d.toLocaleDateString('en-IN', { month: 'short' })}</div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              {cinemas.map((cinema) => (
                <div key={cinema.id} className="card-surface p-5">
                  <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {cinema.name}: {cinema.mall}
                      </h3>
                      <p className="flex items-center gap-1 text-sm text-zinc-400">
                        <MapPin className="h-3.5 w-3.5" />
                        {cinema.city}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cinema.amenities.map((a) => (
                        <span key={a} className="chip">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SHOW_TIMES.map((time) => {
                      const past = isShowtimePast(dateKey, time);
                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={past}
                          onClick={() => book(cinema.id, time)}
                          className="rounded-xl border border-emerald-500/40 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-600"
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-zinc-500">{formatShowDate(dateKey)} • Cancellation as per cinema policy</p>
          </>
        )}
      </div>
    </div>
  );
};
