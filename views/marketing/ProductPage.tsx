
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
      {/* Hero (v2: dark + full-bleed warehouse photo + bottom-left headline) */}
      <header className="relative bg-[#0B0E16] overflow-hidden h-[70vh] min-h-[560px] flex flex-col">
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2600"
          alt="Warehouse operations"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E16] via-[#0B0E16]/70 to-[#0B0E16]/20" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0B0E16]/80 to-transparent" />

        <div className="relative flex-1 max-w-7xl mx-auto px-8 md:px-16 lg:px-24 w-full flex flex-col justify-between pt-32 pb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="self-start inline-flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md"
          >
            <Package size={14} className="text-[#FF5722]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">What you get</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-3xl lg:ml-12 xl:ml-20"
          >
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[0.95] mb-8 uppercase">
              Everything you need <br />
              <span className="text-[#FF5722]">to run logistics.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 font-medium leading-relaxed max-w-2xl">
              Everything you need to run modern logistics in Africa &mdash; from first mile to last.
            </p>
          </motion.div>
        </div>
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
                    <p className="text-sm font-black text-slate-900">+124% efficiency</p>
                 </div>
              </div>
            </div>
          </div>
          <div>
            <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-10 shadow-sm">
              <Package size={40} />
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">Digital <br/><span className="text-blue-600">manifests.</span></h2>
            <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12">
              Turn physical shipments into digital manifests in seconds. Auto-calculate pricing, route dispatch, and store regulatory documents in one place.
            </p>
            <ul className="space-y-6">
              {['Auto-generated manifests', 'Auto-pricing across modes', 'Bulk import', 'Regulatory document vault'].map((item, i) => (
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
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">See every <br/><span className="text-emerald-600">vehicle.</span></h2>
            <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12">
              Live GPS for every vehicle, with fuel readings, vehicle health, and driver status &mdash; all updated in real time.
            </p>
            <ul className="space-y-6">
              {['Live GPS tracking', 'Reroute on the fly', 'Fuel monitoring', 'Vehicle health analytics'].map((item, i) => (
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
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">The driver <br/><span className="text-orange-600">app.</span></h2>
            <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12">
              Built for the real road. Works offline, syncs when drivers are back online, and pays them instantly when each trip is reconciled.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-orange-600">
                  <WifiOff size={24} />
                  <span className="text-sm font-black uppercase tracking-widest">Works offline</span>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-tight">Drivers keep working in low-signal areas. Everything syncs back when reconnected.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-orange-600">
                  <DollarSign size={24} />
                  <span className="text-sm font-black uppercase tracking-widest">Instant payouts</span>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-tight">Drivers get paid to M-Pesa, Wave, or bank the moment a trip clears.</p>
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
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-brand">Current trip</p>
                  <p className="text-lg font-black uppercase tracking-tight">Trip #772</p>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live</span>
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
            Want to <br/><span className="text-brand">pilot it?</span>
          </h2>
          <p className="text-xl md:text-3xl text-slate-400 font-bold uppercase tracking-tight mb-16 leading-tight">
            Join our first cohort of pilot partners <br className="hidden md:block" /> shaping African logistics with us.
          </p>
          <Link to="/register" className="inline-flex bg-brand hover:bg-orange-600 text-white px-16 py-8 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
            Apply for pilot
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default ProductPage;
