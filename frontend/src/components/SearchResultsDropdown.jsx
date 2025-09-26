'use client';

import Link from 'next/link';
import { FiUser, FiAlertTriangle, FiTerminal } from 'react-icons/fi';

export default function SearchResultsDropdown({ results, loading, onResultClick, user }) {
  if (loading) {
    return (
      <div className="absolute top-full mt-2 w-96 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4">
        <p className="text-gray-400">Searching...</p>
      </div>
    );
  }

  if (!results) return null;

  const { users, failures, commands } = results;
  
  const hasVisibleUsers = user && user.role === 'admin' && users.length > 0;
  const hasVisibleFailures = failures.length > 0;
  const hasVisibleCommands = user && user.role === 'admin' && commands.length > 0;
  const hasAnyResults = hasVisibleUsers || hasVisibleFailures || hasVisibleCommands;

  return (
    <div className="absolute top-full mt-2 w-96 bg-gray-800 rounded-lg shadow-lg border border-gray-700 max-h-96 overflow-y-auto z-10">
      {!hasAnyResults ? (
        <p className="p-4 text-gray-400">No results found.</p>
      ) : (
        <div className="p-2">
          {hasVisibleUsers && (
            <div className="mb-2">
              <h4 className="px-2 py-1 text-xs font-bold text-gray-500 uppercase">Users</h4>
              <ul>
                {users.map(userResult => (
                  <li key={userResult._id} onClick={onResultClick}>
                    <Link href="/Dashboard/UserManagement" className="flex items-center p-2 rounded-md hover:bg-gray-700">
                      <FiUser className="mr-3 text-gray-400" />
                      <span className="text-sm text-white">{userResult.email}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasVisibleFailures && (
            <div className="mb-2">
              <h4 className="px-2 py-1 text-xs font-bold text-gray-500 uppercase">Failures</h4>
              <ul>
                {failures.map(failure => (
                  <li key={failure._id} onClick={onResultClick}>
                    <Link href="/Dashboard/Reports" className="flex items-center p-2 rounded-md hover:bg-gray-700">
                      <FiAlertTriangle className="mr-3 text-yellow-400" />
                      <span className="text-sm text-gray-300 truncate">{failure.message}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasVisibleCommands && (
            <div>
              <h4 className="px-2 py-1 text-xs font-bold text-gray-500 uppercase">Commands</h4>
              <ul>
                {commands.map(command => (
                  <li key={command._id} onClick={onResultClick}>
                    <Link href="/Dashboard/Reports" className="flex items-center p-2 rounded-md hover:bg-gray-700">
                       <FiTerminal className="mr-3 text-blue-400" />
                      <span className="text-sm text-gray-300 truncate">{`Set ${command.actuatorType} to ${command.level}`}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}