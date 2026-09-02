import React from 'react';

export function Card({ children, className = '', hover = false, padding = true, ...rest }) {
  return (
    <div
      className={`
        bg-white rounded-[20px] border border-[#E4E0D3]
        shadow-[0_4px_20px_rgba(32,38,34,0.08)]
        ${padding ? 'p-6' : ''}
        ${hover ? 'hover:shadow-[0_8px_32px_rgba(32,38,34,0.14)] hover:-translate-y-1 transition-all duration-300 cursor-pointer' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}
