import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MovieCard } from '../components/MovieCard';
import { HeroBanner } from '../components/HeroBanner';
import { allGenres, movies } from '../data/movies';
import { useCity } from '../context/CityContext';

export const HomePage = () => {
  const { city } = useCity();
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim().toLowerCase();
  const [genre, setGenre] = useState('All');
  const [language, setLanguage] = useState('All');

  const languages = useMemo(
    () => ['All', ...Array.from(new Set(movies.map((m) => m.language)))],
    []
  );

  const filtered = movies.filter((movie) => {
    const matchesQuery =
      !q ||
      movie.title.toLowerCase().includes(q) ||
      movie.genre.some((g) => g.toLowerCase().includes(q)) ||
      movie.language.toLowerCase().includes(q);
    const matchesGenre = genre === 'All' || movie.genre.includes(genre);
    const matchesLanguage = language === 'All' || movie.language === language;
    return matchesQuery && matchesGenre && matchesLanguage;
  });

  const nowShowing = filtered.filter((m) => m.status === 'now-showing');
  const comingSoon = filtered.filter((m) => m.status === 'coming-soon');

  return (
    <div>
      {!q && <HeroBanner movies={movies} />}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-cinema-accent">Cinemas in {city}</p>
            <h2 className="text-3xl font-bold">{q ? `Results for “${q}”` : 'Now Showing'}</h2>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {['All', ...allGenres].map((g) => (
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
                language === lang
                  ? 'border-cinema-accent text-cinema-accent'
                  : 'border-cinema-border text-zinc-400'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {nowShowing.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-cinema-border p-10 text-center text-zinc-400">
            No movies match those filters. Try another genre or city search.
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
