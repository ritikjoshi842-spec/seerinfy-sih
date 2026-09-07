import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function PageShell({ children, noFooter = false }) {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    // Show greeting initially for 3.5 seconds, then fade out to invisible so page content is completely unobstructed
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const showBubble = isVisible || isHovered;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF7EF' }}>
      <Navbar />
      <main className="flex-1 pt-[80px]">
        {children}
      </main>
      {!noFooter && <Footer />}

      {/* Floating Assistant with Speech Bubble */}
      <div 
        className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 flex flex-col items-end gap-3 pointer-events-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Speech Bubble: fades out completely so underlying elements are 100% visible & clickable */}
        <div 
          className="bg-white text-[#1A1C1B] text-[14px] md:text-[15px] font-medium border border-[#EAE8E3] shadow-[0_12px_40px_rgba(26,28,27,0.12)] relative"
          style={{ 
            fontFamily: 'Inter, sans-serif',
            borderRadius: '20px 20px 4px 20px',
            transformOrigin: 'bottom right',
            padding: '12px 18px',
            maxWidth: '220px',
            width: 'max-content',
            boxSizing: 'border-box',
            lineHeight: 1.45,
            wordBreak: 'normal',
            overflowWrap: 'break-word',
            flexShrink: 0,
            textAlign: 'center',
            opacity: showBubble ? 1 : 0,
            transform: showBubble ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.94)',
            pointerEvents: showBubble ? 'auto' : 'none',
            visibility: showBubble ? 'visible' : 'hidden',
            transition: 'opacity 0.4s ease, transform 0.4s ease, visibility 0.4s ease',
          }}
        >
          Hey there, I am here to help!
        </div>

        {/* Mascot Icon: hovering reveals the speech bubble */}
        <div 
          className="w-24 h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-white border-2 border-[#F2F0EB] shadow-[0_12px_40px_rgba(26,28,27,0.12)] cursor-pointer hover:scale-105 hover:shadow-[0_16px_56px_rgba(26,28,27,0.16)] transition-all duration-300 pointer-events-auto"
          title="Need help? Hover or click to chat"
          onClick={() => setIsHovered(prev => !prev)}
        >
          <img src="/assets/character-image.png" alt="Assistant" className="w-full h-full object-cover object-top" />
        </div>
      </div>
    </div>
  );
}
