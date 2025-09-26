'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const DashboardContext = createContext();

const initialActuatorStates = {
  'Lampu LED-1': 'off', 'Lampu LED-2': 'off',
  'Air Purifier-1': 'off', 'Air Purifier-2': 'off',
  'Kipas-1': 'off', 'Kipas-2': 'off',
};

export function DashboardProvider({ children }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [user, setUser] = useState(null);
  const [actuatorStates, setActuatorStates] = useState(initialActuatorStates);

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

  const updateActuatorState = (actuatorKey, level) => {
    setActuatorStates(prevStates => ({
      ...prevStates,
      [actuatorKey]: level,
    }));
  };

  return (
    <DashboardContext.Provider 
      value={{ activeMenu, setActiveMenu, user, actuatorStates, updateActuatorState }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}