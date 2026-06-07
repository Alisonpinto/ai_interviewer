'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface ReportData {
  session_id: string;
  overall_score: number;
  categories: {
    technical_accuracy: number;
    communication: number;
    problem_solving: number;
    culture_fit: number;
  };
  strengths: string[];
  weaknesses: string[];
  advice: string[];
  question_feedback: Array<{
    question: string;
    answer: string;
    score: number;
    critique: string;
  }>;
}

export default function ReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) return;

    const fetchReport = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}/report`);
        if (!response.ok) {
          throw new Error('Report not found');
        }
        const data = await response.json();
        setReport(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load the evaluation report. Make sure the interview was ended successfully.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen flex-col bg-[#FFFFFF] font-sans antialiased text-[#111827]">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-[#3B82F6]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium text-[#6B7280]">Analyzing performance and compiling report...</span>
          </div>
        </main>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="relative flex min-h-screen flex-col bg-[#FFFFFF] font-sans antialiased text-[#111827]">
        <Navbar />
        <main className="flex-grow flex items-center justify-center px-6 text-center py-20">
          <div className="max-w-md bg-white border border-slate-100 p-8 rounded-2xl shadow-sm">
            <i className="fa-solid fa-triangle-exclamation text-red-500 text-4xl mb-4"></i>
            <h2 className="text-xl font-bold text-[#111827] mb-2">Failed to Load Report</h2>
            <p className="text-[#6B7280] text-sm mb-6">{error || 'Something went wrong.'}</p>
            <Link href="/" className="inline-flex items-center justify-center rounded-lg bg-[#3B82F6] px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors">
              Return Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#FFFFFF] font-sans antialiased text-[#111827]">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-12 md:py-16">
        {/* Header link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            <i className="fa-solid fa-arrow-left"></i>
            Back to Dashboard
          </Link>
        </div>

        {/* Title Block */}
        <div className="border-b border-slate-100 pb-8 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-[#3B82F6] uppercase border border-[#3B82F6]/20 bg-[#EFF6FF] mb-3">
              Performance Scorecard
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
              Interview Feedback Report
            </h1>
            <p className="text-[#6B7280] text-sm mt-1">
              Session ID: <span className="font-mono text-xs">{report.session_id}</span>
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-[#111827] transition-colors"
          >
            <i className="fa-solid fa-print"></i>
            Print Report
          </button>
        </div>

        {/* Score Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          {/* Large Overall Score Card */}
          <div className="md:col-span-4 bg-white border border-slate-100 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6B7280] mb-4">
              Overall Score
            </span>
            <div className="relative flex items-center justify-center h-36 w-36 rounded-full border-[10px] border-blue-50">
              <div className="absolute inset-0 rounded-full border-[10px] border-t-[#3B82F6] border-r-[#3B82F6] border-b-blue-50 border-l-blue-50"></div>
              <span className="text-4xl font-extrabold text-[#111827]">
                {report.overall_score}%
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full mt-6">
              Simulation Complete
            </span>
          </div>

          {/* Subcategory Progress Card */}
          <div className="md:col-span-8 bg-white border border-slate-100 rounded-2xl p-8 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-6 block">
              Skill Categories Breakdown
            </span>
            
            <div className="space-y-5">
              {/* Category 1 */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#111827] mb-1.5">
                  <span>Technical Accuracy</span>
                  <span>{report.categories.technical_accuracy}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#3B82F6] h-full rounded-full transition-all duration-500" style={{ width: `${report.categories.technical_accuracy}%` }}></div>
                </div>
              </div>

              {/* Category 2 */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#111827] mb-1.5">
                  <span>Communication Skills</span>
                  <span>{report.categories.communication}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#3B82F6] h-full rounded-full transition-all duration-500" style={{ width: `${report.categories.communication}%` }}></div>
                </div>
              </div>

              {/* Category 3 */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#111827] mb-1.5">
                  <span>Problem Solving</span>
                  <span>{report.categories.problem_solving}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#3B82F6] h-full rounded-full transition-all duration-500" style={{ width: `${report.categories.problem_solving}%` }}></div>
                </div>
              </div>

              {/* Category 4 */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#111827] mb-1.5">
                  <span>Culture Fit</span>
                  <span>{report.categories.culture_fit}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#3B82F6] h-full rounded-full transition-all duration-500" style={{ width: `${report.categories.culture_fit}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Strengths */}
          <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-6 flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-emerald-500 text-lg"></i>
              Key Strengths
            </h3>
            <ul className="space-y-4">
              {report.strengths.map((str, idx) => (
                <li key={idx} className="text-sm text-[#111827] flex items-start gap-2.5 leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                  {str}
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 mb-6 flex items-center gap-2">
              <i className="fa-solid fa-circle-xmark text-amber-500 text-lg"></i>
              Areas for Improvement
            </h3>
            <ul className="space-y-4">
              {report.weaknesses.map((weak, idx) => (
                <li key={idx} className="text-sm text-[#111827] flex items-start gap-2.5 leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                  {weak}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actionable Tips */}
        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm mb-12">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#111827] mb-6 flex items-center gap-2">
            <i className="fa-solid fa-lightbulb text-[#3B82F6] text-lg"></i>
            Actionable Tips for Growth
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.advice.map((tip, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-[#6B7280] leading-relaxed">
                <strong className="text-[#111827] block mb-1">Recommendation {idx + 1}</strong>
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* Question Critique Section */}
        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#111827] mb-8 flex items-center gap-2">
            <i className="fa-solid fa-comments text-[#3B82F6] text-lg"></i>
            Detailed Transcript & Critique
          </h3>
          
          <div className="space-y-8">
            {report.question_feedback.map((fb, idx) => (
              <div key={idx} className="border-b border-slate-100 last:border-b-0 pb-8 last:pb-0">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-[#3B82F6] bg-[#3B82F6]/5 border border-[#3B82F6]/10 px-3 py-1 rounded-full">
                    Question {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-[#6B7280]">
                    Score: <strong className="text-[#111827]">{fb.score}/100</strong>
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">Interviewer Question</span>
                    <p className="text-sm text-[#111827] font-medium leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                      {fb.question}
                    </p>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">Your Answer</span>
                    <p className="text-sm text-[#6B7280] italic leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                      {fb.answer || '(No answer recorded)'}
                    </p>
                  </div>

                  <div className="pt-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">Critique & Improvement</span>
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      {fb.critique}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
