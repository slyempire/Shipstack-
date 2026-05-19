
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { Layers, LayoutDashboard, Menu, X, Truck, MapPin, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MarketingNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { name: 'Product', path: '/product' },
    { name: 'Solutions', path: '/solutions' },
    { name: 'About', path: '/about' },
    { name: 'Pricing', path: '/pricing' },
  ];

  const handleDashboardRedirect = () => {
    const role = user?.role?.toUpperCase();
    if (role === 'DRIVER') navigate('/driver');
    else if (role === 'FACILITY' || role === 'FACILITY_OPERATOR') navigate('/facility');
    else if (role === 'WAREHOUSE') navigate('/admin/warehouse');
    else navigate('/admin');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="container-responsive flex items-center justify-between py-6 w-full">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <Layers size={22} strokeWidth={3} />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase font-display text-slate-900">Shipstack</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`text-xs font-black uppercase tracking-widest transition-all hover:text-slate-900 ${
                isActive(link.path) ? 'text-slate-900 underline underline-offset-8 decoration-2' : 'text-slate-400'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {!isAuthenticated && (
            <div className="hidden sm:flex items-center gap-6">
              <Link to="/login" className="text-xs font-black uppercase tracking-widest text-slate-900 hover:opacity-70 transition-all">Log In</Link>
              <Link to="/register" className="bg-slate-900 text-white px-8 py-4 rounded-none text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95">Get Started</Link>
            </div>
          )}
          {isAuthenticated && (
            <button 
              onClick={handleDashboardRedirect}
              className="bg-slate-900 text-white px-6 py-3 rounded-none text-xs font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 transition-all active:scale-95"
            >
              Console <ArrowRight size={14} strokeWidth={3} />
            </button>
          )}
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} strokeWidth={3} /> : <Menu size={24} strokeWidth={3} />}
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
            className="md:hidden bg-navy border-b border-white/5 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm font-black uppercase tracking-widest transition-all ${
                    isActive(link.path) ? 'text-brand' : 'text-slate-300'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
                  <Link 
                    to="/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-black uppercase tracking-widest text-brand"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="bg-brand text-white px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest text-center shadow-xl"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default MarketingNavbar;
