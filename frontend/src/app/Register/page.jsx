'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiEye, FiEyeOff, FiLoader } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ClientOnly from '@/components/ClientOnly';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      return toast.warn('Password must be at least 8 characters long!');
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }

    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration.');
    }

    finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
      <ToastContainer theme="dark" position="top-right" autoClose={2000} />
      <div className="flex w-full mx-[5vw] max-w-4xl rounded-xl bg-gray-800 shadow-lg">
        {/* Kolom Kiri */}
        <div className="hidden md:flex w-1/2 flex-col items-center justify-center rounded-l-xl bg-gray-700 p-12 text-center">
          <Image
            src="/echosLogo.png"
            alt="ECHOS Logo"
            width={128}
            height={128}
          />
          <h1 className="mt-4 text-4xl font-bold tracking-wider">ECHOS</h1>
        </div>

        {/* Kolom Kanan */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="flex justify-center md:justify-start">
             <Image
                src="/echosLogo.png"
                alt="ECHOS Icon"
                width={40}
                height={40}
              />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">Create an account</h2>
          
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name*</label>
              <ClientOnly>
                <input
                  id="name" name="name" type="text" autoComplete="name" required
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full appearance-none rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter your name"
                />
              </ClientOnly>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email*</label>
              <ClientOnly>
                <input
                  id="email" name="email" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full appearance-none rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter your email"
                />
              </ClientOnly>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password*</label>
              <div className="relative">
                <ClientOnly>
                  <input
                    id="password" name="password" required
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full appearance-none rounded-md border border-gray-600 bg-gray-700 px-3 py-2 pr-10 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="Create a password"
                />
                </ClientOnly>
                <div 
                  className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEye className="h-5 w-5 text-gray-400" /> : <FiEyeOff className="h-5 w-5 text-gray-400" />}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-400">Must be at least 8 characters.</p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none disabled:bg-blue-800 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <FiLoader className="animate-spin" size={20} />
                ) : (
                  'Get started'
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400 cursor-pointer">
            Already have an account?{' '}
            <Link href="/" className="font-medium text-blue-500 hover:text-blue-400">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}