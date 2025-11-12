'use client';

import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import ClientOnly from '@/components/ClientOnly';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ResetPasswordPage({ params }) {
  const { token } = params;
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }
    if (password.length < 8) {
      return toast.warn("Password must be at least 8 characters.");
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        setTimeout(() => router.push('/'), 2000);
      }
    } catch (error) {
      toast.error('An error occurred.');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
      <ToastContainer theme="dark" />
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center">Reset Your Password</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password">New Password</label>
            <div className="relative">
              <ClientOnly>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 pr-10 text-white"
                />
              </ClientOnly>
              <div className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEye className="h-5 w-5 text-gray-400" /> : <FiEyeOff className="h-5 w-5 text-gray-400" />}
              </div>
            </div>
             <p className="mt-2 text-xs text-gray-400">Must be at least 8 characters.</p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="relative">
              <ClientOnly>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 pr-10 text-white"
                />
              </ClientOnly>
              <div className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <FiEye className="h-5 w-5 text-gray-400" /> : <FiEyeOff className="h-5 w-5 text-gray-400" />}
              </div>
            </div>
          </div>

          <button type="submit" className="w-full flex justify-center py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}