import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Twitter } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-white/5 bg-cinema-surface text-zinc-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <h3 className="mb-3 text-lg font-bold text-white">
            Movie<span className="text-cinema-accent">Tix</span>
          </h3>
          <p className="text-sm text-zinc-400">
            India’s cinematic booking experience — showtimes, seats, and e-tickets in one place.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className="hover:text-white">
                Now Showing
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-white">
                FAQ
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-white">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Follow</h4>
          <div className="flex gap-3">
            <a href="https://facebook.com" className="text-zinc-400 hover:text-white" aria-label="Facebook">
              <Facebook />
            </a>
            <a href="https://twitter.com" className="text-zinc-400 hover:text-white" aria-label="Twitter">
              <Twitter />
            </a>
            <a href="https://instagram.com" className="text-zinc-400 hover:text-white" aria-label="Instagram">
              <Instagram />
            </a>
            <a href="mailto:hello@movietix.app" className="text-zinc-400 hover:text-white" aria-label="Email">
              <Mail />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} MovieTix. Bookings are a demo — no real charges are made.
      </div>
    </footer>
  );
};
