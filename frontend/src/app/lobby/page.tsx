'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

/* ─── Track metadata ─────────────────────────────────────── */
const TRACK_META: Record<
  string,
  { label: string; duration: string; difficulty: string; icon: string }
> = {
  swe:         { label: 'Software Engineering',  duration: '45 min', difficulty: 'Hard',   icon: 'fa-solid fa-code' },
  frontend:    { label: 'Frontend Development',  duration: '40 min', difficulty: 'Medium', icon: 'fa-solid fa-desktop' },
  backend:     { label: 'Backend Development',   duration: '45 min', difficulty: 'Hard',   icon: 'fa-solid fa-server' },
  datascience: { label: 'Data Science',          duration: '45 min', difficulty: 'Hard',   icon: 'fa-solid fa-chart-bar' },
  pm:          { label: 'Product Management',    duration: '35 min', difficulty: 'Medium', icon: 'fa-solid fa-briefcase' },
  finance:     { label: 'Finance',               duration: '30 min', difficulty: 'Medium', icon: 'fa-solid fa-dollar-sign' },
  hr:          { label: 'HR & Behavioral',       duration: '30 min', difficulty: 'Easy',   icon: 'fa-solid fa-users' },
  marketing:   { label: 'Marketing & Sales',     duration: '30 min', difficulty: 'Easy',   icon: 'fa-solid fa-bullhorn' },
};

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy:   'text-emerald-600 bg-emerald-50  border-emerald-100',
  Medium: 'text-amber-600  bg-amber-50    border-amber-100',
  Hard:   'text-red-600    bg-red-50      border-red-100',
};

