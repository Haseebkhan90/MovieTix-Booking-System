import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { HomePage } from './pages/HomePage';
import { MovieDetails } from './pages/MovieDetails';
import { SeatBooking } from './pages/SeatBooking';
import { MyTickets } from './pages/MyTickets';
import { Checkout } from './pages/Checkout';
import { Profile } from './pages/Profile';
import { About, Contact, FAQ, Privacy, Terms } from './pages/InfoPages';
import { NotFound } from './pages/NotFound';
import { SeatProvider } from './context/SeatContext';
import { TicketProvider } from './context/TicketContext';
import { CityProvider } from './context/CityContext';

function Shell() {
  const { pathname } = useLocation();
  const hideFooter = pathname.includes('/seats');

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/movie/:id/seats" element={<SeatBooking />} />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <CityProvider>
        <TicketProvider>
          <SeatProvider>
            <ScrollToTop />
            <Shell />
          </SeatProvider>
        </TicketProvider>
      </CityProvider>
    </Router>
  );
}

export default App;
