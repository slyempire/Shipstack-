
import React from 'react';
import MarketingNavbar from './MarketingNavbar';
import MarketingFooter from './MarketingFooter';
import ScrollToTop from '../ScrollToTop';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-navy font-sans text-ink overflow-x-hidden selection:bg-brand selection:text-white">
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
