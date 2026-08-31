import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';
import { Movie } from '../types';

interface HeroBannerProps {
  movies: Movie[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ movies }) => {
  const [index, setIndex] = useState(0);
  const featured = movies.filter((m) => m.featured && m.status === 'now-showing');
  const current = featured[index];

  useEffect(() => {
    if (featured.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % featured.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [featured.length]);

  if (!current) return null;

  const go = (dir: number) => {
    setIndex((i) => (i + dir + featured.length) % featured.length);
  };

  return (
    <section className="relative h-[70vh] min-h-[420px] overflow-hidden">
      {featured.map((movie, i) => (
        <img
          key={movie.id}
          src={movie.backdropUrl}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-hero-fade" />
      <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-cinema-bg/40 to-black/20" />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-12 sm:px-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-cinema-accent">Now in cinemas</p>
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-6xl">{current.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
          <span className="inline-flex items-center gap-1 text-cinema-gold">
            <Star className="h-4 w-4 fill-current" />
            {current.rating.toFixed(1)}
          </span>
          <span>{current.certification}</span>
          <span>{current.language}</span>
          <span>{current.duration}</span>
          <span>{current.formats.join(' • ')}</span>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">{current.description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/movie/${current.id}`} className="btn-primary">
            Book tickets
          </Link>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${current.title} official trailer`)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            <Play className="h-4 w-4" />
            Trailer
          </a>
        </div>
        <div className="mt-8 flex items-center gap-2">
          {featured.map((m, i) => (
            <button
              key={m.id}
              type="button"
              aria-label={`Show ${m.title}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-8 bg-cinema-accent' : 'w-3 bg-white/30'}`}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 text-white md:block"
        aria-label="Previous featured movie"
      >
        <ChevronLeft />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 text-white md:block"
        aria-label="Next featured movie"
      >
        <ChevronRight />
      </button>
    </section>
  );
};
