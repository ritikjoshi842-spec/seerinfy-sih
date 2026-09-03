import React from 'react';

export function Card({ children, className = '', hover = false, padding = true, ...rest }) {
  return (
    <div
      className={`
        bg-white rounded-[24px] border border-[#EAE8E3]
        shadow-[0_8px_24px_rgba(26,28,27,0.04)]
        ${padding ? 'p-10 md:p-12' : ''}
        ${hover ? 'hover:shadow-[0_16px_40px_rgba(26,28,27,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}
