import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Ticket, User } from 'lucide-react';
import { formatMoney } from '../api/client';
import { fetchTickets } from '../lib/firestore';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { Ticket as TicketType } from '../types';

export const Profile = () => {
  const { user, logout, isStaff } = useAuth();
  const { city } = useCity();
  const [tickets, setTickets] = useState<TicketType[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchTickets().then(setTickets).catch(() => setTickets([]));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">You’re browsing as a guest</h1>
        <Link to="/login?next=/profile" className="btn-primary mt-6">Create a free account</Link>
      </div>
    );
  }

  const spent = tickets.reduce((sum, t) => sum + t.totalAmount, 0);
  const currency = tickets[0]?.currency ?? 'INR';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="card-surface p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cinema-accent/20 text-cinema-accent">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-sm text-zinc-400">{user.email}</p>
            <p className="flex items-center gap-1 text-sm text-zinc-400">
              <MapPin className="h-4 w-4" />
              {city} · {user.role.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-cinema-elevated p-4">
            <p className="text-xs uppercase text-zinc-500">Bookings</p>
            <p className="mt-1 text-3xl font-bold">{tickets.length}</p>
          </div>
          <div className="rounded-2xl bg-cinema-elevated p-4">
            <p className="text-xs uppercase text-zinc-500">Total spent</p>
            <p className="mt-1 text-3xl font-bold">{formatMoney(spent, currency)}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/my-tickets" className="btn-primary">
            <Ticket className="h-4 w-4" /> View tickets
          </Link>
          {isStaff && <Link to="/admin" className="btn-ghost">Cinema dashboard</Link>}
          <button type="button" onClick={logout} className="btn-ghost">Sign out</button>
        </div>
      </div>
    </div>
  );
};
