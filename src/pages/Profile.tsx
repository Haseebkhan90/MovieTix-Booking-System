import { Link } from 'react-router-dom';
import { Ticket, MapPin, User } from 'lucide-react';
import { useTicketContext } from '../context/TicketContext';
import { useCity } from '../context/CityContext';
import { formatINR } from '../utils/booking';

export const Profile = () => {
  const { tickets } = useTicketContext();
  const { city } = useCity();
  const spent = tickets.reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="card-surface p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cinema-accent/20 text-cinema-accent">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Guest User</h1>
            <p className="flex items-center gap-1 text-sm text-zinc-400">
              <MapPin className="h-4 w-4" />
              Booking from {city}
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
            <p className="mt-1 text-3xl font-bold">{formatINR(spent)}</p>
          </div>
        </div>

        <p className="mt-6 text-sm text-zinc-400">
          This is a demo profile. Tickets are saved in this browser so you can reopen them later.
        </p>
        <Link to="/my-tickets" className="btn-primary mt-6">
          <Ticket className="h-4 w-4" />
          View tickets
        </Link>
      </div>
    </div>
  );
};
