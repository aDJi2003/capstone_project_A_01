'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/context/DashboardContext';

export default function ReportsPage() {
  const { activeMenu } = useDashboard();
  const [failures, setFailures] = useState([]);
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchReports = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }

      try {
        const [failuresRes, commandsRes] = await Promise.all([
          fetch('http://localhost:5000/api/failures/all', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/commands/all', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!failuresRes.ok || !commandsRes.ok) {
          throw new Error('Failed to fetch reports');
        }

        const failuresData = await failuresRes.json();
        const commandsData = await commandsRes.json();

        setFailures(failuresData);
        setCommands(commandsData);

      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [activeMenu]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-6">Reports</h1>
      
      {loading ? (
        <p className="text-gray-400">Loading reports...</p>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Sensor Failure History</h2>
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Sensor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {failures.map(failure => (
                    <tr key={failure._id}>
                      <td className="px-6 py-4 text-sm text-white capitalize">{failure.sensorType} {failure.sensorIndex}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{failure.message}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{new Date(failure.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${failure.resolved ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                          {failure.resolved ? 'Resolved' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Actuator Command History</h2>
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actuator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Command</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {commands.map(command => (
                    <tr key={command._id}>
                      <td className="px-6 py-4 text-sm text-gray-300">{command.user.email}</td>
                      <td className="px-6 py-4 text-sm text-white capitalize">{command.actuatorType} #{command.actuatorIndex}</td>
                      <td className="px-6 py-4 text-sm text-white capitalize">{command.level}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{new Date(command.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}