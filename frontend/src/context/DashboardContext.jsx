"use client";

import { createContext, useContext, useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const DashboardContext = createContext();

const initialActuatorStates = {
  "Lampu LED-1": "off",
  "Lampu LED-2": "off",
  "Lampu LED-3": "off",
  "Lampu LED-4": "off",
  "Exhaust Fan-1": "off",
  "Exhaust Fan-2": "off",
  "Kipas-1": "off",
  "Kipas-2": "off",
};

export function DashboardProvider({ children }) {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [user, setUser] = useState(null);
  const [actuatorStates, setActuatorStates] = useState(initialActuatorStates);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data);
          }
        } catch (error) {
          console.error("Failed to fetch user data on load", error);
        }
      }
    };
    fetchUserData();
  }, []);

  const updateActuatorState = (actuatorKey, level) => {
    setActuatorStates((prevStates) => ({
      ...prevStates,
      [actuatorKey]: level,
    }));
  };

  return (
    <DashboardContext.Provider
      value={{
        activeMenu,
        setActiveMenu,
        user,
        actuatorStates,
        updateActuatorState,
        isSidebarOpen,
        setIsSidebarOpen,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
