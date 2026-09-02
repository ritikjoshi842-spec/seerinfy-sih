import React from 'react';

export function ProgressRing({ percent = 0, size = 120, strokeWidth = 10, color = '#4C8B5D', label, sublabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E4E0D3"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-[#202622]" style={{ fontFamily: 'Poppins', fontSize: size * 0.22 }}>
          {percent}%
        </span>
        {label && <span className="text-[#5B6660] font-medium" style={{ fontSize: size * 0.1 }}>{label}</span>}
      </div>
      {sublabel && (
        <p className="text-[#5B6660] text-xs mt-1 text-center">{sublabel}</p>
      )}
    </div>
  );
}
