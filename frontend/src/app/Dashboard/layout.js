'use client';

import { DashboardProvider } from '@/context/DashboardContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ChatWidget from '@/components/ChatWidget';

export default function Layout({ children }) {
  return (
    <DashboardProvider>
      <div className="flex h-screen bg-gray-900">
        <Sidebar />
        <div className="flex flex-1 flex-col md:ml-64 overflow-hidden">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
        <ChatWidget />
      </div>
    </DashboardProvider>
  );
}