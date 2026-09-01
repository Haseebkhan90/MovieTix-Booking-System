import { FormEvent, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Film, MapPin, Menu, Search, Ticket, User, X } from 'lucide-react';
import { useCity } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition ${isActive ? 'text-cinema-accent' : 'text-zinc-300 hover:text-white'}`;

export const Navbar = () => {
  const { city, setCity, cities } = useCity();
  const { user, isStaff, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
    setOpen(false);
  };

  const grouped = cities.reduce<Record<string, typeof cities>>((acc, item) => {
    acc[item.country] = acc[item.country] || [];
    acc[item.country].push(item);
    return acc;
  }, {});

  return (
    <header className="relative sticky top-0 z-40 border-b border-white/5 bg-cinema-bg/85 backdrop-blur-xl">
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

        <nav className="hidden items-center gap-5 md:flex">
          <NavLink to="/" className={navClass} end>
            Movies
          </NavLink>
          <NavLink to="/my-tickets" className={navClass}>
            <span className="inline-flex items-center gap-1">
              <Ticket className="h-4 w-4" />
              Tickets
            </span>
          </NavLink>
          {isStaff && (
            <NavLink to="/admin" className={navClass}>
              Dashboard
            </NavLink>
          )}
          {user ? (
            <NavLink to="/profile" className={navClass}>
              <span className="inline-flex items-center gap-1">
                <User className="h-4 w-4" />
                {user.name.split(' ')[0]}
              </span>
            </NavLink>
          ) : (
            <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className="btn-primary !px-3 !py-1.5 text-xs">
              Sign in
            </Link>
          )}
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
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-4">
            {Object.entries(grouped).map(([country, list]) => (
              <div key={country}>
                <p className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">{country}</p>
                <div className="flex flex-wrap gap-2">
                  {list.map((c) => (
                    <button
                      key={c.city}
                      type="button"
                      onClick={() => {
                        setCity(c.city);
                        setCityOpen(false);
                      }}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        city === c.city ? 'bg-cinema-accent text-white' : 'bg-cinema-card text-zinc-200 hover:bg-cinema-elevated'
                      }`}
                    >
                      {c.city}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div className="border-t border-cinema-border bg-cinema-surface px-4 py-4 md:hidden">
          <form onSubmit={onSearch} className="mb-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search movies" className="input-field" />
          </form>
          <div className="flex flex-col gap-3">
            <Link to="/" onClick={() => setOpen(false)}>Movies</Link>
            <Link to="/my-tickets" onClick={() => setOpen(false)}>My Tickets</Link>
            {isStaff && <Link to="/admin" onClick={() => setOpen(false)}>Dashboard</Link>}
            {user ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)}>{user.name}</Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
