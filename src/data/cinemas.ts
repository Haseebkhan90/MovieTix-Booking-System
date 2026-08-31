import { Cinema } from '../types';

export const CITIES = [
  'Mumbai',
  'Delhi-NCR',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Pune',
] as const;

export type City = (typeof CITIES)[number];

export const cinemas: Cinema[] = [
  {
    id: 'pvr-phoenix',
    name: 'PVR Cinemas',
    mall: 'Phoenix Palladium',
    city: 'Mumbai',
    amenities: ['IMAX', 'Dolby Atmos', 'Recliner', 'M-Ticket'],
  },
  {
    id: 'inox-rcity',
    name: 'INOX',
    mall: 'R City Mall',
    city: 'Mumbai',
    amenities: ['4K Laser', 'M-Ticket', 'Food Court'],
  },
  {
    id: 'cinepolis-andheri',
    name: 'Cinépolis',
    mall: 'Fun Republic',
    city: 'Mumbai',
    amenities: ['VIP', 'Dolby Atmos', 'M-Ticket'],
  },
  {
    id: 'pvr-select-city',
    name: 'PVR Director’s Cut',
    mall: 'Select Citywalk',
    city: 'Delhi-NCR',
    amenities: ['IMAX', 'Recliner', 'M-Ticket'],
  },
  {
    id: 'pvr-vegas',
    name: 'PVR',
    mall: 'Vegas Mall',
    city: 'Delhi-NCR',
    amenities: ['Playhouse', 'M-Ticket'],
  },
  {
    id: 'inox-janak',
    name: 'INOX',
    mall: 'Janak Place',
    city: 'Delhi-NCR',
    amenities: ['Dolby Atmos', 'M-Ticket'],
  },
  {
    id: 'pvr-orion',
    name: 'PVR IMAX',
    mall: 'Orion Mall',
    city: 'Bengaluru',
    amenities: ['IMAX', 'Dolby Atmos', 'M-Ticket'],
  },
  {
    id: 'inox-garuda',
    name: 'INOX',
    mall: 'Garuda Mall',
    city: 'Bengaluru',
    amenities: ['4K Laser', 'M-Ticket'],
  },
  {
    id: 'pvr-gvk',
    name: 'PVR',
    mall: 'GVK One',
    city: 'Hyderabad',
    amenities: ['IMAX', 'Recliner', 'M-Ticket'],
  },
  {
    id: 'amb-cinemas',
    name: 'AMB Cinemas',
    mall: 'Sarath City Capital',
    city: 'Hyderabad',
    amenities: ['Dolby Atmos', 'M-Ticket'],
  },
  {
    id: 'spi-sathyam',
    name: 'SPI Sathyam',
    mall: 'Royapettah',
    city: 'Chennai',
    amenities: ['4K Laser', 'M-Ticket'],
  },
  {
    id: 'pvr-vr-chennai',
    name: 'PVR',
    mall: 'VR Chennai',
    city: 'Chennai',
    amenities: ['IMAX', 'Recliner', 'M-Ticket'],
  },
  {
    id: 'pvr-pavilion',
    name: 'PVR',
    mall: 'Pavilion Mall',
    city: 'Pune',
    amenities: ['Dolby Atmos', 'M-Ticket'],
  },
  {
    id: 'inox-bund',
    name: 'INOX',
    mall: 'Bund Garden',
    city: 'Pune',
    amenities: ['Recliner', 'M-Ticket'],
  },
];

export const SHOW_TIMES = ['10:00 AM', '01:15 PM', '04:30 PM', '07:45 PM', '10:30 PM'];

export const getCinemasByCity = (city: string) =>
  cinemas.filter((c) => c.city === city);

export const getCinemaById = (id: string) => cinemas.find((c) => c.id === id);
