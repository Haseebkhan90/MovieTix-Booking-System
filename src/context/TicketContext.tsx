import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Ticket } from '../types';
import { TICKETS_KEY, loadJson, saveJson } from '../utils/storage';

interface TicketContextType {
  tickets: Ticket[];
  addTicket: (ticket: Ticket) => void;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const useTicketContext = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTicketContext must be used within a TicketProvider');
  }
  return context;
};

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>(() => loadJson<Ticket[]>(TICKETS_KEY, []));

  const addTicket = useCallback((ticket: Ticket) => {
    setTickets((prev) => {
      const next = [ticket, ...prev];
      saveJson(TICKETS_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ tickets, addTicket }), [tickets, addTicket]);

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
};
