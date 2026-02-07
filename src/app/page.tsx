'use client';

import { useReveal } from '@/lib/use-reveal';
import { Hero } from '@/components/hero';
import { DemoCall } from '@/components/demo-call';
import { PhoneSection } from '@/components/phone-section';
import { Features } from '@/components/features';
import { Footer } from '@/components/footer';

export default function Home() {
  useReveal();

  return (
    <main className="relative">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-void/70 border-b border-slate-mid/30">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="#hero" className="flex items-center">
            <img src="/images/voxli-logo-white.svg" alt="Voxli" className="h-6 w-auto" />
          </a>
          <div className="flex items-center gap-6">
            <a
              href="#demo"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors font-body hidden sm:block"
            >
              Demo
            </a>
            <a
              href="#features"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors font-body hidden sm:block"
            >
              Features
            </a>
            <a
              href="#hero"
              className="rounded-lg bg-signal/10 border border-signal/20 px-4 py-1.5 text-sm font-medium text-signal transition-all hover:bg-signal/20 font-body"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* Sections */}
      <div id="hero">
        <Hero />
      </div>
      <DemoCall />
      <PhoneSection />
      <Features />
      <Footer />
    </main>
  );
}
