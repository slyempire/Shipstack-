
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { Layers, ArrowRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MarketingNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isHeroPage = location.pathname === '/';
  const [scrolled, setScrolled] = useState(!isHeroPage);

  // Scroll-aware transparency: transparent at top of landing page, frosted everywhere else
  useEffect(() => {
    if (!isHeroPage) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname, isHeroPage]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Product',   path: '/product' },
    { name: 'Solutions', path: '/solutions' },
    { name: 'About',     path: '/about' },
    { name: 'Pricing',   path: '/pricing' },
  ];

  const handleDashboardRedirect = () => {
    const role = user?.role?.toUpperCase();
    if      (role === 'DRIVER')                               navigate('/driver');
    else if (role === 'FACILITY' || role === 'FACILITY_OPERATOR') navigate('/facility');
    else if (role === 'WAREHOUSE')                            navigate('/admin/warehouse');
    else                                                       navigate('/admin');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-[100] transition-all duration-500 ${
          scrolled
            ? 'bg-[#0B0E16]/95 backdrop-blur-xl border-b border-white/8 shadow-xl shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="container-responsive flex items-center justify-between py-5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" aria-label="Shipstack home">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FF5722 0%, #FF7A50 100%)', boxShadow: '0 4px 16px rgba(255,87,34,0.4)' }}
            >
              <Layers size={19} strokeWidth={2.5} />
            </div>
            <span
              className="text-[22px] font-black tracking-[-0.03em] uppercase text-white transition-opacity duration-200 group-hover:opacity-80"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Shipstack
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative text-[12px] font-semibold uppercase tracking-[0.2em] transition-all duration-200 group pb-1 ${
                  isActive(link.path) ? 'text-white' : 'text-white/55 hover:text-white'
                }`}
              >
                {link.name}
                {/* Animated underline */}
                <span
                  className={`absolute bottom-0 left-0 h-[2px] rounded-full bg-[#FF5722] transition-all duration-300 ${
                    isActive(link.path) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}
          </div>

          {/* Right CTAs */}
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors duration-200"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary-brand text-[11px] tracking-[0.18em] !h-10 !px-6 !rounded-lg"
                  style={{ boxShadow: '0 4px 16px rgba(255,87,34,0.4)' }}
                >
                  Get Started
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <button
                onClick={handleDashboardRedirect}
                className="btn-primary-brand text-[11px] tracking-[0.18em] !h-10 !px-6 !rounded-lg"
              >
                Console
                <ArrowRight size={14} />
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isMobileMenuOpen ? (
                  <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X size={22} />
                  </motion.span>
                ) : (
                  <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu size={22} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden overflow-hidden border-t border-white/8"
              style={{ background: 'rgba(11,14,22,0.98)', backdropFilter: 'blur(24px)' }}
            >
              <div className="container-responsive py-8 flex flex-col gap-2">
                <div className="stagger-entrance flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`px-4 py-4 rounded-xl text-[13px] font-semibold uppercase tracking-[0.18em] transition-all duration-200 ${
                        isActive(link.path)
                          ? 'bg-white/8 text-white'
                          : 'text-white/55 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
                {!isAuthenticated && (
                  <div className="mt-6 pt-6 border-t border-white/8 flex flex-col gap-3">
                    <Link
                      to="/login"
                      className="w-full text-center py-4 rounded-xl text-[12px] font-semibold uppercase tracking-[0.18em] text-white/60 hover:text-white transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      className="btn-primary-brand justify-center !rounded-xl"
                    >
                      Get Started <ArrowRight size={15} />
                    </Link>
                  </div>
                )}
                {isAuthenticated && (
                  <div className="mt-6 pt-6 border-t border-white/8">
                    <button
                      onClick={handleDashboardRedirect}
                      className="w-full btn-primary-brand justify-center !rounded-xl"
                    >
                      Go to Console <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Spacer for fixed nav on non-hero pages (hero pages handle their own padding) */}
      <div className="h-[76px] pointer-events-none" aria-hidden="true" />
    </>
  );
};

export default MarketingNavbar;
