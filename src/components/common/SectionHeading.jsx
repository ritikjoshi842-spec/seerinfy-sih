import React from 'react';

export function SectionHeading({ label, title, subtitle, align = 'center', className = '' }) {
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start';

  return (
    <div className={`flex flex-col gap-2 ${alignClass} ${className}`}>
      {label && (
        <div className="section-rule">
          <span className="text-xs font-semibold tracking-widest text-[#D6A84F] uppercase">{label}</span>
        </div>
      )}
      <h2
        className="font-heading font-bold text-[#202622]"
        style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px, 3vw, 32px)', lineHeight: 1.2 }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-[#5B6660] max-w-xl" style={{ fontSize: '1rem' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
