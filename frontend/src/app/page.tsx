'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-[#FFFFFF] via-[#FFFFFF] to-[#EFF6FF] font-sans antialiased text-[#111827]">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-20 text-center md:py-32">
        <div className="mx-auto max-w-5xl flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-[#3B82F6] uppercase border border-[#3B82F6]/25 bg-[#FFFFFF] shadow-sm mb-6">
            AI Powered Interview Practice
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-[#111827] mb-6 max-w-4xl leading-[1.1]">
            Practice Real Interviews <br className="hidden sm:inline" />
            With AI
          </h1>

          {/* Subheading */}
          <p className="text-[#6B7280] text-base sm:text-lg md:text-xl font-normal leading-relaxed max-w-[700px] mb-12">
            Prepare for technical, HR, finance, and behavioral interviews with an AI interviewer that adapts to your answers in real time.
          </p>

          {/* Main CTA Button */}
          <Link
            href="/interview-type"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-[#60A5FA] rounded-xl hover:bg-[#5094EA] shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            Start Your Mock Interview
          </Link>

          {/* Decoration (Monochrome Company List) */}
          <div className="mt-24 pt-12 border-t border-slate-100/80 w-full max-w-4xl">
            <p className="text-xs font-semibold tracking-widest text-[#6B7280]/60 uppercase mb-8">
              Trusted by students preparing for:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 md:gap-x-16 text-[#6B7280]/50 font-bold text-sm tracking-widest">
              <span className="hover:text-[#6B7280] transition-colors">GOOGLE</span>
              <span className="hover:text-[#6B7280] transition-colors">MICROSOFT</span>
              <span className="hover:text-[#6B7280] transition-colors">AMAZON</span>
              <span className="hover:text-[#6B7280] transition-colors">INFOSYS</span>
              <span className="hover:text-[#6B7280] transition-colors">TCS</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

