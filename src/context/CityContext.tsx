import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { CityInfo } from '../types';
import { CITY_KEY, loadJson, saveJson } from '../utils/storage';

type CityContextType = {
  city: string;
  cities: CityInfo[];
  setCity: (city: string) => void;
  currency: string;
};

const CityContext = createContext<CityContextType | undefined>(undefined);

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) throw new Error('useCity must be used within a CityProvider');
  return context;
};

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [city, setCityState] = useState(() => loadJson<string>(CITY_KEY, 'Mumbai'));

  useEffect(() => {
    api<{ cities: CityInfo[] }>('/meta')
      .then((data) => {
        setCities(data.cities);
        setCityState((current) => {
          if (data.cities.some((c) => c.city === current)) return current;
          const next = data.cities[0]?.city ?? current;
          saveJson(CITY_KEY, next);
          return next;
        });
      })
      .catch(() => undefined);
  }, []);

  const setCity = useCallback((next: string) => {
    setCityState(next);
    saveJson(CITY_KEY, next);
  }, []);

  const currency = cities.find((c) => c.city === city)?.currency ?? 'INR';
  const value = useMemo(() => ({ city, cities, setCity, currency }), [city, cities, setCity, currency]);

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
};
