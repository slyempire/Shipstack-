
import React from 'react';
import MarketingNavbar from './MarketingNavbar';
import MarketingFooter from './MarketingFooter';
import ScrollToTop from '../ScrollToTop';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  return (
    <div className="marketing-surface min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-[#FF5722] selection:text-white">
      <MarketingNavbar />
      <main className="flex-grow">
        {children}
      </main>
      <MarketingFooter />
      <ScrollToTop />
    </div>
  );
};

export default MarketingLayout;
