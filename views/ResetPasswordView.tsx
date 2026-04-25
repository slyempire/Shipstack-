
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAppStore } from '../store';
import { PasswordInput } from '../packages/ui/PasswordInput';
import { Layers, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../supabase';

const MIN_LENGTH = 8;

const ResetPasswordView: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const { addNotification } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase embeds the session in the URL hash when the reset link is clicked.
    // We need to let the Supabase client process the URL hash before we can update the password.
    if (!isSupabaseConfigured) return;

    const hash = window.location.hash;
    if (!hash.includes('access_token') && !hash.includes('type=recovery')) {
      setTokenError(true);
    }
  }, []);

  const validate = (): string | null => {
    if (password.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters.`;
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { addNotification(err, 'error'); return; }

    setIsLoading(true);
    try {
      await api.updatePassword(password);
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      addNotification(err.message || 'Failed to update password. The link may have expired.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-4 mb-12">
          <div className="h-14 w-14 rounded-[20px] bg-brand text-white flex items-center justify-center shadow-xl">
            <Layers size={28} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Shipstack</h2>
            <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Set New Password</p>
          </div>
        </div>

        {tokenError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center space-y-4">
            <AlertCircle className="mx-auto text-red-400" size={40} />
            <p className="text-sm font-black text-red-700 uppercase tracking-tight">Invalid or Expired Link</p>
            <p className="text-xs text-red-500 font-medium">This reset link has expired or is invalid. Please request a new one.</p>
            <Link
              to="/login"
              className="inline-block mt-2 text-[10px] font-black text-brand uppercase tracking-widest hover:underline"
            >
              Back to Login
            </Link>
          </div>
        ) : done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-8"
          >
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle size={40} className="text-green-500" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Password Updated</h3>
              <p className="text-xs text-slate-400 font-medium">Redirecting you to login…</p>
            </div>
          </motion.div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <p className="text-xs text-slate-400 font-medium mb-4">
              Choose a strong password — at least {MIN_LENGTH} characters.
            </p>

            <PasswordInput
              label="New Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <PasswordInput
              label="Confirm Password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />

            {confirm.length > 0 && password !== confirm && (
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Passwords do not match</p>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-brand text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-brand/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Update Password'}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPasswordView;
