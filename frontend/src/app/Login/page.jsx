"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem("rememberMeDetails");
    if (savedData) {
      const { email, password, expiry } = JSON.parse(savedData);
      if (new Date().getTime() > expiry) {
        console.log("Remember me data has expired. Clearing storage.");
        localStorage.removeItem("rememberMeDetails");
      } else {
        console.log("Populating login form from localStorage.");
        setEmail(email);
        setPassword(password);
        setRememberMe(true);
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login attempt with:", { email, password });

    const serverResponse = Math.random() > 0.5 ? "success" : "error";

    if (serverResponse === "success") {
      if (rememberMe) {
        const expiryTime = new Date().getTime() + 30 * 60 * 1000;
        const rememberMeDetails = {
          email: email,
          password: password,
          expiry: expiryTime,
        };
        localStorage.setItem("rememberMeDetails", JSON.stringify(rememberMeDetails));
        console.log("Login details saved for 30 minutes.");
      } else {
        localStorage.removeItem("rememberMeDetails");
        console.log("Remember me is off. Clearing any saved details.");
      }
      toast.success("Login Success. Please Wait...", {
        autoClose: 2000,
        onClose: () => {
          router.push("/Dashboard");
        },
      });
    } else {
      toast.error("Please Check Your Email or Password");
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
          <h2 className="mt-4 text-2xl font-bold text-white">
            Log in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Welcome back! Please enter your details.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300"
              >
                Email
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
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
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
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-300"
                >
                  Remember for 30 minutes
                </label>
              </div>

              <div className="text-sm curson-pointer">
                <Link
                  href="#"
                  className="font-medium text-blue-500 hover:text-blue-400"
                >
                  Forgot password
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 cursor-pointer"
              >
                Sign in
              </button>
            </div>
            <div>
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-md border border-gray-600 bg-gray-800 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 cursor-pointer"
              >
                <Image
                  src="/googleLogo.png"
                  alt="Google Icon"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Sign in with Google
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400 cursor-pointer">
            Don't have an account?{" "}
            <Link
              href="/Register"
              className="font-medium text-blue-500 hover:text-blue-400"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
