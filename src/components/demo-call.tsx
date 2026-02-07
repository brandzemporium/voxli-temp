'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type CallState =
  | 'idle'
  | 'loading'
  | 'pre-call'
  | 'connecting'
  | 'active'
  | 'post-call'
  | 'limit-reached'
  | 'error';

interface DemoConfig {
  businessName: string;
  assistantId: string;
  vapiPublicKey: string;
  maxDurationSeconds: number;
}

const STORAGE_KEY = 'voxli_demo_calls';
const MAX_DAILY_CALLS = 3;
const DEMO_CONFIG_URL =
  process.env.NEXT_PUBLIC_DEMO_CONFIG_URL ||
  'https://app.getvoxli.ai/api/widget/demo-config';

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getRateLimitData(): { count: number; date: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, date: getTodayStr() };
    const data = JSON.parse(raw);
    if (data.date !== getTodayStr()) return { count: 0, date: getTodayStr() };
    return data;
  } catch {
    return { count: 0, date: getTodayStr() };
  }
}

function incrementRateLimit(): void {
  const data = getRateLimitData();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ count: data.count + 1, date: getTodayStr() })
  );
}

function isRateLimited(): boolean {
  return getRateLimitData().count >= MAX_DAILY_CALLS;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function DemoCall() {
  const [callState, setCallState] = useState<CallState>('idle');
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [speakingState, setSpeakingState] = useState<'idle' | 'listening' | 'speaking'>('idle');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vapiRef = useRef<any>(null);
  const configRef = useRef<DemoConfig | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRateLimited()) setCallState('limit-reached');
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (vapiRef.current) {
      try { vapiRef.current.stop(); } catch { /* ignore */ }
      vapiRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const handleTryIt = async () => {
    if (isRateLimited()) { setCallState('limit-reached'); return; }
    setCallState('loading');
    setErrorMessage('');

    try {
      console.log('[DemoCall] Fetching config from:', DEMO_CONFIG_URL);
      const res = await fetch(DEMO_CONFIG_URL);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('[DemoCall] Config response error:', res.status, data);
        setErrorMessage(data.error || 'Demo is currently unavailable');
        setCallState('error');
        return;
      }
      const config = await res.json();
      console.log('[DemoCall] Config loaded:', { businessName: config.businessName, hasAssistantId: !!config.assistantId, hasKey: !!config.vapiPublicKey });
      if (!config.assistantId || !config.vapiPublicKey) {
        setErrorMessage('Demo is not fully configured yet.');
        setCallState('error');
        return;
      }
      configRef.current = config;
      setCallState('pre-call');
    } catch (err) {
      console.error('[DemoCall] Fetch failed:', err, 'URL:', DEMO_CONFIG_URL);
      setErrorMessage(`Could not reach demo server. Check that NEXT_PUBLIC_DEMO_CONFIG_URL is set correctly.`);
      setCallState('error');
    }
  };

  const handleConfirmCall = async () => {
    if (!configRef.current) return;
    setCallState('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setErrorMessage('Microphone access is needed for the demo call');
      setCallState('error');
      return;
    }

    try {
      const { default: Vapi } = await import('@vapi-ai/web');
      const vapi = new Vapi(configRef.current.vapiPublicKey);
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        setCallState('active');
        setSpeakingState('listening');
        setTimer(0);
        timerRef.current = setInterval(() => setTimer((p) => p + 1), 1000);
      });

      vapi.on('call-end', () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setSpeakingState('idle');
        setCallState('post-call');
      });

      vapi.on('speech-start', () => setSpeakingState('speaking'));
      vapi.on('speech-end', () => setSpeakingState('listening'));

      vapi.on('error', (err: unknown) => {
        console.error('Vapi error:', err);
        cleanup();
        setErrorMessage('Connection failed. Please try again.');
        setCallState('error');
      });

      incrementRateLimit();
      await vapi.start(configRef.current.assistantId, {
        maxDurationSeconds: configRef.current.maxDurationSeconds,
      } as Record<string, unknown>);
    } catch (err) {
      console.error('Failed to start call:', err);
      cleanup();
      setErrorMessage('Connection failed. Please try again.');
      setCallState('error');
    }
  };

  const handleEndCall = () => {
    cleanup();
    setCallState('post-call');
  };

  const handleMuteToggle = () => {
    if (vapiRef.current) {
      const newMuted = !isMuted;
      vapiRef.current.setMuted(newMuted);
      setIsMuted(newMuted);
    }
  };

  const handleReset = () => {
    setTimer(0);
    setIsMuted(false);
    setErrorMessage('');
    setSpeakingState('idle');
    setCallState(isRateLimited() ? 'limit-reached' : 'idle');
  };

  return (
    <section id="demo" className="relative py-32 overflow-hidden">
      {/* Section glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-signal/[0.03] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <h2 className="reveal font-display font-700 text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4">
          Hear It in Action
        </h2>
        <p className="reveal text-text-secondary font-body text-lg mb-16 max-w-lg mx-auto">
          Talk to our AI receptionist right now. No signup, no download&mdash;just
          click and speak.
        </p>

        <div className="reveal">
          {/* Idle: orbital call button */}
          {callState === 'idle' && (
            <div className="flex flex-col items-center gap-6">
              <button
                onClick={handleTryIt}
                className="group relative w-28 h-28 rounded-full bg-slate-deep border border-slate-mid transition-all duration-300 hover:border-signal/50 hover:shadow-[0_0_40px_rgba(65,196,203,0.2)]"
              >
                {/* Orbital dots */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="orbital-dot absolute w-2 h-2 rounded-full bg-signal/60" />
                  <span className="orbital-dot-reverse absolute w-1.5 h-1.5 rounded-full bg-signal/30" />
                </div>
                {/* Phone icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-signal transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
              </button>
              <div>
                <p className="text-sm font-medium text-text-primary font-body mb-1">
                  Start Demo Call
                </p>
                <p className="text-xs text-text-muted">
                  2-minute call &middot; {MAX_DAILY_CALLS - getRateLimitData().count} remaining today
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {callState === 'loading' && (
            <div className="flex items-center justify-center gap-3 text-text-secondary">
              <svg className="animate-spin h-5 w-5 text-signal" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-body">Loading demo...</span>
            </div>
          )}

          {/* Pre-call confirmation */}
          {callState === 'pre-call' && (
            <div className="inline-block rounded-2xl border border-slate-mid bg-slate-deep/80 backdrop-blur-sm p-8 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-signal/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-600 mb-2">Ready to talk?</h3>
              <p className="text-sm text-text-secondary mb-6 font-body">
                You&apos;ll speak with Voxli&apos;s AI receptionist. Microphone access is required.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmCall}
                  className="flex-1 rounded-lg bg-signal px-4 py-3 text-sm font-semibold text-void transition-all hover:bg-signal-bright hover:shadow-[0_0_20px_rgba(65,196,203,0.3)]"
                >
                  Start Call
                </button>
                <button
                  onClick={() => setCallState('idle')}
                  className="flex-1 rounded-lg border border-slate-mid px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:border-slate-light hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Connecting */}
          {callState === 'connecting' && (
            <div className="inline-block rounded-2xl border border-slate-mid bg-slate-deep/80 backdrop-blur-sm p-8 max-w-sm mx-auto">
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-signal/10 flex items-center justify-center">
                  <svg className="animate-spin h-7 w-7 text-signal" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-text-primary">Connecting to Voxli...</p>
                <p className="text-xs text-text-muted">Allow microphone access if prompted</p>
              </div>
            </div>
          )}

          {/* Active call */}
          {callState === 'active' && (
            <div className="inline-block rounded-2xl border border-signal/30 bg-slate-deep/80 backdrop-blur-sm p-8 max-w-sm mx-auto shadow-[0_0_40px_rgba(65,196,203,0.08)]">
              <div className="flex flex-col items-center gap-5">
                {/* Speaking indicator bars */}
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-0.5 h-5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-colors ${
                          speakingState === 'speaking'
                            ? 'bg-signal wave-bar'
                            : speakingState === 'listening'
                              ? 'bg-signal-dim h-1.5'
                              : 'bg-slate-light h-1'
                        }`}
                        style={speakingState === 'speaking' ? { height: '100%' } : undefined}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-text-secondary font-body ml-1">
                    {speakingState === 'speaking' ? 'AI speaking' : 'Listening'}
                  </span>
                </div>

                {/* Timer */}
                <p className="font-mono text-4xl tabular-nums text-text-primary tracking-wider">
                  {formatTime(timer)}
                </p>

                {/* Controls */}
                <div className="flex items-center gap-5">
                  <button
                    onClick={handleMuteToggle}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isMuted
                        ? 'bg-danger/20 text-danger'
                        : 'bg-slate-mid text-text-secondary hover:text-text-primary'
                    }`}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 19L5 5m14 0l-1.5 1.5M12 18.75a6 6 0 005.394-3.364M12 18.75a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25c0 .17-.014.337-.042.5" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-danger flex items-center justify-center text-white transition-all hover:bg-danger/90 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    aria-label="End call"
                  >
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m-10.5 6l.97-1.293a1.125 1.125 0 00-.417-1.173L3.852 8.852a1.125 1.125 0 00-1.091-.852H2.25A2.25 2.25 0 000 10.25v1.5a15.002 15.002 0 0012.75 12.75h1.5a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293" />
                    </svg>
                  </button>
                </div>

                <p className="text-[11px] text-text-muted">
                  Max {configRef.current ? Math.floor(configRef.current.maxDurationSeconds / 60) : 2} min demo
                </p>
              </div>
            </div>
          )}

          {/* Post-call */}
          {callState === 'post-call' && (
            <div className="inline-block rounded-2xl border border-slate-mid bg-slate-deep/80 backdrop-blur-sm p-8 max-w-sm mx-auto">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-signal/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-display font-600">That&apos;s Voxli</h3>
                <p className="text-sm text-text-secondary font-body">
                  Imagine that handling every call to your business, 24/7.
                </p>
                <div className="flex flex-col gap-2 w-full pt-2">
                  {!isRateLimited() && (
                    <button
                      onClick={handleReset}
                      className="w-full rounded-lg border border-slate-mid px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:border-slate-light hover:text-text-primary"
                    >
                      Try Again
                    </button>
                  )}
                  <a
                    href="#hero"
                    className="block w-full rounded-lg bg-signal px-4 py-3 text-center text-sm font-semibold text-void transition-all hover:bg-signal-bright"
                  >
                    Join the Waitlist
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Rate limited */}
          {callState === 'limit-reached' && (
            <div className="inline-block rounded-2xl border border-slate-mid bg-slate-deep/80 backdrop-blur-sm p-8 max-w-sm mx-auto text-center">
              <p className="text-sm text-text-secondary mb-4 font-body">
                Daily demo limit reached ({MAX_DAILY_CALLS} calls/day).
                <br />Join the waitlist for unlimited access.
              </p>
              <a
                href="#hero"
                className="inline-block rounded-lg bg-signal px-6 py-3 text-sm font-semibold text-void transition-all hover:bg-signal-bright"
              >
                Join the Waitlist
              </a>
            </div>
          )}

          {/* Error */}
          {callState === 'error' && (
            <div className="inline-block rounded-2xl border border-slate-mid bg-slate-deep/80 backdrop-blur-sm p-8 max-w-sm mx-auto text-center">
              <p className="text-sm text-danger mb-4">{errorMessage}</p>
              <button
                onClick={handleReset}
                className="rounded-lg border border-slate-mid px-6 py-3 text-sm font-medium text-text-secondary transition-colors hover:border-slate-light hover:text-text-primary"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
