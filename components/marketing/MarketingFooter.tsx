
import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';

const MarketingFooter: React.FC = () => {
  return (
    <footer className="bg-navy border-t border-line py-24 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 border-b border-line pb-20">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-brand-accent rounded-xl flex items-center justify-center">
              <Layers size={22} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase font-display">Shipstack</span>
          </div>
          <p className="text-sm text-slate-300 font-medium leading-relaxed">The premier operating stack for high-performance logistics across the East African corridor. Built in Nairobi, for the world.</p>
        </div>
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-widest mb-8 text-brand-accent">Platform</h4>
          <ul className="space-y-5 text-xs font-bold text-slate-300">
            <li><Link to="/product" className="hover:text-brand transition-colors text-xs font-black uppercase tracking-widest">Product</Link></li>
            <li><Link to="/solutions" className="hover:text-brand transition-colors text-xs font-black uppercase tracking-widest">Solutions</Link></li>
            <li><Link to="/pricing" className="hover:text-brand transition-colors text-xs font-black uppercase tracking-widest">Pricing</Link></li>
            <li><Link to="/style-guide" className="hover:text-brand transition-colors text-xs font-black uppercase tracking-widest text-brand-accent">Style Guide</Link></li>
            <li><Link to="/about" className="hover:text-brand transition-colors text-xs font-black uppercase tracking-widest">About</Link></li>
            <li><Link to="/contact" className="hover:text-brand transition-colors text-xs font-black uppercase tracking-widest">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-widest mb-8 text-brand-accent">Legal</h4>
          <ul className="space-y-5 text-xs font-bold text-slate-300">
            <li><Link to="/legal" className="hover:text-brand transition-colors">Charter of Ops</Link></li>
            <li><Link to="/legal" className="hover:text-brand transition-colors">Data Privacy Shield</Link></li>
            <li><Link to="/legal" className="hover:text-brand transition-colors">Compliance Audit</Link></li>
          </ul>
        </div>
        <div className="bg-card p-10 rounded-[2.5rem] border border-line">
           <h4 className="text-lg font-black mb-3 uppercase font-display">Contact Sales</h4>
           <p className="text-xs text-slate-300 mb-8 font-medium leading-relaxed">Inquire for enterprise fleet deployments in Kenya, Uganda & Rwanda.</p>
           <a href="mailto:ops@shipstack.africa" className="text-xs font-black uppercase tracking-widest text-brand-accent flex items-center gap-2 hover:translate-x-1 transition-all">
              ops@shipstack.africa <ArrowRight size={16} />
           </a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-12 flex flex-col sm:flex-row justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest gap-6">
         <span>&copy; 2025 Shipstack Technologies. All rights reserved.</span>
         <div className="flex gap-8">
            <span>Stack Status: Nominal</span>
            <span>Region: KE-NBO-1</span>
         </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
