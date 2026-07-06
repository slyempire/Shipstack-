
import React from 'react';
import MarketingNavbar from './MarketingNavbar';
import MarketingFooter from './MarketingFooter';
import ScrollToTop from '../ScrollToTop';
import CookieConsent from './CookieConsent';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-slate-900 selection:text-white">
      <MarketingNavbar />
      <main className="flex-grow">
        {children}
      </main>
      <MarketingFooter />
      <ScrollToTop />
      <CookieConsent />
    </div>
  );
};

export default MarketingLayout;
