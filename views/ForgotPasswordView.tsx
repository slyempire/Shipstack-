
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
      addNotification("Instructions sent to your email.", "success");
    } catch (err: any) {
      addNotification(err.message || 'Failed to request password reset.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white overflow-hidden items-center justify-center p-8">
      <Link to="/login" className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand transition-colors">
        <ArrowLeft size={14} /> Back to Login
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="flex items-center gap-4 mb-12 justify-center">
          <div className="h-16 w-16 rounded-[24px] bg-brand text-white flex items-center justify-center shadow-2xl">
              <Layers size={32} fill="currentColor" />
          </div>
          <div className="text-left">
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase font-display">Shipstack</h2>
            <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Africa's Digital Logistics Platform</p>
          </div>
        </div>

        {isSent ? (
          <div className="text-center space-y-6">
            <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Email Sent!</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              We've sent recovery instructions to <span className="font-bold text-slate-900">{email}</span>. Please check your inbox.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleReset}>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Recover Access</h3>
              <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Enter your email for recovery instructions.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Email</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-16 pr-6 py-5 text-slate-900 font-bold focus:border-brand-accent outline-none transition-all placeholder:text-slate-300"
                  placeholder="name@shipstack.com"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || !isOnline}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-brand text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-brand/20 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Send Reset Link'}
            </motion.button>

            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4">
              Need assistance? <Link to="/contact" className="text-brand hover:underline">Contact Mission Control</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordView;
