import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { SystemCode } from '@/types/api';

type Period = '24h' | '7d' | '30d';

interface FilterState {
  systemFilter: SystemCode | 'ALL';
  setSystemFilter: (s: SystemCode | 'ALL') => void;
  period: Period;
  setPeriod: (p: Period) => void;
}

const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [systemFilter, setSystemFilter] = useState<SystemCode | 'ALL'>('ALL');
  const [period, setPeriod] = useState<Period>('24h');

  return (
    <FilterContext.Provider value={{ systemFilter, setSystemFilter, period, setPeriod }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
