import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SeatSelector } from '../components/SeatSelector';
import { useSeatContext } from '../context/SeatContext';
import { getMovieById } from '../data/movies';
import { getCinemaById } from '../data/cinemas';
import { CATEGORY_LABEL, formatINR, formatShowDate, getSeatPrice } from '../utils/booking';
import { saveDraft } from '../utils/draft';

export const SeatBooking = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const movie = getMovieById(Number(id));
  const cinemaId = params.get('cinema') ?? '';
  const date = params.get('date') ?? '';
  const time = params.get('time') ?? '';
  const cinema = getCinemaById(cinemaId);
  const { selectedSeats, notice, initializeSeats } = useSeatContext();

  useEffect(() => {
    if (movie && cinemaId && date && time) {
      initializeSeats({ movieId: movie.id, cinemaId, date, time });
    }
  }, [movie, cinemaId, date, time, initializeSeats]);

  const subtotal = useMemo(
    () => selectedSeats.reduce((sum, seat) => sum + getSeatPrice(movie?.price ?? 0, seat.category), 0),
    [selectedSeats, movie?.price]
  );

  if (!movie || !cinema || !date || !time) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Invalid show selection</h1>
        <Link to="/" className="btn-primary mt-6">
          Choose a movie
        </Link>
      </div>
    );
  }

  const proceed = () => {
    if (!selectedSeats.length) return;
    saveDraft({
      movieId: movie.id,
      cinemaId,
      showDate: date,
      showtime: time,
      seats: selectedSeats,
      subtotal,
    });
    navigate('/checkout');
  };

  return (
    <div className="pb-28">
      <div className="border-b border-cinema-border bg-cinema-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">{movie.title}</h1>
            <p className="text-sm text-zinc-400">
              {cinema.name}, {cinema.mall} • {formatShowDate(date)} • {time}
            </p>
          </div>
          <Link to={`/movie/${movie.id}`} className="text-sm text-cinema-accent">
            Change show
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <SeatSelector movieId={movie.id} cinemaId={cinemaId} date={date} time={time} />
        {notice && <p className="mt-4 text-center text-sm text-amber-300">{notice}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-cinema-border bg-cinema-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {selectedSeats.length === 0 ? (
              <p className="text-sm text-zinc-400">Select seats to continue</p>
            ) : (
              <>
                <p className="text-sm text-zinc-400">
                  {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} •{' '}
                  {selectedSeats.map((s) => `${s.row}${s.number}`).join(', ')}
                </p>
                <p className="text-lg font-bold">
                  {formatINR(subtotal)}{' '}
                  <span className="text-xs font-normal text-zinc-500">
                    {Array.from(new Set(selectedSeats.map((s) => CATEGORY_LABEL[s.category]))).join(' + ')}
                  </span>
                </p>
              </>
            )}
          </div>
          <button type="button" disabled={selectedSeats.length === 0} onClick={proceed} className="btn-primary">
            Pay {formatINR(subtotal)}
          </button>
        </div>
      </div>
    </div>
  );
};
