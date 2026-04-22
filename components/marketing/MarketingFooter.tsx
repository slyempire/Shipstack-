import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Twitter, Linkedin, Facebook, ShieldCheck, Globe } from 'lucide-react';

const MarketingFooter: React.FC = () => {
  return (
    <footer className="bg-[#1A2B4D] border-t border-white/5 py-24 px-6 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute bottom-0 right-0 h-64 w-64 bg-[#FF8C42]/5 blur-3xl rounded-full translate-x-1/2 translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 pb-20 border-b border-white/5">
          {/* Column 1: About */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-[#FF8C42] rounded-xl flex items-center justify-center text-white shadow-lg">
                <Layers size={22} />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase text-white">Shipstack</span>
            </div>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              The premier operating stack for high-performance logistics across the African continent. Built in Africa, for the world.
            </p>
            <div className="flex gap-4">
              <a href="#" className="h-10 w-10 bg-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#FF8C42] hover:bg-white/10 transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="h-10 w-10 bg-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#FF8C42] hover:bg-white/10 transition-all">
                <Linkedin size={18} />
              </a>
              <a href="#" className="h-10 w-10 bg-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#FF8C42] hover:bg-white/10 transition-all">
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-[#FF8C42]">Product</h4>
            <ul className="space-y-4">
              <li><Link to="/product" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/solutions" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Solutions</Link></li>
              <li><Link to="/pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/updates" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Changelog</Link></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-[#FF8C42]">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/blog" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Journal</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-[#FF8C42]">Legal</h4>
            <ul className="space-y-4">
              <li><Link to="/legal/privacy" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/legal/terms" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/legal/compliance" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Compliance Shield</Link></li>
              <li><Link to="/legal/cookie" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span>&copy; 2025 Shipstack Technologies Ltd. Built in Africa.</span>
            <div className="flex items-center gap-4 border-l border-white/5 pl-8">
              <span className="flex items-center gap-2"><ShieldCheck size={12} className="text-emerald-500" /> SOC 2 Compliant</span>
              <span className="flex items-center gap-2"><Globe size={12} className="text-blue-500" /> GDPR Ready</span>
            </div>
          </div>
          <div className="flex gap-6">
             <div className="h-8 w-12 bg-white/5 rounded border border-white/5 flex items-center justify-center grayscale opacity-30">
                <span className="text-[8px] font-black text-white">VISA</span>
             </div>
             <div className="h-8 w-12 bg-white/5 rounded border border-white/5 flex items-center justify-center grayscale opacity-30">
                <span className="text-[8px] font-black text-white">MC</span>
             </div>
             <div className="h-8 w-12 bg-white/5 rounded border border-white/5 flex items-center justify-center grayscale opacity-30">
                <span className="text-[8px] font-black text-white">MPESA</span>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
