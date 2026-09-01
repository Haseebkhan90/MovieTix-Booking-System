import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket as TicketIcon } from 'lucide-react';
import { TicketDetails } from '../components/TicketDetails';
import { Ticket } from '../types';
import { formatMoney } from '../api/client';
import { fetchTickets } from '../lib/firestore';
import { useAuth } from '../context/AuthContext';

export const MyTickets = () => {
  const { user, loading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchTickets().then(setTickets).catch(() => setTickets([]));
  }, [user]);

  if (loading) return <div className="py-24 text-center text-zinc-400">Loading…</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Sign in to see your M-Tickets</h1>
        <Link to="/login?next=/my-tickets" className="btn-primary mt-6">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">My Tickets</h1>
      {tickets.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <TicketIcon className="mx-auto mb-4 h-14 w-14 text-zinc-600" />
          <p className="text-lg font-semibold">No bookings yet</p>
          <Link to="/" className="btn-primary mt-6">Browse movies</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => setSelected(ticket)}
              className="card-surface flex w-full overflow-hidden text-left transition hover:border-cinema-accent/50"
            >
              <img src={ticket.movie.imageUrl} alt="" className="h-40 w-28 object-cover sm:w-36" />
              <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-cinema-accent">{ticket.code ?? 'M-Ticket'}</p>
                    <h2 className="text-xl font-bold">{ticket.movie.title}</h2>
                    <p className="text-sm text-zinc-400">{ticket.cinema.name} · {ticket.cinema.mall}</p>
                    <p className="text-sm text-zinc-400">{new Date(ticket.showDate).toLocaleString()}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ticket.seats.map((seat) => (
                        <span key={seat.id} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                          {seat.row}{seat.number}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xl font-bold text-emerald-400">{formatMoney(ticket.totalAmount, ticket.currency)}</p>
                </div>
                <p className="mt-3 text-xs text-zinc-500">Tap to view QR ticket</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {selected && <TicketDetails ticket={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};
