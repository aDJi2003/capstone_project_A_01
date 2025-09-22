'use client';

import { createContext, useContext, useState } from 'react';
const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  return (
    <DashboardContext.Provider value={{ activeMenu, setActiveMenu }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}