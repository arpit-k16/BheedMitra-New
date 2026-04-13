import React from 'react';
import { Link } from 'react-router-dom';

function LiveMapComingSoon() {
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-6">
      <section className="w-full max-w-2xl text-center bg-surface-container-low border border-outline-variant/20 rounded-2xl p-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <span className="material-symbols-outlined text-primary text-3xl">map</span>
        </div>
        <h1 className="text-4xl font-extrabold font-headline text-on-surface mb-4">Live Map</h1>
        <p className="text-on-surface-variant text-lg mb-8">Coming soon.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-bold hover:brightness-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Home
        </Link>
      </section>
    </main>
  );
}

export default LiveMapComingSoon;
