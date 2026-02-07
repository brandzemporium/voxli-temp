'use client';

export function PhoneSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Divider line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent via-slate-mid to-transparent" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        <p className="reveal text-sm uppercase tracking-[0.2em] text-text-muted font-body mb-6">
          Or call us directly
        </p>

        <a
          href="tel:+14374754575"
          className="reveal block"
        >
          <span className="phone-shimmer font-display font-800 text-4xl sm:text-5xl md:text-6xl tracking-tight inline-block transition-transform duration-300 hover:scale-105">
            +1 (437) 475-4575
          </span>
        </a>

        <p className="reveal mt-6 text-sm text-text-secondary font-body max-w-md mx-auto">
          Call from your phone and experience Voxli&apos;s AI receptionist firsthand.
          Available 24/7.
        </p>

        {/* Decorative phone icon */}
        <div className="reveal mt-8 inline-flex items-center gap-2 rounded-full border border-slate-mid bg-slate-deep/60 px-4 py-2">
          <svg className="w-4 h-4 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
          <span className="text-xs text-text-secondary font-body">Live demo line</span>
        </div>
      </div>
    </section>
  );
}
