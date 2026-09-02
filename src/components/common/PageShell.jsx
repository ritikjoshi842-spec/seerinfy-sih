import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function PageShell({ children, noFooter = false }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF7EF' }}>
      <Navbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
      {!noFooter && <Footer />}
    </div>
  );
}
