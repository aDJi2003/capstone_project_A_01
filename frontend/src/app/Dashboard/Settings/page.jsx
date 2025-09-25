'use client';

import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState('Loading...');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setUserEmail(data.email);
        }
      } catch (error) {
        console.error('Failed to fetch user data', error);
        setUserEmail('Failed to load email');
      }
    };
    fetchUserData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.warn('New passwords do not match.');
    }
    if (newPassword.length < 8) {
      return toast.warn('New password must be at least 8 characters.');
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast.error('An error occurred.');
    }
  };

  return (
    <div>
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      
      {/* Card ganti password */}
      <div className="mt-6 max-w-full bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white">Change Password</h2>
          <p className="text-sm text-gray-400 mt-1">Update the password for your account: <span className="font-medium text-gray-300">{userEmail}</span></p>
          
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Current Password</label>
              <input 
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-1 block w-full appearance-none rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">New Password</label>
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="mt-1 block w-full appearance-none rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Confirm New Password</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full appearance-none rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}