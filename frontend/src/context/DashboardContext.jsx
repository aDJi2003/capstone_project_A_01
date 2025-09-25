'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('http://localhost:5000/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data);
          }
        } catch (error) {
          console.error('Failed to fetch user data on load', error);
        }
      }
    };
    fetchUserData();
  }, []);

  return (
    <DashboardContext.Provider value={{ activeMenu, setActiveMenu, user }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}