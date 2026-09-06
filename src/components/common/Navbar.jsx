import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Menu, X } from 'lucide-react';
const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Alzheimer\'s', to: '/about' },
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
        padding: '12px 16px',
        fontSize: '15px',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        color: isActive ? '#2D4739' : hovered ? '#2D4739' : '#535A52',
        background: 'transparent',
        textDecoration: 'none',
        borderBottom: isActive ? '2px solid #2D4739' : '2px solid transparent',
        borderRadius: isActive ? '8px 8px 0 0' : '8px',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        display: 'inline-block',
      }}
    >
      {label}
    </a>
  );
}

function LoginButton({ onClick, className = '' }) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
      style={{
        padding: '12px 28px',
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        color: hovered ? '#ffffff' : '#2D4739',
        backgroundColor: hovered ? '#2D4739' : 'transparent',
        border: '1.5px solid #2D4739',
        borderRadius: '999px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      Login / Sign Up
    </button>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: 'rgba(247, 243, 235, 0.85)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(229, 222, 209, 0.6)',
        transition: 'all 0.3s ease',
      }}
    >
      <nav
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 80,
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: 40,
            height: 40,
            background: 'transparent',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Leaf size={24} color="#2D4739" />
          </div>
          <div>
            <div style={{ color: '#2D4739', fontWeight: 700, fontSize: '20px', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Sereenify
            </div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <ul style={{ display: 'flex', alignItems: 'center', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}
          className="hidden lg:flex">
          {NAV_LINKS.map(link => (
            <li key={link.label}>
              <NavLinkItem label={link.label} to={link.to} />
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }} className="hidden lg:flex">
          <LoginButton onClick={() => navigate('/onboarding')} />
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          style={{
            background: 'none',
            border: 'none',
            color: '#2D4739',
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
        <div className="animate-slideDown" style={{
          background: 'rgba(247, 243, 235, 0.95)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(229, 222, 209, 0.6)',
          padding: '24px 48px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 16px 40px rgba(26,28,27,0.06)',
        }}>
          {NAV_LINKS.map(link => (
            <NavLinkItem
              key={link.label}
              label={link.label}
              to={link.to}
              onClick={() => setMobileOpen(false)}
            />
          ))}
          <div style={{ marginTop: 16 }}>
            <LoginButton 
              className="w-full" 
              onClick={() => { navigate('/onboarding'); setMobileOpen(false); }} 
            />
          </div>
        </div>
      )}
    </header>
  );
}
