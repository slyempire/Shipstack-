
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { Layers, LayoutDashboard, Menu, X, Truck, MapPin } from 'lucide-react';
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
    <nav className="sticky top-0 z-[100] bg-navy/80 backdrop-blur-xl border-b border-white/5">
      <div className="container-responsive flex items-center justify-between py-4 w-full">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform relative">
                <Layers size={22} />
                <div className="absolute -right-2 -bottom-2 flex items-center gap-0.5 pointer-events-none">
                  <div className="p-1 bg-[#FF8C42] rounded-full shadow-lg border-2 border-navy text-white">
                    <Truck size={8} />
                  </div>
                  <div className="p-1 bg-[#FF8C42] rounded-full shadow-lg border-2 border-navy text-white -ml-2">
                    <MapPin size={8} />
                  </div>
                </div>
              </div>
            </div>
            <span className="text-xl font-black tracking-tighter uppercase font-display ml-2">Shipstack</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
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
          {!isAuthenticated && (
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-[#FF8C42] px-3 py-2 hover:bg-white/5 rounded-lg transition-all">Sign In</Link>
              <Link to="/register" className="bg-[#FF8C42] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:bg-[#E07A35] transition-all active:scale-95">Get Started</Link>
            </div>
          )}
          {isAuthenticated && (
            <button 
              onClick={handleDashboardRedirect}
              className="bg-[#FF8C42] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:bg-[#E07A35] flex items-center gap-2 transition-all active:scale-95"
            >
              <LayoutDashboard size={14} /> Dashboard
            </button>
          )}
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-300 hover:bg-brand/5 rounded-lg transition-all"
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
