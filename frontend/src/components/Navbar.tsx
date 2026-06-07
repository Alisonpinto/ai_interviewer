'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-[#FFFFFF]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Left: Logo & Brand */}
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

        {/* Center: Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/#features"
            className="text-[#6B7280] hover:text-[#111827] text-sm font-medium transition-colors"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-[#6B7280] hover:text-[#111827] text-sm font-medium transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/#pricing"
            className="text-[#6B7280] hover:text-[#111827] text-sm font-medium transition-colors"
          >
            Pricing
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/signin"
            className="text-[#6B7280] hover:text-[#111827] text-sm font-medium transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/interview-type"
            className="inline-flex items-center justify-center rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            Start Interview
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex md:hidden p-2 text-[#6B7280] hover:text-[#111827]"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-[#FFFFFF] px-6 py-4 flex flex-col gap-4 shadow-inner">
          <Link
            href="/#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#6B7280] hover:text-[#111827] text-base font-medium transition-colors"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#6B7280] hover:text-[#111827] text-base font-medium transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#6B7280] hover:text-[#111827] text-base font-medium transition-colors"
          >
            Pricing
          </Link>
          <hr className="border-slate-100" />
          <Link
            href="/signin"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#6B7280] hover:text-[#111827] text-base font-medium transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/interview-type"
            onClick={() => setMobileMenuOpen(false)}
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#3B82F6] py-3 text-base font-medium text-white hover:bg-blue-600 transition-colors"
          >
            Start Interview
          </Link>
        </div>
      )}
    </header>
  );
}
