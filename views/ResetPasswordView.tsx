
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { api } from '../api';
import { PasswordInput } from '../packages/ui/PasswordInput';
import { Layers, ShieldCheck, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPasswordView: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { isOnline, addNotification } = useAppStore();
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) return;

    if (password.length < 8) {
      addNotification("Password must be at least 8 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      addNotification("Passwords do not match.", "error");
      return;
    }

    setIsLoading(true);
    try {
      await api.updatePassword(password);
      setIsSuccess(true);
      addNotification("Password updated successfully.", "success");
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      addNotification(err.message || 'Failed to update password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white overflow-hidden items-center justify-center p-8 text-slate-900">
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

        {isSuccess ? (
          <div className="text-center space-y-6">
            <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Security Updated</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Your credentials have been successfully rotated. Redirecting to terminal in 3 seconds...
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-brand text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl transition-all"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleReset}>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">New Security Token</h3>
              <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Define your new master password.</p>
            </div>

            <PasswordInput 
              label="New Password"
              required
              showStrength
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <PasswordInput 
              label="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />

            <motion.button
              type="submit"
              disabled={isLoading || !isOnline}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-brand text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-brand/20 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <><Lock size={18} /> Update Password</>}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPasswordView;
