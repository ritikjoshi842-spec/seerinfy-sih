import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function PageShell({ children, noFooter = false }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF7EF' }}>
      <Navbar />
      <main className="flex-1 pt-[80px]">
        {children}
      </main>
      {!noFooter && <Footer />}

      {/* Floating Assistant with Speech Bubble */}
      <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 flex flex-col items-end gap-4 pointer-events-none">
        {/* Speech Bubble */}
        <div 
          className="bg-white text-[#1A1C1B] text-[15px] font-medium px-6 py-4 shadow-[0_12px_40px_rgba(26,28,27,0.12)] border border-[#EAE8E3] animate-fadeInUp delay-300 pointer-events-auto relative"
          style={{ 
            fontFamily: 'Inter',
            borderRadius: '24px 24px 4px 24px',
            transformOrigin: 'bottom right'
          }}
        >
          Hey there, I am here to help!
        </div>

        {/* Mascot Icon */}
        <div 
          className="w-28 h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden bg-white border-2 border-[#F2F0EB] shadow-[0_12px_40px_rgba(26,28,27,0.12)] cursor-pointer hover:scale-105 hover:shadow-[0_16px_56px_rgba(26,28,27,0.16)] transition-all duration-300 pointer-events-auto"
          title="Need help?"
        >
          <img src="/assets/character-image.png" alt="Assistant" className="w-full h-full object-cover object-top" />
        </div>
      </div>
    </div>
  );
}
