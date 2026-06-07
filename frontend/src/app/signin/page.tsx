'use client';

import Link from 'next/link';

export default function SignIn() {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-[#FFFFFF] via-[#FFFFFF] to-[#EFF6FF] font-sans antialiased text-[#111827]">
      {/* Navbar */}
      <header className="w-full border-b border-slate-100 bg-[#FFFFFF]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3B82F6]/10">
              <svg
                className="h-5 w-5 text-[#3B82F6]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 10h.01" />
                <path d="M12 10h.01" />
                <path d="M16 10h.01" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111827]">
              Mock Interview AI
            </span>
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl p-8 shadow-md shadow-blue-50/50">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#111827] mb-2">Welcome Back</h1>
            <p className="text-sm text-[#6B7280]">Sign in to your account to resume your preparation.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); alert('Signed in!'); }} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#3B82F6] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Password
                </label>
                <a href="#" className="text-xs text-[#3B82F6] hover:underline font-medium">Forgot password?</a>
              </div>
              <input
                id="password"
                type="password"
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#3B82F6] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#3B82F6] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 shadow-md shadow-blue-100 hover:shadow-lg transition-all"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-[#6B7280]">
            Don't have an account?{' '}
            <Link href="/interview-type" className="text-[#3B82F6] hover:underline font-semibold">
              Try a demo session
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
