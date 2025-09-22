'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiGrid, FiArchive, FiBarChart2, FiUsers, FiSettings, FiLogOut 
} from 'react-icons/fi';

const menuItems = [
  { name: 'Dashboard', icon: FiGrid, path: '/Dashboard' },
  { name: 'History', icon: FiArchive, path: '/Dashboard/History' },
  { name: 'Reports', icon: FiBarChart2, path: '/Dashboard/Reports' },
  { name: 'User Management', icon: FiUsers, path: '/Dashboard/UserManagement' },
];

export default function Sidebar() { 
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-64 bg-gray-800 text-gray-300 border-r border-gray-700">
      <div className="flex items-center justify-center p-6 border-b border-gray-700">
        <Image src="/kanbanLogo.svg" alt="Kanban Logo" width={100} height={40} />
      </div>
      <nav className="flex-grow p-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.path}
                className={`flex items-center p-3 my-1 rounded-lg transition-colors
                  ${pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700'
                  }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
        <ul>
          <li>
            <Link
              href="/Dashboard/Settings"
              className={`flex items-center p-3 my-1 rounded-lg transition-colors
                ${pathname === '/Dashboard/Settings'
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-700'
                }`}
            >
              <FiSettings className="h-5 w-5 mr-3" />
              <span>Settings</span>
            </Link>
          </li>
          <li>
            <Link
              href="/Login"
              className="flex items-center p-3 my-1 rounded-lg hover:bg-gray-700"
            >
              <FiLogOut className="h-5 w-5 mr-3" />
              <span>Log Out</span>
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}