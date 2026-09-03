import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone } from 'lucide-react';
import { Button } from './Button';

export function Footer() {
  return (
    <footer style={{ backgroundColor: '#1A1C1B' }} className="text-white">
      <div className="content-wrap" style={{ paddingTop: '96px', paddingBottom: '48px' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 pb-20 border-b border-white/10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#2C4233] rounded-[12px] flex items-center justify-center">
                <Leaf size={20} color="#E6EBE7" />
              </div>
              <span className="font-semibold text-2xl tracking-tight" style={{ fontFamily: 'Poppins' }}>Sereenify</span>
            </div>
            <p className="text-white/60 text-base leading-relaxed max-w-sm" style={{ lineHeight: 1.8 }}>
              Empowering minds with compassion and technology. Gentle cognitive care for everyone.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                <Mail size={16} className="text-white/70" />
              </div>
              <span className="text-white/80 text-sm font-medium">hello@sereenify.app</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm text-white/90 mb-8 uppercase tracking-widest text-[#738A7A]" style={{ fontFamily: 'Inter' }}>
              Quick Links
            </h4>
            <ul className="flex flex-col gap-5 list-none">
              {['About Alzheimer\'s', 'How it Works', 'Games', 'FAQ', 'Contact Us'].map(item => (
                <li key={item}>
                  <Link
                    to="#"
                    className="text-white/50 hover:text-white text-sm no-underline transition-colors duration-300"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-sm text-white/90 mb-8 uppercase tracking-widest text-[#738A7A]" style={{ fontFamily: 'Inter' }}>
              Need Support?
            </h4>
            <p className="text-white/50 text-sm mb-6" style={{ lineHeight: 1.6 }}>We're here to help you</p>
            <Button
              variant="outline"
              size="md"
              className="gap-3 w-full border-white/20 text-white hover:bg-white/5"
            >
              <Phone size={16} />
              Contact Us
            </Button>

            <div className="mt-12">
              <h4 className="font-semibold text-sm text-white/90 mb-6 uppercase tracking-widest text-[#738A7A]" style={{ fontFamily: 'Inter' }}>Resources</h4>
              <ul className="flex flex-col gap-4 list-none">
                {['Blog', 'Research', 'Caregivers Guide'].map(item => (
                  <li key={item}>
                    <Link to="#" className="text-white/50 hover:text-white text-sm no-underline transition-colors duration-300">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-10 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-white/30 text-sm">
            © 2026 Sereenify. All rights reserved. Built with compassion.
          </p>
          <div className="flex gap-8">
            {['Privacy Policy', 'Terms of Service'].map(item => (
              <Link key={item} to="#" className="text-white/30 hover:text-white/60 text-sm no-underline transition-colors duration-300">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