/* ─── Main Lobby content ─────────────────────────────────── */
function LobbyContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const trackId      = searchParams.get('track') || 'swe';
  const meta         = TRACK_META[trackId] ?? TRACK_META['swe'];

  /* --- media state ------------------------------------------------ */
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camOn,  setCamOn]  = useState(false);
  const [micOn,  setMicOn]  = useState(false);
  const [camPermission, setCamPermission]  = useState<'idle' | 'granted' | 'denied'>('idle');
  const [micPermission, setMicPermission]  = useState<'idle' | 'granted' | 'denied'>('idle');
  const [videoStream,   setVideoStream]    = useState<MediaStream | null>(null);
  const [audioStream,   setAudioStream]    = useState<MediaStream | null>(null);
  const [isStarting,    setIsStarting]     = useState(false);

  /* --- audio visualiser ------------------------------------------- */
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animRef     = useRef<number>(0);

  /* ── camera helpers ──────────────────────────────────────────── */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoStream(stream);
      setCamPermission('granted');
      setCamOn(true);
    } catch {
      setCamPermission('denied');
      setCamOn(false);
    }
  };

  const stopCamera = () => {
    videoStream?.getTracks().forEach(t => t.stop());
    setVideoStream(null);
    setCamOn(false);
  };

  const toggleCamera = () => (camOn ? stopCamera() : startCamera());

  /* ── mic helpers ─────────────────────────────────────────────── */
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setMicPermission('granted');
      setMicOn(true);
    } catch {
      setMicPermission('denied');
      setMicOn(false);
    }
  };

  const stopMic = () => {
    audioStream?.getTracks().forEach(t => t.stop());
    // tear down audio context
    cancelAnimationFrame(animRef.current);
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setAudioStream(null);
    setMicOn(false);
  };

  const toggleMic = () => (micOn ? stopMic() : startMic());

  /* ── attach video stream to <video> ──────────────────────────── */
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  /* ── audio visualiser effect ─────────────────────────────────── */
  useEffect(() => {
    if (!audioStream || !micOn) return;

    const AudioCtxClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx      = new AudioCtxClass();
    const analyser = ctx.createAnalyser();
    const source   = ctx.createMediaStreamSource(audioStream);
    source.connect(analyser);
    analyser.fftSize = 64;

    audioCtxRef.current = ctx;
    const bufLen    = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufLen);
    const canvas    = canvasRef.current;
    if (!canvas) return;
    const cCtx = canvas.getContext('2d');
    if (!cCtx) return;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      cCtx.clearRect(0, 0, canvas.width, canvas.height);

      const barW = canvas.width / bufLen;
      for (let i = 0; i < bufLen; i++) {
        const h   = (dataArray[i] / 255) * canvas.height;
        const alpha = Math.max(0.2, dataArray[i] / 255);
        cCtx.fillStyle = `rgba(59,130,246,${alpha})`;
        cCtx.fillRect(i * barW, canvas.height - h, barW - 2, h);
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      ctx.close();
    };
  }, [audioStream, micOn]);

  /* ── clean up on unmount ─────────────────────────────────────── */
  useEffect(() => {
    return () => {
      videoStream?.getTracks().forEach(t => t.stop());
      audioStream?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  /* ── launch interview ────────────────────────────────────────── */
  const handleLaunch = async () => {
    setIsStarting(true);
    try {
      const res = await fetch('http://localhost:5000/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track: trackId, name: 'Candidate' }),
      });

      if (!res.ok) throw new Error('Session creation failed');
      const data = await res.json();

      // stop all media
      videoStream?.getTracks().forEach(t => t.stop());
      audioStream?.getTracks().forEach(t => t.stop());

      router.push(`/room?sessionId=${data.sessionId}`);
    } catch (err) {
      console.error(err);
      alert('Could not start interview. Make sure the backend server is running on port 5000.');
      setIsStarting(false);
    }
  };

  /* ── permission status icon helper ──────────────────────────── */
  const PermStatus = ({ status }: { status: 'idle' | 'granted' | 'denied' }) => {
    if (status === 'granted') return <span className="text-emerald-500 text-xs font-semibold flex items-center gap-1"><i className="fa-solid fa-circle-check" /> Ready</span>;
    if (status === 'denied')  return <span className="text-red-500   text-xs font-semibold flex items-center gap-1"><i className="fa-solid fa-circle-xmark" /> Denied</span>;
    return null;
  };

  /* ─── render ─────────────────────────────────────────────────── */
  return (
    <div className="relative flex min-h-screen flex-col bg-[#FAFAFA] font-sans antialiased text-[#111827]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-10 md:py-16">
        <div className="mx-auto w-full max-w-5xl">

          {/* ── Header ───────────────────────────────────────── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest text-[#3B82F6] uppercase border border-[#3B82F6]/20 bg-[#EFF6FF] mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] animate-pulse inline-block" />
              Prep Lobby
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111827] mb-3">
              Ready to begin?
            </h1>
            <p className="text-[#6B7280] text-sm sm:text-base max-w-md mx-auto">
              Set up your camera and microphone before launching your AI mock interview.
            </p>
          </div>

          {/* ── Two-column grid ───────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

            {/* ── LEFT: Camera Preview ─────────────────────────── */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">

              {/* Camera viewport */}
              <div className="relative aspect-video bg-[#0F172A] flex items-center justify-center">
                {camOn && videoStream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center">
                      <i className="fa-solid fa-video-slash text-3xl text-slate-500" />
                    </div>
                    <span className="text-sm text-slate-400">Camera is off</span>
                  </div>
                )}

                {/* Live badge */}
                {camOn && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                    Live
                  </div>
                )}
              </div>

              {/* Controls row */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">

                {/* Mic control */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={toggleMic}
                    className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-200 text-sm border ${
                      micOn
                        ? 'bg-[#3B82F6] border-[#3B82F6] text-white shadow-md shadow-blue-200'
                        : 'bg-white border-slate-200 text-slate-400 hover:border-[#3B82F6] hover:text-[#3B82F6]'
                    }`}
                    title={micOn ? 'Mute microphone' : 'Enable microphone'}
                  >
                    <i className={micOn ? 'fa-solid fa-microphone' : 'fa-solid fa-microphone-slash'} />
                  </button>
                  <span className="text-[10px] text-[#6B7280] font-medium">
                    {micOn ? 'Mic On' : 'Mic Off'}
                  </span>
                </div>

                {/* Waveform visualiser */}
                <div className="flex-1 mx-4">
                  {micOn ? (
                    <canvas
                      ref={canvasRef}
                      width={300}
                      height={40}
                      className="w-full h-[40px] rounded-lg bg-slate-50 border border-slate-100"
                    />
                  ) : (
                    <div className="h-[40px] rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <span className="text-[10px] text-slate-300 font-medium">Microphone inactive</span>
                    </div>
                  )}
                </div>

                {/* Cam control */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={toggleCamera}
                    className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-200 text-sm border ${
                      camOn
                        ? 'bg-[#3B82F6] border-[#3B82F6] text-white shadow-md shadow-blue-200'
                        : 'bg-white border-slate-200 text-slate-400 hover:border-[#3B82F6] hover:text-[#3B82F6]'
                    }`}
                    title={camOn ? 'Turn off camera' : 'Turn on camera'}
                  >
                    <i className={camOn ? 'fa-solid fa-video' : 'fa-solid fa-video-slash'} />
                  </button>
                  <span className="text-[10px] text-[#6B7280] font-medium">
                    {camOn ? 'Cam On' : 'Cam Off'}
                  </span>
                </div>
              </div>

              {/* Permission status strip */}
              {(camPermission !== 'idle' || micPermission !== 'idle') && (
                <div className="flex items-center gap-4 px-5 pb-4">
                  {camPermission !== 'idle' && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                      <i className="fa-solid fa-video text-[#6B7280]" />
                      Camera: <PermStatus status={camPermission} />
                    </div>
                  )}
                  {micPermission !== 'idle' && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                      <i className="fa-solid fa-microphone text-[#6B7280]" />
                      Mic: <PermStatus status={micPermission} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT: Interview Summary Card ─────────────────── */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-6">

              {/* Track info */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mb-3 block">
                  Interview Track
                </span>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
                    <i className={`${meta.icon} text-base`} />
                  </div>
                  <span className="text-base font-bold text-[#111827]">{meta.label}</span>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Stats */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280] flex items-center gap-2">
                    <i className="fa-solid fa-clock text-slate-300 w-4" />
                    Estimated Duration
                  </span>
                  <span className="text-sm font-semibold text-[#111827]">{meta.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280] flex items-center gap-2">
                    <i className="fa-solid fa-signal text-slate-300 w-4" />
                    Difficulty Level
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${DIFFICULTY_COLOR[meta.difficulty]}`}>
                    {meta.difficulty}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280] flex items-center gap-2">
                    <i className="fa-solid fa-robot text-slate-300 w-4" />
                    AI Interviewer
                  </span>
                  <span className="text-sm font-semibold text-[#111827]">Gemini AI</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280] flex items-center gap-2">
                    <i className="fa-solid fa-microphone text-slate-300 w-4" />
                    Microphone
                  </span>
                  <span className={`text-xs font-semibold ${micOn ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {micOn ? 'Ready' : 'Not enabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280] flex items-center gap-2">
                    <i className="fa-solid fa-video text-slate-300 w-4" />
                    Camera
                  </span>
                  <span className={`text-xs font-semibold ${camOn ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {camOn ? 'Ready' : 'Not enabled'}
                  </span>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Tips */}
              <div className="bg-[#EFF6FF] rounded-xl p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#3B82F6] mb-2">
                  <i className="fa-solid fa-lightbulb mr-1" /> Quick Tips
                </p>
                <ul className="space-y-1.5 text-xs text-[#6B7280]">
                  <li className="flex items-start gap-2"><i className="fa-solid fa-circle-dot text-[#60A5FA] mt-0.5 text-[8px]" /> Find a quiet, well-lit environment</li>
                  <li className="flex items-start gap-2"><i className="fa-solid fa-circle-dot text-[#60A5FA] mt-0.5 text-[8px]" /> Speak clearly and at a steady pace</li>
                  <li className="flex items-start gap-2"><i className="fa-solid fa-circle-dot text-[#60A5FA] mt-0.5 text-[8px]" /> Think out loud — the AI values reasoning</li>
                </ul>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 mt-auto">
                <button
                  onClick={handleLaunch}
                  disabled={isStarting}
                  className={`w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                    isStarting
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#3B82F6] hover:bg-[#2563EB] shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                >
                  {isStarting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Starting Session…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-rocket" />
                      Launch Interview
                    </>
                  )}
                </button>

                <button
                  onClick={() => router.push('/interview-type')}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-[#6B7280] border border-slate-200 bg-white hover:border-slate-300 hover:text-[#111827] transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── Suspense wrapper ───────────────────────────────────────── */
export default function LobbyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]" />
        </div>
      }
    >
      <LobbyContent />
    </Suspense>
  );
}
