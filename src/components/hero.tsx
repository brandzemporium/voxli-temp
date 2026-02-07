'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error' | 'duplicate';

export function Hero() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<SubmitState>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setState('submitting');

    try {
      const { error } = await supabase.from('waitlist').insert({ email: trimmed });

      if (error) {
        if (error.code === '23505') {
          setState('duplicate');
        } else {
          console.error('Waitlist error:', error);
          setState('error');
        }
        return;
      }

      setState('success');
      setEmail('');
    } catch {
      setState('error');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-signal/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-signal/[0.08] blur-[80px] pointer-events-none glow-pulse" />

      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="reveal inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal/[0.06] px-4 py-1.5 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-signal opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
          </span>
          <span className="text-xs font-medium tracking-wider uppercase text-signal font-body">
            Launching Soon
          </span>
        </div>

        {/* Headline */}
        <h1 className="reveal font-display font-800 text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight mb-6">
          Your AI Receptionist
          <br />
          <span className="text-signal">That Never Sleeps</span>
        </h1>

        {/* Subheadline */}
        <p className="reveal text-lg sm:text-xl text-text-secondary font-body font-300 max-w-xl mx-auto mb-10 leading-relaxed">
          Voxli answers every call, books appointments, recognizes returning
          callers, and handles it all&mdash;so you never miss an opportunity.
        </p>

        {/* Email capture */}
        <div className="reveal max-w-md mx-auto">
          {state === 'success' ? (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-signal/30 bg-signal/[0.08] px-6 py-4">
              <svg className="w-5 h-5 text-signal flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-signal">
                You&apos;re on the list. We&apos;ll notify you at launch.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex gap-2 sm:gap-0 sm:flex-row flex-col sm:rounded-xl sm:border sm:border-slate-mid sm:bg-slate-deep/60 sm:backdrop-blur-sm sm:p-1.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (state === 'error' || state === 'duplicate') setState('idle');
                  }}
                  placeholder="you@company.com"
                  required
                  className="flex-1 rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-transparent px-4 py-3 text-sm text-text-primary placeholder:text-text-muted font-body focus:outline-none border border-slate-mid sm:border-0"
                  disabled={state === 'submitting'}
                />
                <button
                  type="submit"
                  disabled={state === 'submitting'}
                  className="rounded-lg bg-signal px-6 py-3 text-sm font-semibold text-void font-body transition-all duration-200 hover:bg-signal-bright hover:shadow-[0_0_24px_rgba(65,196,203,0.4)] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {state === 'submitting' ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Joining...
                    </span>
                  ) : (
                    'Notify Me'
                  )}
                </button>
              </div>

              {state === 'duplicate' && (
                <p className="mt-3 text-xs text-signal">
                  You&apos;re already on the waitlist!
                </p>
              )}
              {state === 'error' && (
                <p className="mt-3 text-xs text-danger">
                  Something went wrong. Please try again.
                </p>
              )}
            </form>
          )}

          <p className="mt-4 text-xs text-text-muted">
            No spam. Just a one-time launch notification.
          </p>
        </div>

      </div>
    </section>
  );
}
