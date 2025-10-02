'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import Modal from './Modal';
import { FiSettings, FiLogOut, FiUser } from 'react-icons/fi';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useDashboard();
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);
  
  const handleConfirmLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem('token');
    setIsModalOpen(false);
    router.push('/');
  };

  if (!user) {
    return <div className="h-10 w-10 rounded-full bg-gray-700 animate-pulse"></div>;
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <FiUser size={22} />
        </button>

        {isOpen && (
          <div 
            className="absolute right-0 mt-3 w-64 bg-gray-800 rounded-xl shadow-lg border border-gray-700 z-20"
          >
            <div className="p-4 border-b border-gray-700">
              <p className="font-semibold text-white truncate">{user.name || user.email.split('@')[0]}</p>
              <p className="text-sm text-gray-400 truncate">{user.email}</p>
            </div>
            <div className="p-2">
              <div className="px-2 py-1">
                <span className="text-xs text-gray-500 uppercase">Status</span>
                <p>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${user.role === 'admin' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                    {user.role}
                  </span>
                </p>
              </div>
               <hr className="border-gray-700 my-2" />
              <Link
                href="/Dashboard/Settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700"
              >
                <FiSettings className="mr-3 mt-1" /> Settings
              </Link>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-400 rounded-md hover:bg-gray-700 cursor-pointer"
              >
                <FiLogOut className="mr-3 mt-1" /> Log Out
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Log Out"
      >
        <p>Are you sure you want to log out from your account?</p>
      </Modal>
    </>
  );
}