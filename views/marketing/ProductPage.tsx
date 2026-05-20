
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  Map as MapIcon, 
  DollarSign, 
  LayoutDashboard, 
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Smartphone,
  WifiOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import MarketingLayout from '../../components/marketing/MarketingLayout';

const ProductPage: React.FC = () => {
  return (
    <MarketingLayout>
      {/* Hero */}
      <header className="px-6 pt-32 pb-48 max-w-7xl mx-auto text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?auto=format&fit=crop&q=80&w=2600" 
            alt="Product Architecture" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-white/80" />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 px-4 py-2 rounded-full mb-8 shadow-sm"
        >
          <Package size={14} className="text-brand" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">The Shipstack Protocol</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-8 uppercase font-display"
        >
          Everything you need <br />
          <span className="text-brand-accent">to run logistics.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto font-medium"
        >
          A modular platform designed to handle the complexities of African trade, from the first mile to the final delivery.
        </motion.p>
      </header>

      {/* Modules with secondary background */}
      <section className="relative px-6 py-24 max-w-7xl mx-auto space-y-48 overflow-hidden">
        <div className="absolute top-1/2 left-0 w-full h-[1000px] -z-10 opacity-[0.03] pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=2600" 
            alt="Network Texture" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        {/* Shipment Management */}
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div className="relative group">
            <div className="aspect-square rounded-[4rem] overflow-hidden shadow-2xl border border-slate-100 relative">
              <img 
                src="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=2000" 
                alt="Warehouse Precision" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors" />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 hidden md:block">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 bg-blue-500 text-white rounded-xl flex items-center justify-center">
                    <Package size={24} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Throughput</p>
                    <p className="text-sm font-black text-slate-900">+124% Optimization</p>
                 </div>
              </div>
            </div>
          </div>
          <div>
            <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-10 shadow-sm">
              <Package size={40} />
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">Digitize <br/><span className="text-blue-600">The Ground.</span></h2>
            <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12">
              Transform physical inventory into digital assets. Instantly generate manifests, calculate multi-modal pricing, and trigger dispatch protocols from a single command node.
            </p>
            <ul className="space-y-6">
              {['Smart Manifest Generation', 'Automated Pricing Logic', 'Bulk Digital Import', 'Regulatory Document Vault'].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-base font-bold text-slate-800">
                  <div className="h-3 w-3 bg-blue-500 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Fleet Management */}
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div className="lg:order-2">
            <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-10 shadow-sm">
              <Truck size={40} />
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">Total Fleet <br/><span className="text-emerald-600">Awareness.</span></h2>
            <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12">
              Shipstack provides a high-fidelity window into your mobile assets. Monitor GPS telemetry, fuel diagnostics, and driver health in sub-second intervals.
            </p>
            <ul className="space-y-6">
              {['Precision GPS Telemetry', 'Dynamic Route Re-assignment', 'Fuel Integrity Monitoring', 'Asset Health Analytics'].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-base font-bold text-slate-800">
                  <div className="h-3 w-3 bg-emerald-500 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:order-1 relative group">
            <div className="aspect-square rounded-[4rem] overflow-hidden shadow-2xl border border-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2070&auto=format&fit=crop" 
                alt="Fleet Integrity" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-emerald-900/10 group-hover:bg-emerald-900/0 transition-colors" />
            </div>
          </div>
        </div>

        {/* Driver App */}
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div>
            <div className="h-20 w-20 bg-orange-50 text-orange-600 rounded-[2rem] flex items-center justify-center mb-10 shadow-sm">
              <Smartphone size={40} />
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">The Mobile <br/><span className="text-orange-600">Command Node.</span></h2>
            <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12">
              Engineered for the realities of the road. Our field application works in low-bandwidth environments, providing drivers with real-time route vectors and instant mobile money settlements.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-orange-600">
                  <WifiOff size={24} />
                  <span className="text-sm font-black uppercase tracking-widest">Resilient Mode</span>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-tight">Bi-directional sync that tolerates intermittent network loss.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-orange-600">
                  <DollarSign size={24} />
                  <span className="text-sm font-black uppercase tracking-widest">Instant Liquidity</span>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-tight">Zero-wait settlements directly to mobile money wallets.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center relative">
            {/* Visual background element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full aspect-square bg-orange-500/5 blur-[100px] rounded-full" />
            
            <div className="w-72 h-[580px] bg-slate-950 rounded-[4rem] border-[12px] border-slate-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden z-10">
              <div className="absolute top-0 left-0 w-full h-8 bg-slate-900 flex justify-center items-end pb-2">
                <div className="w-20 h-1.5 bg-slate-800 rounded-full" />
              </div>
              <div className="p-8 pt-16 space-y-8">
                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 text-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-brand">Current Protocol</p>
                  <p className="text-lg font-black uppercase tracking-tight">Active Dispatch #772</p>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Mapping</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-14 w-full bg-white/5 rounded-2xl border border-white/5 flex items-center px-6">
                    <div className="h-2 w-24 bg-white/10 rounded-full" />
                  </div>
                  <div className="h-14 w-full bg-white/5 rounded-2xl border border-white/5 flex items-center px-6">
                    <div className="h-2 w-16 bg-white/10 rounded-full" />
                  </div>
                  <div className="pt-4">
                    <div className="h-16 w-full bg-brand text-white rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-brand/20">
                      Confirm POD
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-48 overflow-hidden bg-slate-900 border-y border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2600&auto=format&fit=crop" 
            alt="Logistics Background" 
            className="w-full h-full object-cover opacity-50 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-900/40" />
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-12 leading-none">
            Scale your <br/><span className="text-brand">Infrastructure.</span>
          </h2>
          <p className="text-xl md:text-3xl text-slate-400 font-bold uppercase tracking-tight mb-16 leading-tight">
            Deploy the most advanced logistics operating <br className="hidden md:block" /> system in Africa today.
          </p>
          <Link to="/register" className="inline-flex bg-brand hover:bg-orange-600 text-white px-16 py-8 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
            Initialize Free Tier
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default ProductPage;
