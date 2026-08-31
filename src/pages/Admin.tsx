import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Clapperboard, Film, LayoutDashboard, LogOut, Ticket } from 'lucide-react';
import { api, formatMoney } from '../api/client';
import { useAuth } from '../context/AuthContext';

type Overview = {
  gmvMinor: number;
  currency: string;
  bookingsToday: number;
  upcomingShows: number;
  cinemas: number;
};

type BookingRow = {
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

type ShowRow = {
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

export const Admin = () => {
  const { user, loading, isStaff, logout } = useAuth();
  const [tab, setTab] = useState<'overview' | 'shows' | 'bookings'>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [shows, setShows] = useState<ShowRow[]>([]);

  useEffect(() => {
    if (!isStaff) return;
    api<Overview>('/admin/overview').then(setOverview).catch(() => undefined);
    api<BookingRow[]>('/admin/bookings').then(setBookings).catch(() => setBookings([]));
    api<ShowRow[]>('/admin/shows').then(setShows).catch(() => setShows([]));
  }, [isStaff]);

  if (loading) return <div className="py-24 text-center text-zinc-400">Loading…</div>;
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (!isStaff) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Staff only</h1>
        <p className="mt-2 text-zinc-400">Sign in as admin@movietix.app / Ticket@123</p>
        <Link to="/" className="btn-primary mt-6">Back</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cinema-bg md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-cinema-border p-5 md:border-b-0 md:border-r">
        <Link to="/" className="mb-8 flex items-center gap-2 font-extrabold">
          <Film className="h-5 w-5 text-cinema-accent" /> MovieTix Ops
        </Link>
        <nav className="space-y-1 text-sm">
          <button type="button" onClick={() => setTab('overview')} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 ${tab === 'overview' ? 'bg-cinema-accent' : 'hover:bg-cinema-card'}`}>
            <LayoutDashboard className="h-4 w-4" /> Overview
          </button>
          <button type="button" onClick={() => setTab('shows')} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 ${tab === 'shows' ? 'bg-cinema-accent' : 'hover:bg-cinema-card'}`}>
            <Clapperboard className="h-4 w-4" /> Shows
          </button>
          <button type="button" onClick={() => setTab('bookings')} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 ${tab === 'bookings' ? 'bg-cinema-accent' : 'hover:bg-cinema-card'}`}>
            <Ticket className="h-4 w-4" /> Bookings
          </button>
        </nav>
        <button type="button" onClick={logout} className="mt-8 flex items-center gap-2 text-sm text-zinc-400">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>
      <section className="p-6">
        <p className="text-sm text-zinc-500">{user.name} · {user.role}</p>
        <h1 className="mb-6 text-3xl font-bold capitalize">{tab}</h1>
        {tab === 'overview' && overview && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Gross today" value={formatMoney(overview.gmvMinor, overview.currency)} />
            <Stat label="Bookings today" value={String(overview.bookingsToday)} />
            <Stat label="Upcoming shows" value={String(overview.upcomingShows)} />
            <Stat label="Cinemas" value={String(overview.cinemas)} />
          </div>
        )}
        {tab === 'shows' && (
          <div className="overflow-x-auto rounded-2xl border border-cinema-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-cinema-card text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Movie</th>
                  <th className="px-4 py-3">Cinema</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">Sold</th>
                </tr>
              </thead>
              <tbody>
                {shows.map((s) => (
                  <tr key={s.id} className="border-t border-cinema-border">
                    <td className="px-4 py-3">{s.movie}</td>
                    <td className="px-4 py-3">{s.cinema} · {s.city}</td>
                    <td className="px-4 py-3">{new Date(s.startsAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{s.sold}/{s.capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'bookings' && (
          <div className="overflow-x-auto rounded-2xl border border-cinema-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-cinema-card text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Film</th>
                  <th className="px-4 py-3">Seats</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-cinema-border">
                    <td className="px-4 py-3 font-mono text-xs">{b.code}</td>
                    <td className="px-4 py-3">{b.customer}</td>
                    <td className="px-4 py-3">{b.movie}</td>
                    <td className="px-4 py-3">{b.seats}</td>
                    <td className="px-4 py-3">{formatMoney(b.totalMinor, b.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="card-surface p-5">
    <p className="text-xs uppercase text-zinc-500">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
);
