import { Link } from 'react-router-dom';

export const NotFound = () => (
  <div className="mx-auto max-w-lg px-4 py-24 text-center">
    <p className="text-sm uppercase tracking-widest text-cinema-accent">404</p>
    <h1 className="mt-2 text-3xl font-bold">This show has left the building</h1>
    <p className="mt-3 text-zinc-400">The page you wanted isn’t on the marquee.</p>
    <Link to="/" className="btn-primary mt-8">
      Back to movies
    </Link>
  </div>
);
