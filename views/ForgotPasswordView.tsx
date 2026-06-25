
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { api } from '../api';
import { Layers, Mail, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPasswordView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { isOnline, addNotification } = useAppStore();
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      addNotification("Please enter a valid email address.", "error");
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword(email);
      setIsSent(true);
      addNotification("We've sent reset instructions to your email.", "success");
    } catch (err: any) {
      addNotification(err.message || "Couldn't send the reset email. Please try again.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-page)] overflow-hidden items-center justify-center p-8">
      <Link to="/login" className="absolute top-8 left-8 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 hover:text-[#FF5722] transition-colors">
        <ArrowLeft size={14} /> Back to Login
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full card-minimal !p-8 md:!p-10"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div 
            className="h-14 w-14 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg" 
            style={{ background: 'linear-gradient(135deg, #FF5722 0%, #FF7A50 100%)', boxShadow: '0 4px 16px rgba(255,87,34,0.35)' }}
          >
            <Layers size={28} />
          </div>
          <h2 className="text-3xl font-black tracking-[-0.03em] text-slate-900 uppercase font-display leading-none mb-1.5">Shipstack</h2>
          <p className="text-[10px] font-black text-[#FF5722] uppercase tracking-[0.25em] leading-none">Digital Logistics Platform</p>
        </div>

        {isSent ? (
          <div className="text-center space-y-6">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Check your email</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              We sent reset instructions to <span className="font-bold text-slate-900">{email}</span>. The link expires in an hour.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full btn-primary !h-14 !rounded-xl text-[12px] tracking-[0.18em]"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleReset}>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2.5">Forgot your password?</h3>
              <p className="text-slate-400 font-medium text-[11px] uppercase tracking-wider leading-relaxed">Enter your email and we'll send you a reset link.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em] ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={17} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-14"
                  placeholder="name@shipstack.com"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || !isOnline}
              className="w-full btn-primary-brand !h-14 !rounded-xl text-[12px] tracking-[0.18em] justify-center"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Send reset link'}
            </motion.button>

            <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em] pt-4 leading-none">
              Need help? <Link to="/contact" className="text-[#FF5722] hover:text-[#E64A19] transition-colors">Contact us</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordView;
