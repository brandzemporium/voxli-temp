'use client';

export function Footer() {
  return (
    <footer className="relative border-t border-slate-mid/50 py-12">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <img src="/images/voxli-logo-white.svg" alt="Voxli" className="h-5 w-auto" />

        <p className="text-xs text-text-muted font-body">
          &copy; {new Date().getFullYear()} Voxli. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
