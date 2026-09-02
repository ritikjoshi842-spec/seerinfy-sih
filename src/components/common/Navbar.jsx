import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Menu, X } from 'lucide-react';
import { FontScaleToggle } from './FontScaleToggle';
import { Button } from './Button';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About Dyslexia', to: '/about' },
  { label: 'How it Works', to: '/#how-it-works' },
  { label: 'Games', to: '/games' },
  { label: 'Progress', to: '/progress' },
  { label: 'Resources', to: '/resources' },
];

function NavLinkItem({ label, to, onClick }) {
  const [hovered, setHovered] = useState(false);
  const location = useLocation();
  const isActive = location.pathname === to && !to.includes('#');

  return (
    <a
      href={to}
      onClick={e => {
        if (to.startsWith('/#')) {
          e.preventDefault();
          document.getElementById(to.split('#')[1])?.scrollIntoView({ behavior: 'smooth' });
        }
        onClick?.();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 14px',
        borderRadius: '999px',
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        color: isActive ? '#ffffff' : hovered ? '#ffffff' : 'rgba(255,255,255,0.78)',
        background: hovered ? 'rgba(255,255,255,0.12)' : 'transparent',
        textDecoration: 'none',
        borderBottom: isActive ? '2px solid #D6A84F' : '2px solid transparent',
        borderRadius: isActive ? '0' : '999px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        display: 'inline-block',
      }}
    >
      {label}
    </a>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: '#285943',
        boxShadow: scrolled ? '0 4px 24px rgba(32,38,34,0.22)' : 'none',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      <nav
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: 34,
            height: 34,
            background: 'rgba(255,255,255,0.18)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Leaf size={18} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '18px', fontFamily: 'Poppins, sans-serif', lineHeight: 1.2 }}>
              Sereenify
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '9px', letterSpacing: '0.06em', lineHeight: 1 }}>
              Cognitive Image Therapy
            </div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <ul style={{ display: 'flex', alignItems: 'center', gap: 2, listStyle: 'none', margin: 0, padding: 0 }}
          className="hidden lg:flex">
          {NAV_LINKS.map(link => (
            <li key={link.label}>
              <NavLinkItem label={link.label} to={link.to} />
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="hidden lg:flex">
          <FontScaleToggle />
          <Button
            variant="accent"
            size="sm"
            onClick={() => navigate('/onboarding')}
          >
            Get Started
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: 8,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          background: '#1B3D2E',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '16px 24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {NAV_LINKS.map(link => (
            <NavLinkItem
              key={link.label}
              label={link.label}
              to={link.to}
              onClick={() => setMobileOpen(false)}
            />
          ))}
          <div style={{ marginTop: 12 }}>
            <Button
              variant="accent"
              size="sm"
              onClick={() => { navigate('/onboarding'); setMobileOpen(false); }}
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
