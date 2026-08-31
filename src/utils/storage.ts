const TICKETS_KEY = 'movietix.tickets';
const BOOKED_KEY = 'movietix.booked';
const CITY_KEY = 'movietix.city';

export const loadJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const saveJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export { TICKETS_KEY, BOOKED_KEY, CITY_KEY };
