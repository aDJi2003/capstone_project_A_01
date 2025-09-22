'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.warn('Password must be at least 8 characters long!');
      return;
    }

    console.log('Register attempt with:', { name, email, password });
    const serverResponse = Math.random() > 0.5 ? 'success' : 'error';

    if (serverResponse === 'success') {
      toast.success('Account created successfully! Please log in.');
      setName('');
      setEmail('');
      setPassword('');
    } else {
      toast.error('Email is already registered. Please use another email.');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      <div className="flex w-full max-w-4xl rounded-xl bg-gray-800 shadow-lg">
        {/* Kolom Kiri */}
        <div className="hidden md:flex w-1/2 flex-col items-center justify-center rounded-l-xl bg-gray-700 p-12 text-center">
          <Image
            src="/kanbanLogo.svg"
            alt="Kanban Logo"
            width={128}
            height={128}
          />
          <h1 className="mt-4 text-4xl font-bold tracking-wider">KANBAN</h1>
        </div>

        {/* Kolom Kanan */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="flex justify-center md:justify-start">
             <Image
                src="/kanbanLogo.svg"
                alt="Kanban Icon"
                width={40}
                height={40}
              />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">Create an account</h2>
          
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Name*
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full appearance-none rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email*
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full appearance-none rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password*
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full appearance-none rounded-md border border-gray-600 bg-gray-700 px-3 py-2 pr-10 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Create a password"
                />
                <div 
                  className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEye className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiEyeOff className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-400">Must be at least 8 characters.</p>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 cursor-pointer"
              >
                Get started
              </button>
            </div>
             <div>
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-md border border-gray-600 bg-gray-800 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 cursor-pointer"
              >
                <Image src="/googleLogo.png" alt="Google Icon" width={20} height={20} className="mr-2" />
                Sign up with Google
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/" className="font-medium text-blue-500 hover:text-blue-400 cursor-pointer">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}