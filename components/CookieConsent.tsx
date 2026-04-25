import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'shipstack_cookie_consent_v1';

interface ConsentState {
  analytics: boolean;
  preferences: boolean;
  decidedAt: string;
}

function loadConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConsent(state: ConsentState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [preferences, setPreferences] = useState(true);

  useEffect(() => {
    const existing = loadConsent();
    if (!existing) {
      // Show banner after a short delay so the page settles
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = (all: boolean) => {
    const state: ConsentState = {
      analytics: all ? true : analytics,
      preferences: all ? true : preferences,
      decidedAt: new Date().toISOString(),
    };
    saveConsent(state);
    setVisible(false);
  };

  const saveCustom = () => accept(false);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[200]"
        >
          <div className="bg-[#121E36] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <Cookie size={18} className="text-brand" />
                <span className="text-sm font-black uppercase tracking-wide text-white">Cookie Settings</span>
              </div>
              <button
                onClick={() => accept(false)}
                className="text-slate-500 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-4">
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">
                We use cookies to keep you logged in and improve our service. No data is sold or shared with advertisers.{' '}
                <Link to="/legal/cookie" className="text-brand hover:underline">Cookie Policy →</Link>
              </p>

              {/* Expandable controls */}
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-3"
              >
                Customise {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="space-y-3 py-2">
                      {/* Required - always on */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">Essential Cookies</p>
                          <p className="text-[10px] text-slate-500 font-medium">Login, session, security</p>
                        </div>
                        <div className="h-5 w-9 bg-brand rounded-full flex items-center justify-end px-0.5 cursor-not-allowed opacity-70">
                          <div className="h-4 w-4 bg-white rounded-full" />
                        </div>
                      </div>

                      {/* Analytics */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">Analytics</p>
                          <p className="text-[10px] text-slate-500 font-medium">Usage patterns (Google Analytics)</p>
                        </div>
                        <button
                          onClick={() => setAnalytics(!analytics)}
                          className={`h-5 w-9 rounded-full flex items-center px-0.5 transition-all ${analytics ? 'bg-brand justify-end' : 'bg-white/10 justify-start'}`}
                        >
                          <div className="h-4 w-4 bg-white rounded-full shadow" />
                        </button>
                      </div>

                      {/* Preferences */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">Preferences</p>
                          <p className="text-[10px] text-slate-500 font-medium">Theme, language, remember-me</p>
                        </div>
                        <button
                          onClick={() => setPreferences(!preferences)}
                          className={`h-5 w-9 rounded-full flex items-center px-0.5 transition-all ${preferences ? 'bg-brand justify-end' : 'bg-white/10 justify-start'}`}
                        >
                          <div className="h-4 w-4 bg-white rounded-full shadow" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-2">
                {expanded ? (
                  <button
                    onClick={saveCustom}
                    className="flex-1 py-2.5 bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/15 transition-all"
                  >
                    Save choices
                  </button>
                ) : (
                  <button
                    onClick={() => accept(false)}
                    className="flex-1 py-2.5 bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/15 transition-all"
                  >
                    Essentials only
                  </button>
                )}
                <button
                  onClick={() => accept(true)}
                  className="flex-1 py-2.5 bg-brand hover:bg-[#E07A35] rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all"
                >
                  Accept all
                </button>
              </div>

              {/* Trust signal */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                <p className="text-[9px] text-slate-500 font-medium">We never sell your data. GDPR & Kenya DPA compliant.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;

// Utility: check if a specific consent type was granted
export function hasConsent(type: keyof Omit<ConsentState, 'decidedAt'>): boolean {
  const state = loadConsent();
  if (!state) return false;
  return state[type] === true;
}
