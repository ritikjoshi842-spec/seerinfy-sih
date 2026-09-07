import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Games', to: '/#games' },
  { label: 'Progress', to: null },
  { label: 'Resources', to: null },
  { label: 'About Alzheimer', to: '/about' },
];

/** Returns true when viewport width >= breakpoint px */
function useIsWide(breakpoint = 1024) {
  const [wide, setWide] = useState(() => window.innerWidth >= breakpoint);
  useEffect(() => {
    const handler = () => setWide(window.innerWidth >= breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return wide;
}

function NavLinkItem({ label, to, onClick, mobile = false }) {
  const [hovered, setHovered] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = to ? location.pathname === to && !to.includes('#') : false;

  const sharedStyle = {
    display: 'block',
    padding: mobile ? '14px 20px' : '8px 14px',
    fontSize: mobile ? '16px' : '14px',
    fontWeight: 500,
    fontFamily: 'Inter, sans-serif',
    color: hovered ? '#ffffff' : isActive ? '#D6A84F' : 'rgba(255,255,255,0.8)',
    background: mobile && hovered ? 'rgba(255,255,255,0.06)' : !mobile && hovered ? 'rgba(255,255,255,0.12)' : 'transparent',
    textDecoration: 'none',
    borderBottom: mobile
      ? '1px solid rgba(255,255,255,0.06)'
      : isActive ? '2px solid #D6A84F' : '2px solid transparent',
    borderRadius: mobile ? 0 : '999px',
    transition: 'all 0.2s ease',
    cursor: to ? 'pointer' : 'default',
    userSelect: 'none',
  };

  if (!to) {
    return (
      <span
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={sharedStyle}
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      to={to}
      onClick={e => {
        if (to.startsWith('/#')) {
          e.preventDefault();
          const targetId = to.split('#')[1];
          if (location.pathname === '/') {
            const el = document.getElementById(targetId);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          } else {
            navigate('/' + to.slice(1));
            setTimeout(() => {
              const el = document.getElementById(targetId);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 120);
          }
        }
        onClick?.();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        padding: mobile ? '14px 20px' : '8px 14px',
        fontSize: mobile ? '16px' : '14px',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        color: hovered ? '#ffffff' : isActive ? '#D6A84F' : 'rgba(255,255,255,0.8)',
        background: mobile && hovered ? 'rgba(255,255,255,0.06)' : !mobile && hovered ? 'rgba(255,255,255,0.12)' : 'transparent',
        textDecoration: 'none',
        borderBottom: mobile
          ? '1px solid rgba(255,255,255,0.06)'
          : isActive ? '2px solid #D6A84F' : '2px solid transparent',
        borderRadius: mobile ? 0 : '999px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
    >
      {label}
    </Link>
  );
}

function GetStartedBtn({ onClick, fullWidth = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: fullWidth ? '100%' : 'auto',
        padding: '10px 24px',
        fontSize: '14px',
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        color: '#ffffff',
        backgroundColor: hovered ? '#b05840' : '#C7654A',
        border: 'none',
        borderRadius: '999px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 14px rgba(199,101,74,0.35)',
      }}
    >
      Get Started
    </button>
  );
}

function AaToggle() {
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const labels = ['Aa', 'Aa+', 'Aa++'];
  const scales = [1, 1.15, 1.3];

  const cycle = () => {
    const next = (idx + 1) % scales.length;
    setIdx(next);
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
        width: 38, height: 38,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.35)',
        color: 'white',
        background: hovered ? 'rgba(255,255,255,0.18)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize: '12px',
        transition: 'all 0.2s ease',
        outline: 'none',
        flexShrink: 0,
      }}
    >
      {labels[idx]}
    </button>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isDesktop = useIsWide(1024);
  const navigate = useNavigate();

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        backgroundColor: 'rgba(40, 89, 67, 0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: scrolled ? '0 4px 24px rgba(32,38,34,0.22)' : 'none',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* ── Main bar ── */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
          gap: 16,
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Leaf size={18} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '18px', fontFamily: 'Poppins, sans-serif', lineHeight: 1.2 }}>
              Sereenify
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', letterSpacing: '0.06em' }}>
              Cognitive Image Therapy
            </div>
          </div>
        </Link>

        {/* Desktop: centred nav links */}
        {isDesktop && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
            {NAV_LINKS.map(link => (
              <NavLinkItem key={link.label} label={link.label} to={link.to} />
            ))}
          </nav>
        )}

        {/* Desktop: right actions */}
        {isDesktop && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <AaToggle />
            <GetStartedBtn onClick={() => navigate('/onboarding')} />
          </div>
        )}

        {/* Mobile: Aa + hamburger */}
        {!isDesktop && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AaToggle />
            <button
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                transition: 'background 0.2s',
              }}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        )}
      </div>

      {/* ── Mobile drawer ── */}
      {!isDesktop && mobileOpen && (
        <div
          style={{
            background: '#1B3D2E',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {NAV_LINKS.map(link => (
            <NavLinkItem
              key={link.label}
              label={link.label}
              to={link.to}
              mobile
              onClick={() => setMobileOpen(false)}
            />
          ))}
          <div style={{ padding: '16px 20px 24px' }}>
            <GetStartedBtn
              fullWidth
              onClick={() => { navigate('/onboarding'); setMobileOpen(false); }}
            />
          </div>
        </div>
      )}
    </header>
  );
}
