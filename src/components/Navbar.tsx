import { FormEvent, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Film, MapPin, Menu, Search, Ticket, User, X } from 'lucide-react';
import { CITIES, City } from '../data/cinemas';
import { useCity } from '../context/CityContext';
import { useTicketContext } from '../context/TicketContext';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition ${isActive ? 'text-cinema-accent' : 'text-zinc-300 hover:text-white'}`;

export const Navbar = () => {
  const { city, setCity } = useCity();
  const { tickets } = useTicketContext();
  const [open, setOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
    setOpen(false);
  };

  const pickCity = (next: City) => {
    setCity(next);
    setCityOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-cinema-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cinema-accent">
            <Film className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Movie<span className="text-cinema-accent">Tix</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setCityOpen((v) => !v)}
          className="hidden items-center gap-1 rounded-full border border-cinema-border bg-cinema-card px-3 py-1.5 text-sm text-zinc-200 md:flex"
        >
          <MapPin className="h-4 w-4 text-cinema-accent" />
          {city}
        </button>

        <form onSubmit={onSearch} className="relative hidden min-w-0 flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, genres, languages"
            className="input-field pl-9"
            aria-label="Search movies"
          />
        </form>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" className={navClass} end>
            Movies
          </NavLink>
          <NavLink to="/my-tickets" className={navClass}>
            <span className="inline-flex items-center gap-1">
              <Ticket className="h-4 w-4" />
              Tickets
              {tickets.length > 0 && (
                <span className="rounded-full bg-cinema-accent px-1.5 text-[10px] font-bold text-white">
                  {tickets.length}
                </span>
              )}
            </span>
          </NavLink>
          <NavLink to="/profile" className={navClass}>
            <span className="inline-flex items-center gap-1">
              <User className="h-4 w-4" />
              Profile
            </span>
          </NavLink>
        </nav>

        <button
          type="button"
          className="ml-auto rounded-lg p-2 text-zinc-200 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {cityOpen && (
        <div className="absolute left-0 right-0 z-50 border-b border-cinema-border bg-cinema-surface">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-4 sm:grid-cols-3 md:grid-cols-6">
            {CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => pickCity(c)}
                className={`rounded-xl px-3 py-2 text-sm ${
                  city === c ? 'bg-cinema-accent text-white' : 'bg-cinema-card text-zinc-200 hover:bg-cinema-elevated'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div className="border-t border-cinema-border bg-cinema-surface px-4 py-4 md:hidden">
          <form onSubmit={onSearch} className="mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies"
              className="input-field"
            />
          </form>
          <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">City</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => pickCity(c)}
                className={`rounded-full px-3 py-1 text-xs ${
                  city === c ? 'bg-cinema-accent text-white' : 'bg-cinema-card text-zinc-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/" onClick={() => setOpen(false)}>
              Movies
            </Link>
            <Link to="/my-tickets" onClick={() => setOpen(false)}>
              My Tickets
            </Link>
            <Link to="/profile" onClick={() => setOpen(false)}>
              Profile
            </Link>
            {location.pathname !== '/about' && (
              <Link to="/about" onClick={() => setOpen(false)}>
                About
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
