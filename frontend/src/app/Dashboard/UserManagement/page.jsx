"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";

export default function UserManagementPage() {
  const { activeMenu } = useDashboard();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [activeMenu]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-6">
        User Management
      </h1>

      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-400">
                  Loading users...
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        user.role === "admin"
                          ? "bg-green-200 text-green-800"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
