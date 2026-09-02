import React from 'react';

const scales = [1, 1.15, 1.3];
const labels = ['Aa', 'Aa+', 'Aa++'];

export function FontScaleToggle() {
  const [scaleIndex, setScaleIndex] = React.useState(0);
  const [hovered, setHovered] = React.useState(false);

  const cycle = () => {
    const next = (scaleIndex + 1) % scales.length;
    setScaleIndex(next);
    document.documentElement.style.setProperty('--font-scale', scales[next]);
  };

  return (
    <button
      onClick={cycle}
      title="Adjust font size"
      aria-label="Toggle font size"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.4)',
        color: 'white',
        background: hovered ? 'rgba(255,255,255,0.2)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize: '13px',
        transition: 'all 0.2s ease',
        outline: 'none',
        flexShrink: 0,
      }}
    >
      {labels[scaleIndex]}
    </button>
  );
}
