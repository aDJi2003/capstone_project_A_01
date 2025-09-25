'use client';

import { FiSearch, FiBell } from 'react-icons/fi';
import ProfileDropdown from './ProfileDropdown';

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between bg-gray-800 px-6 border-b border-gray-700 py-2">
      <div className="relative">
        <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search something..."
          className="w-96 rounded-lg border border-gray-600 bg-gray-700 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex items-center space-x-4">
        <button className="relative">
          <FiBell className="h-6 w-6 text-gray-400 hover:text-white" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">2</span>
        </button>
        <ProfileDropdown />
      </div>
    </header>
  );
}