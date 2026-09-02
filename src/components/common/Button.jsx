import React from 'react';

/**
 * Button component
 * variants: 'primary' | 'accent' | 'outline' | 'ghost'
 * sizes: 'sm' | 'md' | 'lg'
 */

const VARIANT_STYLES = {
  primary: {
    backgroundColor: '#285943',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 4px 14px rgba(40,89,67,0.35)',
  },
  accent: {
    backgroundColor: '#C7654A',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 4px 14px rgba(199,101,74,0.35)',
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#285943',
    border: '2px solid #285943',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#285943',
    border: 'none',
  },
};

const SIZE_STYLES = {
  sm: { padding: '8px 20px', fontSize: '14px', lineHeight: '1.4' },
  md: { padding: '11px 26px', fontSize: '16px', lineHeight: '1.4' },
  lg: { padding: '13px 36px', fontSize: '17px', lineHeight: '1.4' },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  iconRight,
  disabled = false,
  type = 'button',
  onClick,
  style = {},
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);

  const hoverOverrides = {
    primary: { backgroundColor: '#1B3D2E' },
    accent: { backgroundColor: '#b05840' },
    outline: { backgroundColor: '#285943', color: '#ffffff' },
    ghost: { backgroundColor: '#DCE8D8' },
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    borderRadius: '999px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box',
    textAlign: 'center',
    transform: hovered && !disabled ? 'translateY(-1px)' : 'translateY(0)',
    ...VARIANT_STYLES[variant],
    ...SIZE_STYLES[size],
    ...(hovered && !disabled ? hoverOverrides[variant] : {}),
    ...style,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={baseStyle}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = hovered ? 'translateY(-1px)' : 'translateY(0)'; }}
      {...rest}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>}
      {children}
      {iconRight && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{iconRight}</span>}
    </button>
  );
}
