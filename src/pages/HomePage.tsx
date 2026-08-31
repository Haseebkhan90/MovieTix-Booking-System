import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MovieCard } from '../components/MovieCard';
import { HeroBanner } from '../components/HeroBanner';
import { api } from '../api/client';
import { Movie } from '../types';
import { useCity } from '../context/CityContext';

export const HomePage = () => {
  const { city } = useCity();
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const [genre, setGenre] = useState('All');
  const [language, setLanguage] = useState('All');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams({ city });
    if (q) query.set('search', q);
    if (genre !== 'All') query.set('genre', genre);
    if (language !== 'All') query.set('language', language);
    api<Movie[]>(`/movies?${query}`)
      .then(setMovies)
      .catch((err) => setError(err.message));
  }, [city, q, genre, language]);

  const genres = useMemo(() => ['All', ...Array.from(new Set(movies.flatMap((m) => m.genre)))], [movies]);
  const languages = useMemo(
    () => ['All', ...Array.from(new Set(movies.map((m) => m.language)))],
    [movies]
  );
  const nowShowing = movies.filter((m) => m.status === 'now-showing');
  const comingSoon = movies.filter((m) => m.status === 'coming-soon');
  const featured = nowShowing.filter((m) => m.featured);

  return (
    <div>
      {!q && featured.length > 0 && <HeroBanner movies={featured} />}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="text-sm text-cinema-accent">Now playing in {city}</p>
        <h2 className="mb-6 text-3xl font-bold">{q ? `Results for “${q}”` : 'Now Showing'}</h2>
        {error && <p className="mb-4 text-rose-300">{error}</p>}

        <div className="mb-6 flex flex-wrap gap-2">
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenre(g)}
              className={`rounded-full px-4 py-1.5 text-sm ${
                genre === g ? 'bg-cinema-accent text-white' : 'bg-cinema-card text-zinc-300 hover:bg-cinema-elevated'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="mb-8 flex flex-wrap gap-2">
          {languages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`rounded-full border px-3 py-1 text-xs ${
                language === lang ? 'border-cinema-accent text-cinema-accent' : 'border-cinema-border text-zinc-400'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {nowShowing.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-cinema-border p-10 text-center text-zinc-400">
            {error ? 'API is starting up — run npm run dev from the repo root.' : 'No titles in this city yet. Try another city.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {nowShowing.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}

        {comingSoon.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-6 text-2xl font-bold">Coming Soon</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {comingSoon.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
