
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { Layers, LayoutDashboard, Menu, X } from 'lucide-react';
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
    if (user?.role === 'DRIVER') navigate('/driver');
    else if (user?.role === 'FACILITY') navigate('/facility');
    else if (user?.role === 'WAREHOUSE') navigate('/admin/warehouse');
    else navigate('/admin');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-[100] bg-navy/80 backdrop-blur-xl border-b border-white/5">
      <div className="container-responsive flex items-center justify-between py-4 w-full">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <Layers size={22} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase font-display">Shipstack</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`text-[10px] font-black uppercase tracking-widest transition-all hover:text-brand ${
                isActive(link.path) ? 'text-brand' : 'text-slate-300'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button 
              onClick={handleDashboardRedirect}
              className="bg-brand text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:opacity-90 transition-all active:scale-95"
            >
              <LayoutDashboard size={14} /> Dashboard
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-brand px-3 py-2 hover:bg-white/5 rounded-lg transition-all">Sign In</Link>
              <Link to="/register" className="bg-navy border border-white/10 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Get Started</Link>
            </div>
          )}
          
          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-slate-300 hover:bg-brand/5 rounded-lg transition-all"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
            className="lg:hidden bg-navy border-b border-white/5 overflow-hidden"
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
