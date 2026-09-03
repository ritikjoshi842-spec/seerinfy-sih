import React from 'react';

export function SectionHeading({ label, title, subtitle, align = 'center', className = '' }) {
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start';

  return (
    <div className={`flex flex-col gap-6 ${alignClass} ${className}`}>
      {label && (
        <div className="section-rule flex items-center gap-4">
          <span className="text-xs font-semibold tracking-widest text-[#738A7A] uppercase">{label}</span>
        </div>
      )}
      <h2
        className="font-heading font-semibold text-[#1A1C1B]"
        style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-[#4A4D4B] max-w-2xl mt-2" style={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
