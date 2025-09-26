'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiBell } from "react-icons/fi";
import ProfileDropdown from "./ProfileDropdown";
import NotificationDropdown from './NotificationDropdown';
import SearchResultsDropdown from './SearchResultsDropdown';
import ClientOnly from './ClientOnly';

export default function Header() {
  const [notifications, setNotifications] = useState([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const notificationRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim() !== '') {
        performSearch();
      } else {
        setSearchResults(null);
      }
    }, 500);

    const performSearch = async () => {
      setLoadingSearch(true);
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`http://localhost:5000/api/search?q=${searchTerm}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoadingSearch(false);
      }
    };

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchTerm('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchRef]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch("http://localhost:5000/api/failures/active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };
  
  useEffect(() => {
    const intervalId = setInterval(fetchNotifications, 5000);
    fetchNotifications();
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationRef]);


  return (
    <header className="flex h-16 items-center justify-between bg-gray-800 px-6 border-b border-gray-700">
      <div className="relative" ref={searchRef}>
        <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
        <ClientOnly>
          <input
            type="text"
            placeholder="Search something..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-96 rounded-lg border border-gray-600 bg-gray-700 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </ClientOnly>
        {searchTerm && (
          <SearchResultsDropdown 
            results={searchResults} 
            loading={loadingSearch}
            onResultClick={() => setSearchTerm('')}
          />
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative" ref={notificationRef}>
          <button onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)} className="relative">
            <FiBell className="h-6 w-6 text-gray-400 hover:text-white" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {notifications.length}
              </span>
            )}
          </button>
          {isNotifDropdownOpen && (
            <NotificationDropdown 
              notifications={notifications}
              onResolve={fetchNotifications}
            />
          )}
        </div>
        
        <ProfileDropdown />
      </div>
    </header>
  );
}