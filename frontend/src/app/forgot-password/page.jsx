'use client';

import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import ClientOnly from '@/components/ClientOnly';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
      }
    } catch (error) {
      toast.error('An error occurred.');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
      <ToastContainer theme="dark" />
      <div className="w-full mx-[5vw] max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center">Forgot Password</h2>
        <p className="text-center text-gray-400">Enter your email to receive a password reset link.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
            <ClientOnly>
              <input
                id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full appearance-none rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </ClientOnly>
          </div>
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer">
            Send Reset Link
          </button>
        </form>
         <p className="text-center text-sm text-gray-400">
            Remember your password?{' '}
            <Link href="/" className="font-medium text-blue-500 hover:text-blue-400">
              Log in
            </Link>
          </p>
      </div>
    </div>
  );
}