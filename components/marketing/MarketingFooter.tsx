import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Twitter, Linkedin, Facebook, ShieldCheck, Globe, ArrowUpRight, MapPin } from 'lucide-react';

const footerColumns = [
  {
    heading: 'Product',
    links: [
      { label: 'Features',   to: '/product'   },
      { label: 'Solutions',  to: '/solutions'  },
      { label: 'Pricing',    to: '/pricing'    },
      { label: 'Infrastructure', to: '/infrastructure' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About us', to: '/about'   },
      { label: 'Contact',  to: '/contact' },
      { label: 'Drivers',  to: '/driver-recruitment' },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { label: 'Sign in',       to: '/login'    },
      { label: 'Get started',   to: '/register' },
      { label: 'Track package', to: '/track'    },
    ],
  },
];

const socialLinks = [
  { icon: Twitter,  href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Facebook, href: '#', label: 'Facebook' },
];

const MarketingFooter: React.FC = () => {
  return (
    <footer className="relative overflow-hidden" style={{ background: '#050810' }}>
      {/* Ember glow in lower-right */}
      <div
        className="absolute bottom-0 right-0 h-72 w-72 pointer-events-none translate-x-1/3 translate-y-1/3"
        style={{ background: 'radial-gradient(ellipse, rgba(255,87,34,0.15) 0%, transparent 65%)', filter: 'blur(60px)' }}
        aria-hidden="true"
      />
      {/* Subtle ember line at top edge */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,87,34,0.4) 50%, transparent 100%)' }}
        aria-hidden="true"
      />

      <div className="container-responsive py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pb-16 border-b border-white/8">

          {/* Brand pitch */}
          <div className="lg:col-span-5 space-y-7 max-w-sm">
            <Link to="/" className="flex items-center gap-3 group w-fit" aria-label="Shipstack home">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #FF5722 0%, #FF7A50 100%)',
                  boxShadow: '0 4px 16px rgba(255,87,34,0.4)',
                }}
              >
                <Layers size={20} strokeWidth={2.5} />
              </div>
              <span
                className="text-[20px] font-black tracking-[-0.03em] uppercase text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Shipstack
              </span>
            </Link>

            <p
              className="text-[15px] text-white/45 leading-relaxed font-serif italic"
              style={{ textTransform: 'none', letterSpacing: 'normal', fontWeight: 400 }}
            >
              The operating layer for African logistics — dispatch, tracking and settlement in one place.
              Built in Nairobi, for the continent.
            </p>

            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-[#FF5722] shrink-0" />
              <span className="text-[12px] text-white/35 font-medium" style={{ textTransform: 'none' }}>
                Nairobi, Kenya
              </span>
            </div>

            {/* Social icons */}
            <div className="flex gap-2.5">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white/40 transition-all duration-200 hover:text-white hover:scale-110"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,87,34,0.15)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,87,34,0.3)';
                    (e.currentTarget as HTMLElement).style.color = '#FF7A50';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)';
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10">
            {footerColumns.map((col) => (
              <div key={col.heading}>
                <h4 className="label-brand mb-5" style={{ textTransform: 'uppercase' }}>
                  {col.heading}
                </h4>
                <ul className="space-y-3.5">
                  {col.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-white/45 hover:text-white transition-colors duration-200"
                        style={{ textTransform: 'none', letterSpacing: 'normal' }}
                      >
                        {link.label}
                        <ArrowUpRight
                          size={12}
                          className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                          style={{ color: '#FF5722' }}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-[12px] text-white/30" style={{ textTransform: 'none' }}>
            <span>
              © 2025 Shipstack ·{' '}
              <a
                href="https://murzaktech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/55 hover:text-white transition-colors duration-200 underline underline-offset-4 decoration-white/20"
              >
                Murzak Technologies
              </a>
            </span>
            <div className="flex items-center gap-5 sm:border-l border-white/10 sm:pl-6">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                Row-level security
              </span>
              <span className="flex items-center gap-1.5">
                <Globe size={13} className="text-sky-400" />
                GDPR &amp; DPA ready
              </span>
            </div>
          </div>

          {/* Payment method badges */}
          <div className="flex items-center gap-2.5">
            {['VISA', 'MC', 'M-PESA'].map((label) => (
              <div
                key={label}
                className="h-8 px-3.5 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-[10px] font-bold tracking-wide text-white/40" style={{ textTransform: 'none' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
