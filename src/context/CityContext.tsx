import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CITIES, City } from '../data/cinemas';
import { CITY_KEY, loadJson, saveJson } from '../utils/storage';

interface CityContextType {
  city: City;
  setCity: (city: City) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) throw new Error('useCity must be used within a CityProvider');
  return context;
};

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [city, setCityState] = useState<City>(() => {
    const saved = loadJson<string>(CITY_KEY, 'Mumbai');
    return (CITIES as readonly string[]).includes(saved) ? (saved as City) : 'Mumbai';
  });

  const setCity = useCallback((next: City) => {
    setCityState(next);
    saveJson(CITY_KEY, next);
  }, []);

  const value = useMemo(() => ({ city, setCity }), [city, setCity]);

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
};
