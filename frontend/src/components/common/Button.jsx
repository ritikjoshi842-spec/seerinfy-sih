import React from 'react';

/**
 * Button component
 * variants: 'primary' | 'secondary' | 'outline' | 'ghost'
 * sizes: 'sm' | 'md' | 'lg'
 */

const VARIANT_STYLES = {
  primary: {
    backgroundColor: '#4A6B53', /* Sophisticated Sage Green */
    color: '#ffffff',
    border: '1px solid transparent',
    boxShadow: '0 4px 12px rgba(26,28,27,0.04)',
  },
  secondary: {
    backgroundColor: '#FFFFFF', /* Replaces the aggressive red/orange */
    color: '#1A1C1B',
    border: '1px solid #EAE8E3',
    boxShadow: '0 2px 4px rgba(26,28,27,0.02)',
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#4A6B53',
    border: '1.5px solid #EAE8E3',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#4A4D4B',
    border: '1px solid transparent',
  },
};

const SIZE_STYLES = {
  sm: { padding: '12px 28px', fontSize: '14px', lineHeight: '1.4' },
  md: { padding: '16px 36px', fontSize: '15px', lineHeight: '1.5' },
  lg: { padding: '20px 48px', fontSize: '16px', lineHeight: '1.5' },
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
  const [focused, setFocused] = React.useState(false);

  // Map 'accent' to 'secondary' for backward compatibility during the transition
  const activeVariant = variant === 'accent' ? 'secondary' : variant;

  const hoverOverrides = {
    primary: { backgroundColor: '#2C4233', boxShadow: '0 8px 24px rgba(26,28,27,0.06)' },
    secondary: { backgroundColor: '#FDFBF7', borderColor: '#4A6B53' },
    outline: { borderColor: '#4A6B53', color: '#2C4233' },
    ghost: { backgroundColor: '#F3F6F4', color: '#1A1C1B' },
  };

  const focusShadow = '0 0 0 3px rgba(74, 107, 83, 0.15)';

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500, /* Slightly softer than 600 */
    letterSpacing: '0.02em',
    borderRadius: '999px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    filter: disabled ? 'grayscale(0.5)' : 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    boxSizing: 'border-box',
    textAlign: 'center',
    transform: hovered && !disabled ? 'translateY(-1px)' : 'translateY(0)',
    ...VARIANT_STYLES[activeVariant],
    ...SIZE_STYLES[size],
    ...(hovered && !disabled ? hoverOverrides[activeVariant] : {}),
    ...(focused && !disabled ? { boxShadow: focusShadow } : {}),
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
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = hovered ? 'translateY(-1px)' : 'translateY(0)'; }}
      {...rest}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>}
      {children}
      {iconRight && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{iconRight}</span>}
    </button>
  );
}
