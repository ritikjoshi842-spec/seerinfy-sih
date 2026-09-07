import React from 'react';

export function Card({ children, className = '', hover = false, padding = true, style = {}, ...rest }) {
  const paddingValue = padding === true ? '32px' : padding === false ? undefined : padding;
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        border: '1px solid #EAE8E3',
        boxShadow: '0 8px 24px rgba(26,28,27,0.04)',
        boxSizing: 'border-box',
        ...(paddingValue ? { padding: paddingValue } : {}),
        ...style,
      }}
      className={`bg-white rounded-[24px] border border-[#EAE8E3] ${hover ? 'hover:shadow-[0_16px_40px_rgba(26,28,27,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
