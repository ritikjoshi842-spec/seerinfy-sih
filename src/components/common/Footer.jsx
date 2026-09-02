import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone } from 'lucide-react';
import { Button } from './Button';

export function Footer() {
  return (
    <footer style={{ backgroundColor: '#285943' }} className="text-white pt-16 pb-8">
      <div className="content-wrap">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-white/10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Leaf size={18} color="white" />
              </div>
              <span className="font-bold text-xl" style={{ fontFamily: 'Poppins' }}>Sereenify</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              Empowering minds with compassion and technology. Gentle cognitive care for everyone.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <Mail size={14} />
              </div>
              <span className="text-white/70 text-sm">hello@sereenify.app</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm text-white/90 mb-4 uppercase tracking-wider" style={{ fontFamily: 'Poppins' }}>
              Quick Links
            </h4>
            <ul className="flex flex-col gap-2 list-none">
              {['About Dyslexia', 'How it Works', 'Games', 'FAQ', 'Contact Us'].map(item => (
                <li key={item}>
                  <Link
                    to="#"
                    className="text-white/60 hover:text-white text-sm no-underline transition-colors duration-200"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-sm text-white/90 mb-4 uppercase tracking-wider" style={{ fontFamily: 'Poppins' }}>
              Need Support?
            </h4>
            <p className="text-white/60 text-sm mb-4">We're here to help you</p>
            <Button
              variant="accent"
              size="sm"
              className="gap-3"
            >
              <Phone size={14} />
              Contact Us
            </Button>

            <div className="mt-6">
              <h4 className="font-semibold text-sm text-white/90 mb-3 uppercase tracking-wider" style={{ fontFamily: 'Poppins' }}>Resources</h4>
              <ul className="flex flex-col gap-2 list-none">
                {['Blog', 'Research', 'Caregivers Guide'].map(item => (
                  <li key={item}>
                    <Link to="#" className="text-white/60 hover:text-white text-sm no-underline transition-colors duration-200">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-xs">
            © 2026 Sereenify. All rights reserved. Built with compassion.
          </p>
          <div className="flex gap-4">
            {['Privacy Policy', 'Terms of Service'].map(item => (
              <Link key={item} to="#" className="text-white/40 hover:text-white/70 text-xs no-underline transition-colors duration-200">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
