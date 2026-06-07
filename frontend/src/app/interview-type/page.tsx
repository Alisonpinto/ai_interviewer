'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const TRACKS = [
  {
    id: 'swe',
    title: 'Software Engineering',
    description: 'Practice DSA, system design, coding rounds, and technical interviews.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    id: 'frontend',
    title: 'Frontend Development',
    description: 'HTML, CSS, JavaScript, React, Next.js, UI engineering interviews.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'backend',
    title: 'Backend Development',
    description: 'APIs, databases, scalability, architecture, and backend engineering.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
  },
  {
    id: 'datascience',
    title: 'Data Science',
    description: 'Machine learning, statistics, Python, SQL, and analytics interviews.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
      </svg>
    ),
  },
  {
    id: 'pm',
    title: 'Product Management',
    description: 'Product thinking, prioritization, metrics, and strategy interviews.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'finance',
    title: 'Finance',
    description: 'Corporate finance, valuations, accounting, and investment analysis.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'hr',
    title: 'HR & Behavioral',
    description: 'Communication, teamwork, leadership, conflict resolution, and culture fit.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'marketing',
    title: 'Marketing & Sales',
    description: 'Brand strategy, growth, customer acquisition, and sales interviews.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
];

export default function InterviewType() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTrack = TRACKS.find(t => t.id === selectedId);

  return (
    <div className="relative flex min-h-screen flex-col bg-[#FFFFFF] font-sans antialiased text-[#111827]">
      {/* Sticky Reusable Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-grow flex flex-col items-center px-6 py-16 md:py-24 text-center max-w-7xl mx-auto w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-[#3B82F6] uppercase border border-[#3B82F6]/20 bg-[#EFF6FF] mb-6">
          8 Interview Categories Available
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#111827] mb-4">
          Choose Your Interview Track
        </h1>
        <p className="text-[#6B7280] text-base sm:text-lg max-w-2xl mx-auto mb-16">
          Select a role-specific interview experience powered by AI and tailored to your career goals.
        </p>

        {/* Grid of Track Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-24">
          {TRACKS.map((track) => {
            const isSelected = selectedId === track.id;
            return (
              <button
                key={track.id}
                onClick={() => setSelectedId(track.id)}
                className={`group relative flex flex-col items-start p-6 bg-white border rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 shadow-sm ${
                  isSelected
                    ? 'border-[#60A5FA] bg-[#EFF6FF]/60 ring-1 ring-[#60A5FA]/30'
                    : 'border-slate-100 hover:border-[#3B82F6] hover:shadow-md hover:shadow-blue-50/50'
                }`}
              >
                {/* Icon wrapper */}
                <div
                  className={`mb-5 flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-[#3B82F6]/15 text-[#3B82F6]'
                      : 'bg-slate-50 text-[#6B7280] group-hover:bg-[#3B82F6]/10 group-hover:text-[#3B82F6]'
                  }`}
                >
                  {track.icon}
                </div>

                {/* Text content */}
                <h3 className="text-base font-bold text-[#111827] mb-2">{track.title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{track.description}</p>

                {/* Selection Checkmark Icon */}
                {isSelected && (
                  <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#3B82F6] text-white">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Sticky Bottom Section */}
      <div className="sticky bottom-0 z-40 w-full border-t border-slate-100 bg-[#FFFFFF] py-4 px-6 md:py-5 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="hidden sm:block text-sm text-[#6B7280]">
            {selectedId ? (
              <span>Selected Track: <strong className="text-[#111827] font-semibold">{selectedTrack?.title}</strong></span>
            ) : (
              <span>Select an interview track to unlock simulation</span>
            )}
          </div>

          <Link
            href={selectedId ? `/lobby?track=${selectedId}` : '#'}
            onClick={(e) => {
              if (!selectedId) {
                e.preventDefault();
              }
            }}
            className={`w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-base font-semibold text-white transition-all duration-300 ${
              selectedId
                ? 'bg-[#60A5FA] hover:bg-[#5094EA] shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Continue
          </Link>
        </div>
      </div>
    </div>
  );
}
