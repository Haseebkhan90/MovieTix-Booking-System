import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';
import { Movie } from '../types';
import { formatINR } from '../utils/booking';

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  return (
    <Link to={`/movie/${movie.id}`} className="group block">
      <article className="overflow-hidden rounded-2xl border border-cinema-border bg-cinema-card transition duration-300 group-hover:-translate-y-1 group-hover:border-cinema-accent/50 group-hover:shadow-glow">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={movie.imageUrl}
            alt={movie.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
          <span className="absolute left-3 top-3 rounded-md bg-black/70 px-2 py-0.5 text-xs font-semibold">
            {movie.certification}
          </span>
          {movie.status === 'coming-soon' && (
            <span className="absolute right-3 top-3 rounded-md bg-cinema-accent px-2 py-0.5 text-[11px] font-bold uppercase">
              Soon
            </span>
          )}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="mb-1 flex items-center gap-1 text-cinema-gold">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-semibold text-white">{movie.rating.toFixed(1)}</span>
            </div>
            <h3 className="text-lg font-bold leading-tight text-white">{movie.title}</h3>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm text-zinc-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {movie.duration}
          </span>
          <span className="font-semibold text-white">
            {movie.status === 'coming-soon' ? 'Notify' : `from ${formatINR(movie.price)}`}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 px-4 pb-4">
          <span className="chip">{movie.language}</span>
          {movie.genre.slice(0, 2).map((g) => (
            <span key={g} className="chip">
              {g}
            </span>
          ))}
        </div>
      </article>
    </Link>
  );
};
