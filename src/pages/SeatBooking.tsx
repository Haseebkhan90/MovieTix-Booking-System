import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SeatSelector, HallSeat } from '../components/SeatSelector';
import { ApiError, formatMoney } from '../api/client';
import { createHold, fetchShow, listenSeats, type HallSeatRow, type ShowInfo } from '../lib/firestore';
import { useAuth } from '../context/AuthContext';

export const SeatBooking = () => {
  const [params] = useSearchParams();
  const showId = params.get('show') ?? '';
  const navigate = useNavigate();
  const { user } = useAuth();
  const [show, setShow] = useState<ShowInfo | null>(null);
  const [seats, setSeats] = useState<HallSeatRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!showId) return;
    fetchShow(showId).then(setShow).catch(() => setShow(null));
  }, [showId]);

  useEffect(() => {
    if (!showId || !show) return;
    return listenSeats(showId, show.basePriceMinor, user?.id ?? null, setSeats);
  }, [showId, show, user?.id]);

  const selectedSeats = useMemo(() => seats.filter((s) => selected.includes(s.id)), [seats, selected]);
  const subtotal = selectedSeats.reduce((sum, s) => sum + s.priceMinor, 0);

  const toggle = (seat: HallSeat) => {
    if (seat.status === 'sold' || seat.status === 'held') return;
    setSelected((prev) => {
      if (prev.includes(seat.id)) return prev.filter((id) => id !== seat.id);
      if (prev.length >= 10) {
        setNotice('Maximum 10 seats per booking');
        return prev;
      }
      setNotice(null);
      return [...prev, seat.id];
    });
  };

  const proceed = async () => {
    if (!selectedSeats.length || !show) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/movie/${show.movie.id}/seats?show=${showId}`)}`);
      return;
    }
    setBusy(true);
    try {
      const hold = await createHold(
        showId,
        selectedSeats.map((s) => ({ row: s.row, number: s.number }))
      );
      sessionStorage.setItem('movietix.hold', JSON.stringify(hold));
      navigate('/checkout');
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Could not hold seats');
    } finally {
      setBusy(false);
    }
  };

  if (!showId || !show) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Select a showtime first</h1>
        <Link to="/" className="btn-primary mt-6">Choose a movie</Link>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <div className="border-b border-cinema-border bg-cinema-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">{show.movie.title}</h1>
            <p className="text-sm text-zinc-400">
              {show.cinema.name}, {show.cinema.mall} · {new Date(show.startsAt).toLocaleString()}
            </p>
          </div>
          <Link to={`/movie/${show.movie.id}`} className="text-sm text-cinema-accent">Change show</Link>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SeatSelector seats={seats} selected={selected} onToggle={toggle} />
        {notice && <p className="mt-4 text-center text-sm text-amber-300">{notice}</p>}
      </div>
      <div className="fixed bottom-0 left-0 right-0 border-t border-cinema-border bg-cinema-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {selected.length === 0 ? (
              <p className="text-sm text-zinc-400">Select seats to continue</p>
            ) : (
              <p className="text-lg font-bold">
                {selectedSeats.map((s) => `${s.row}${s.number}`).join(', ')} · {formatMoney(subtotal, show.currency)}
              </p>
            )}
          </div>
          <button type="button" disabled={!selected.length || busy} onClick={proceed} className="btn-primary min-w-40">
            {busy ? 'Holding seats…' : selected.length === 0 ? 'Select seats' : `Pay ${formatMoney(subtotal, show.currency)}`}
          </button>
        </div>
      </div>
    </div>
  );
};
