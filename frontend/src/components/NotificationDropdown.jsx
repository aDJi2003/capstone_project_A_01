"use client";

import { toast } from "react-toastify";
import { FiAlertTriangle } from "react-icons/fi";
import { useDashboard } from "@/context/DashboardContext";

export default function NotificationDropdown({ notifications, onResolve }) {
  const { user } = useDashboard();

  const handleResolve = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://localhost:5000/api/failures/resolve/${id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        toast.success("Notification resolved!");
        onResolve();
      } else {
        toast.error("Failed to resolve notification.");
      }
    } catch (error) {
      console.error("Error resolving notification:", error);
      toast.error("An error occurred.");
    }
  };

  return (
    <div className="absolute right-0 mt-4 w-80 bg-gray-800 rounded-xl shadow-lg border border-gray-700 z-20">
      <div className="p-3 border-b border-gray-700">
        <h3 className="font-semibold text-white">Notifications</h3>
      </div>
      <ul className="p-2 max-h-80 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <li key={notif._id} className="p-2 rounded-md hover:bg-gray-700">
              <div className="flex items-start space-x-3">
                <FiAlertTriangle className="h-5 w-5 text-yellow-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notif.timestamp).toLocaleString()}
                  </p>
                </div>
                {user && user.role === 'admin' && (
                  <button 
                    onClick={() => handleResolve(notif._id)}
                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md flex-shrink-0 cursor-pointer"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </li>
          ))
        ) : (
          <li className="p-4 text-center text-sm text-gray-400">
            No new notifications.
          </li>
        )}
      </ul>
    </div>
  );
}
