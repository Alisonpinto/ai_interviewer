'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

/* ═══════════════════════════════════════════════════════════
   TRACK LABELS
═══════════════════════════════════════════════════════════ */
const TRACK_LABELS: Record<string, string> = {
  swe: 'Software Engineering', frontend: 'Frontend Development',
  backend: 'Backend Development', datascience: 'Data Science',
  pm: 'Product Management', finance: 'Finance',
  hr: 'HR & Behavioral', marketing: 'Marketing & Sales',
};

const API_BASE = 'http://localhost:5000';

/* ═══════════════════════════════════════════════════════════
   AVATAR CANVAS COMPONENT
═══════════════════════════════════════════════════════════ */
function AvatarCanvas({ state }: { state: AvatarState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const rotRef    = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);
      const t = Date.now() / 1000;

      if (state === 'idle') {
        const r = 52 + Math.sin(t * 1.8) * 4;
        const grd = ctx.createRadialGradient(cx, cy, 20, cx, cy, r + 24);
        grd.addColorStop(0, 'rgba(59,130,246,0.18)');
        grd.addColorStop(1, 'rgba(59,130,246,0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(cx, cy, r + 24, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3B82F6';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('AI', cx, cy);

      } else if (state === 'thinking') {
        rotRef.current += 0.05;
        ctx.strokeStyle = 'rgba(96,165,250,0.35)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, 64, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#3B82F6';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(rotRef.current) * 64, cy + Math.sin(rotRef.current) * 64, 7, 0, Math.PI * 2);
        ctx.fill();
        const pR = 44 + Math.sin(rotRef.current * 3) * 5;
        ctx.fillStyle = 'rgba(96,165,250,0.12)';
        ctx.beginPath(); ctx.arc(cx, cy, pR, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3B82F6';
        ctx.beginPath(); ctx.arc(cx, cy, 32, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('...', cx, cy);

      } else if (state === 'listening') {
        const vol = 0.5 + Math.sin(t * 6) * 0.5;
        for (let j = 0; j < 3; j++) {
          const rr = 56 + j * 18 + vol * 18;
          ctx.strokeStyle = `rgba(96,165,250,${0.55 - j * 0.17})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = '#60A5FA';
        ctx.beginPath(); ctx.arc(cx, cy, 44, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('AI', cx, cy);

      } else if (state === 'speaking') {
        const avg = 0.5 + Math.sin(t * 5) * 0.5;
        for (let k = 0; k < 4; k++) {
          ctx.beginPath();
          const amp = 9 + avg * 28 * (0.5 + k * 0.18);
          const freq = 0.04 - k * 0.008;
          for (let sx = cx - 120; sx <= cx + 120; sx++) {
            const sy = cy + Math.sin((sx + t * 120) * freq) * amp * Math.cos(((sx - cx) / 120) * (Math.PI / 2));
            sx === cx - 120 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
          }
          ctx.strokeStyle = `rgba(59,130,246,${0.85 - k * 0.18})`; ctx.lineWidth = 2.5 - k * 0.4;
          ctx.stroke();
        }
        ctx.fillStyle = '#3B82F6';
        ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('AI', cx, cy);
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [state]);

  return (
    <canvas ref={canvasRef} width={240} height={240} className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]" />
  );
}

/* ═══════════════════════════════════════════════════════════
   TRANSCRIPT SIDEBAR
═══════════════════════════════════════════════════════════ */
function TranscriptSidebar({ messages, open, onClose }: {
  messages: Message[]; open: boolean; onClose: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} />}
      <aside className={`fixed right-0 top-0 h-full w-[320px] bg-[#0F172A] border-l border-white/5 flex flex-col z-40 transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-list text-[#60A5FA] text-sm" />
            <span className="text-sm font-bold text-white tracking-wide">Transcript</span>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <i className="fa-solid fa-xmark text-xs" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-slate-500 text-xs text-center py-8">No messages yet.</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col gap-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${msg.sender === 'ai' ? 'text-[#60A5FA]' : 'text-slate-400'}`}>
                {msg.sender === 'ai' ? 'AI Interviewer' : 'You'}
              </span>
              <div className={`max-w-[90%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${msg.sender === 'ai' ? 'bg-white/8 border border-white/10 text-slate-200' : 'bg-[#3B82F6]/20 border border-[#3B82F6]/30 text-blue-100'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-[10px] text-slate-500 text-center">Live transcript · auto-scroll enabled</p>
        </div>
      </aside>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   TIMER HOOK
═══════════════════════════════════════════════════════════ */
function useTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/* ═══════════════════════════════════════════════════════════
   CONTROL BUTTON
═══════════════════════════════════════════════════════════ */
function ControlButton({ active, activeClass, inactiveClass, icon, label, onClick }: {
  active: boolean; activeClass: string; inactiveClass: string;
  icon: string; label: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all ${active ? activeClass : inactiveClass}`}>
      <i className={`fa-solid ${icon} text-base`} />
      <span className="text-[10px] font-semibold hidden sm:block">{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN ROOM CONTENT
═══════════════════════════════════════════════════════════ */
function RoomContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const sessionId    = searchParams.get('sessionId');

  /* ── state ─────────────────────────────────────────────── */
  const [avatarState,    setAvatarState]    = useState<AvatarState>('thinking');
  const [micMuted,       setMicMuted]       = useState(false);
  const [camOff,         setCamOff]         = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [currentAiText,  setCurrentAiText]  = useState('');
  const [userSpeechText, setUserSpeechText] = useState('');
  const [isEnding,       setIsEnding]       = useState(false);
  const [endModalOpen,   setEndModalOpen]   = useState(false);
  const [track,          setTrack]          = useState('swe');
  const [error,          setError]          = useState('');
  const [sessionReady,   setSessionReady]   = useState(false);
  const timer = useTimer(sessionReady);

  /* ── refs ──────────────────────────────────────────────── */
  const videoRef       = useRef<HTMLVideoElement>(null);
  const videoStream    = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef       = useRef<HTMLAudioElement | null>(null);

  /* ── camera ─────────────────────────────────────────────── */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoStream.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      console.warn('[Camera] Not available or permission denied');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => { videoStream.current?.getTracks().forEach(t => t.stop()); };
  }, [startCamera]);

  const toggleCam = () => {
    if (camOff) { startCamera(); setCamOff(false); }
    else {
      videoStream.current?.getTracks().forEach(t => t.stop());
      videoStream.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamOff(true);
    }
  };

  /* ── play AI audio (base64 MP3 or Web Speech fallback) ─── */
  const speakText = useCallback((text: string, audioBase64?: string | null) => {
    // Stop any previous speech
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();

    setAvatarState('speaking');

    const onDone = () => { setAvatarState('idle'); };

    if (audioBase64) {
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      audioRef.current = audio;
      audio.onended = onDone;
      audio.onerror = onDone;
      audio.play().catch(onDone);
    } else if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utt = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith('en') && /google/i.test(v.name)) || voices[0];
      if (voice) utt.voice = voice;
      utt.rate = 1.0;
      utt.onend  = onDone;
      utt.onerror = onDone;
      window.speechSynthesis.speak(utt);
    } else {
      setTimeout(onDone, Math.max(2000, text.length * 60));
    }
  }, []);

  /* ── load session on mount ──────────────────────────────── */
  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided. Please start from the lobby.');
      return;
    }

    const init = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/history`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setTrack(data.track);
        setSessionReady(true);

        if (data.history && data.history.length > 0) {
          const msgs: Message[] = data.history.map((m: any, i: number) => ({
            id: String(i),
            sender: m.sender,
            text: m.text,
            timestamp: new Date(m.created_at || Date.now()),
          }));
          setMessages(msgs);

          const lastAI = msgs.filter(m => m.sender === 'ai').pop();
          if (lastAI) {
            setCurrentAiText(lastAI.text);
            speakText(lastAI.text, null);
          }
        }
      } catch (err) {
        console.error('[Room] Init error:', err);
        setError('Could not load session. Make sure the backend server is running on port 5000.');
      }
    };

    init();
    return () => {
      window.speechSynthesis?.cancel();
      if (audioRef.current) { audioRef.current.pause(); }
      recognitionRef.current?.stop();
    };
  }, [sessionId, speakText]);

  /* ── speech recognition ─────────────────────────────────── */
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { console.warn('[STT] Speech Recognition not supported'); return; }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    recognitionRef.current = rec;

    rec.onresult = (e: any) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        e.results[i].isFinal ? (final += e.results[i][0].transcript) : (interim += e.results[i][0].transcript);
      }
      setUserSpeechText(final || interim);
    };
    rec.onerror = (e: any) => { if (e.error !== 'no-speech') console.error('[STT]', e.error); };
    rec.onend   = () => { try { rec.start(); } catch {} };

    try { rec.start(); } catch {}
    setAvatarState('listening');
    setUserSpeechText('');
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  // Auto-start listening when avatar becomes idle
  useEffect(() => {
    if (avatarState === 'idle' && !micMuted && sessionReady) {
      const t = setTimeout(startListening, 500);
      return () => clearTimeout(t);
    }
  }, [avatarState, micMuted, sessionReady, startListening]);

  /* ── submit answer to backend ────────────────────────────── */
  const submitAnswer = async () => {
    const text = userSpeechText.trim();
    if (!text || !sessionId) return;

    stopListening();
    setUserSpeechText('');
    setAvatarState('thinking');

    // Add user message to UI immediately
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userText: text }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'ai',
        text: data.aiText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setCurrentAiText(data.aiText);

      // Speak the AI response
      speakText(data.aiText, data.audioContent ?? null);
    } catch (err) {
      console.error('[Submit] Error:', err);
      setAvatarState('idle');
      alert('Failed to get AI response. Please check your connection.');
    }
  };

  /* ── toggle mute ─────────────────────────────────────────── */
  const toggleMic = () => {
    if (micMuted) {
      setMicMuted(false);
      if (avatarState === 'idle') startListening();
    } else {
      setMicMuted(true);
      stopListening();
      setAvatarState('idle');
    }
  };

  /* ── end interview ──────────────────────────────────────── */
  const handleEndInterview = async () => {
    setIsEnding(true);
    stopListening();
    window.speechSynthesis?.cancel();
    if (audioRef.current) { audioRef.current.pause(); }
    videoStream.current?.getTracks().forEach(t => t.stop());

    try {
      const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/end`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push(`/report/${sessionId}`);
    } catch (err) {
      console.error('[End] Error:', err);
      alert('Failed to generate report. Please check the backend.');
      setIsEnding(false);
    }
  };

  /* ── state indicator helpers ──────────────────────────────── */
  const stateConfig = {
    idle:      { text: 'Ready',       badge: 'bg-white/5 border-white/10 text-slate-500',            icon: 'fa-circle-dot' },
    thinking:  { text: 'Thinking…',  badge: 'bg-amber-500/15 border-amber-500/30 text-amber-400',   icon: 'fa-spinner' },
    listening: { text: 'Listening…', badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', icon: 'fa-microphone' },
    speaking:  { text: 'Speaking…',  badge: 'bg-[#3B82F6]/20 border-[#3B82F6]/40 text-[#60A5FA]',  icon: 'fa-volume-high' },
  };

  /* ── error state ─────────────────────────────────────────── */
  if (error) {
    return (
      <div className="h-screen w-screen bg-[#0B1120] flex items-center justify-center p-6">
        <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center">
          <i className="fa-solid fa-triangle-exclamation text-red-400 text-3xl mb-4 block" />
          <h2 className="text-white font-bold text-lg mb-2">Session Error</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <Link href="/interview-type" className="inline-flex items-center gap-2 bg-[#3B82F6] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-500 transition-colors">
            <i className="fa-solid fa-arrow-left" /> Back to Interview Selection
          </Link>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0B1120] flex flex-col font-sans antialiased select-none">

      {/* ── TOP BAR ─────────────────────────────────────── */}
      <header className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-b border-white/8 bg-[#0F172A]/90 backdrop-blur-sm z-20">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="h-7 w-7 rounded-lg bg-[#3B82F6] flex items-center justify-center">
              <i className="fa-solid fa-brain text-white text-xs" />
            </div>
            <span className="text-white font-bold text-sm hidden sm:block">Mock Interview AI</span>
          </Link>
          <div className="h-4 w-px bg-white/15 hidden sm:block" />
          <span className="text-xs font-semibold text-slate-400 truncate hidden sm:block">{TRACK_LABELS[track] || track}</span>
        </div>

        {/* Center: Timer */}
        <div className="flex items-center gap-2 bg-white/6 border border-white/10 rounded-full px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
          <span className="text-white font-mono text-sm font-semibold tracking-widest">{timer}</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold ${sessionReady ? 'text-emerald-400' : 'text-amber-400'}`}>
            <i className={`fa-solid ${sessionReady ? 'fa-signal' : 'fa-circle-notch fa-spin'} text-[10px]`} />
            {sessionReady ? 'Live' : 'Connecting…'}
          </div>
          <button
            onClick={() => setTranscriptOpen(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${transcriptOpen ? 'bg-[#3B82F6]/20 border-[#3B82F6]/40 text-[#60A5FA]' : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
          >
            <i className="fa-solid fa-list-ul text-[10px]" />
            <span className="hidden sm:inline">Transcript</span>
            {messages.length > 0 && (
              <span className="bg-[#3B82F6] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── VIDEO GRID ──────────────────────────────────── */}
      <main className="flex-1 flex gap-3 p-3 overflow-hidden min-h-0">

        {/* LEFT: AI Interviewer Panel */}
        <div className="flex-1 flex flex-col rounded-2xl bg-[#0F172A] border border-white/8 overflow-hidden relative min-w-0">

          {/* Name badge */}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 z-10">
            <div className="h-5 w-5 rounded-full bg-[#3B82F6] flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-robot text-white text-[8px]" />
            </div>
            <span className="text-xs font-semibold text-white">AI Interviewer</span>
          </div>

          {/* State badge */}
          <div className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 z-10 text-[10px] font-bold uppercase tracking-wide border backdrop-blur-sm transition-all ${stateConfig[avatarState].badge}`}>
            <i className={`fa-solid ${stateConfig[avatarState].icon} text-[9px]${avatarState === 'thinking' ? ' fa-spin' : ''}`} />
            {stateConfig[avatarState].text}
          </div>

          {/* Avatar canvas */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
            <AvatarCanvas state={avatarState} />

            {/* AI speech text */}
            {(avatarState === 'speaking' || avatarState === 'idle') && currentAiText && (
              <div className="w-full max-w-lg bg-white/6 border border-white/10 rounded-xl px-5 py-4 text-center">
                <p className="text-slate-200 text-sm leading-relaxed">{currentAiText}</p>
              </div>
            )}

            {avatarState === 'thinking' && (
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <i className="fa-solid fa-spinner fa-spin" /> Processing your answer…
              </div>
            )}
          </div>

          {/* Listening caption strip */}
          {avatarState === 'listening' && (
            <div className="px-5 pb-4 flex-shrink-0">
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-2.5 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <p className="text-emerald-200 text-xs italic flex-1 truncate">
                  {userSpeechText || 'Listening… speak your answer clearly.'}
                </p>
                {userSpeechText.trim() && (
                  <button onClick={submitAnswer} className="flex-shrink-0 bg-[#3B82F6] hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <i className="fa-solid fa-paper-plane text-[9px]" /> Send
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: User Camera Feed */}
        <div className="w-[280px] xl:w-[340px] flex-shrink-0 flex flex-col rounded-2xl bg-[#0F172A] border border-white/8 overflow-hidden relative">
          {!camOff ? (
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center">
                <i className="fa-solid fa-video-slash text-2xl text-slate-600" />
              </div>
              <span className="text-xs text-slate-500">Camera off</span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
            <i className="fa-solid fa-user text-white text-[10px]" />
            <span className="text-xs font-semibold text-white">You</span>
            {micMuted && <i className="fa-solid fa-microphone-slash text-red-400 text-[10px]" />}
          </div>
          {micMuted && (
            <div className="absolute top-3 right-3 bg-red-500/20 border border-red-500/40 rounded-full p-1.5">
              <i className="fa-solid fa-microphone-slash text-red-400 text-xs" />
            </div>
          )}
        </div>
      </main>

      {/* ── BOTTOM CONTROLS ─────────────────────────────── */}
      <footer className="flex-shrink-0 h-[72px] px-6 flex items-center justify-between border-t border-white/8 bg-[#0F172A]/90 backdrop-blur-sm gap-4">
        {/* Left: device controls */}
        <div className="flex items-center gap-2">
          <ControlButton active={micMuted}  activeClass="bg-red-500/20 border-red-500/40 text-red-400"   inactiveClass="border-white/10 text-slate-300 hover:border-white/25 hover:text-white" icon={micMuted ? 'fa-microphone-slash' : 'fa-microphone'} label={micMuted ? 'Unmute' : 'Mute'}    onClick={toggleMic} />
          <ControlButton active={camOff}   activeClass="bg-red-500/20 border-red-500/40 text-red-400"   inactiveClass="border-white/10 text-slate-300 hover:border-white/25 hover:text-white" icon={camOff ? 'fa-video-slash' : 'fa-video'}                label={camOff ? 'Show Cam' : 'Hide Cam'} onClick={toggleCam} />
        </div>

        {/* Center: CTA */}
        <div className="flex items-center gap-3">
          {avatarState === 'idle' && !micMuted && (
            <button onClick={startListening} className="flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-900/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <i className="fa-solid fa-microphone" /> Start Speaking
            </button>
          )}
          {avatarState === 'listening' && userSpeechText.trim() && (
            <button onClick={submitAnswer} className="flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-900/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <i className="fa-solid fa-paper-plane" /> Submit Answer
            </button>
          )}
          {avatarState === 'speaking' && <span className="text-xs text-[#60A5FA] font-semibold flex items-center gap-2"><i className="fa-solid fa-volume-high animate-pulse" /> AI is speaking…</span>}
          {avatarState === 'thinking' && <span className="text-xs text-amber-400 font-semibold flex items-center gap-2"><i className="fa-solid fa-spinner fa-spin" /> Generating response…</span>}
          {avatarState === 'listening' && !userSpeechText && <span className="text-xs text-emerald-400 font-semibold flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse inline-block" /> Listening…</span>}
        </div>

        {/* Right: End Interview */}
        <button onClick={() => setEndModalOpen(true)} disabled={isEnding} className="flex items-center gap-2 border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
          <i className="fa-solid fa-phone-slash" />
          <span className="hidden sm:inline">End Interview</span>
        </button>
      </footer>

      {/* ── TRANSCRIPT SIDEBAR ──────────────────────────── */}
      <TranscriptSidebar messages={messages} open={transcriptOpen} onClose={() => setTranscriptOpen(false)} />

      {/* ── END INTERVIEW MODAL ─────────────────────────── */}
      {endModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="h-14 w-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-phone-slash text-red-400 text-xl" />
            </div>
            <h2 className="text-white font-bold text-lg mb-2">End Interview?</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Your session will be closed and an AI-generated evaluation report will be created from your answers.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setEndModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/25 text-sm font-semibold transition-colors">
                Keep Going
              </button>
              <button onClick={handleEndInterview} disabled={isEnding} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {isEnding ? <><i className="fa-solid fa-spinner fa-spin" /> Ending…</> : 'End Interview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUSPENSE WRAPPER
═══════════════════════════════════════════════════════════ */
export default function RoomPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-[#0B1120]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3B82F6]" />
          <span className="text-slate-400 text-sm">Loading interview room…</span>
        </div>
      </div>
    }>
      <RoomContent />
    </Suspense>
  );
}
