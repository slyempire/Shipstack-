import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import { getConsent, setConsent, initAnalytics } from '../../services/analytics';

/**
 * Cookie consent banner for the public marketing pages. Analytics loads
 * only after "Accept"; "Essential only" keeps the visit analytics-free.
 * The choice persists in localStorage — the banner shows once.
 */
const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    if (consent === null) {
      setVisible(true);
    } else if (consent === 'accepted') {
      initAnalytics();
    }
  }, []);

  if (!visible) return null;

  const choose = (choice: 'accepted' | 'declined') => {
    setConsent(choice);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 inset-x-4 md:bottom-8 md:right-8 md:left-auto md:max-w-md z-[100]">
      <div className="bg-[#0B0E16] border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 bg-white/5 rounded-xl flex items-center justify-center text-[#FF8C42]">
            <Cookie size={18} />
          </div>
          <h4 className="text-sm font-black uppercase tracking-widest text-white">Cookies</h4>
        </div>
        <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
          We use essential storage to run the site, and — only if you agree — analytics to
          understand which pages help. Details in the{' '}
          <Link to="/legal/cookie" className="text-white underline underline-offset-4 decoration-white/30 hover:decoration-white">
            Cookie Policy
          </Link>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => choose('accepted')}
            className="flex-1 px-5 py-3 bg-[#FF8C42] hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => choose('declined')}
            className="flex-1 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
