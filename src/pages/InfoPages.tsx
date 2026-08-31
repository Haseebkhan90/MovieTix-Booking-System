import { FormEvent, useState } from 'react';

export const About = () => (
  <article className="prose-invert mx-auto max-w-3xl px-4 py-12">
    <h1 className="text-3xl font-bold">About MovieTix</h1>
    <p className="mt-4 text-zinc-300">
      MovieTix is a cinema booking experience built for Indian cities — Mumbai to Chennai — with live-style
      showtimes, seat maps, and instant M-Tickets. This demo runs entirely in the browser.
    </p>
    <p className="mt-3 text-zinc-400">
      Choose a city, pick a film, lock seats, and walk out with a QR ticket. Payments are simulated so you can
      explore the full flow without a card charge.
    </p>
  </article>
);

export const Contact = () => {
  const [sent, setSent] = useState(false);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p className="mt-2 text-zinc-400">Questions about bookings? Send a message — this form is demo-only.</p>
      {sent ? (
        <p className="mt-8 rounded-xl bg-emerald-500/10 p-4 text-emerald-300">Thanks. We’ll get back to you shortly.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input className="input-field" placeholder="Your name" required />
          <input className="input-field" type="email" placeholder="Email" required />
          <textarea className="input-field min-h-32" placeholder="How can we help?" required />
          <button type="submit" className="btn-primary">
            Send
          </button>
        </form>
      )}
    </div>
  );
};

const faqs = [
  {
    q: 'Is this a real booking?',
    a: 'No. MovieTix is a frontend demo. Seats and tickets are stored in your browser only.',
  },
  {
    q: 'How do I pay?',
    a: 'Use the test card 4242 4242 4242 4242. Nothing is charged.',
  },
  {
    q: 'Can I cancel a ticket?',
    a: 'Cancellation is not enabled in this demo. Booked seats stay reserved for that show in this browser.',
  },
  {
    q: 'Why do some shows look sold?',
    a: 'Each hall starts with a realistic scatter of occupied seats, plus any seats you already booked.',
  },
];

export const FAQ = () => (
  <div className="mx-auto max-w-3xl px-4 py-12">
    <h1 className="mb-8 text-3xl font-bold">FAQ</h1>
    <div className="space-y-3">
      {faqs.map((item) => (
        <details key={item.q} className="card-surface p-4">
          <summary className="cursor-pointer font-semibold">{item.q}</summary>
          <p className="mt-2 text-sm text-zinc-400">{item.a}</p>
        </details>
      ))}
    </div>
  </div>
);

export const Privacy = () => (
  <article className="mx-auto max-w-3xl px-4 py-12 text-zinc-300">
    <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
    <p className="mt-4">
      MovieTix stores city preference, booked seats, and tickets in local storage on your device. No account is
      created and no payment data is sent to a server.
    </p>
  </article>
);

export const Terms = () => (
  <article className="mx-auto max-w-3xl px-4 py-12 text-zinc-300">
    <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
    <p className="mt-4">
      This application is a demonstration product. Listings, prices, and availability are fictional. Do not use it
      to purchase real cinema tickets.
    </p>
  </article>
);
