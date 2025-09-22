'use client';

import { DashboardProvider } from '@/context/DashboardContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function Layout({ children }) {
  return (
    <DashboardProvider>
      <div className="flex h-screen bg-gray-900">
        <Sidebar />
        <div className="flex flex-1 flex-col ml-64">
          <Header />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}