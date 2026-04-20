
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
      <header className="px-6 pt-32 pb-24 max-w-7xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 px-4 py-2 rounded-full mb-8"
        >
          <Package size={14} className="text-brand" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">The Product</span>
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

      {/* Modules */}
      <section className="px-6 py-24 max-w-7xl mx-auto space-y-32">
        {/* Shipment Management */}
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative group">
            <div className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000" 
                alt="Logistics Operations" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/0 transition-colors" />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 animate-bounce-subtle">
              <Package className="text-blue-600" size={32} />
            </div>
          </div>
          <div>
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm">
              <Package size={32} />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">Create shipments <span className="text-blue-600">in seconds.</span></h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10">
              Instantly generate delivery orders, calculate pricing, and dispatch drivers—all from one dashboard. No more manual spreadsheets or fragmented communication.
            </p>
            <ul className="space-y-4">
              {['Automated order generation', 'Bulk shipment uploads', 'Dynamic pricing engine', 'Custom labeling & documentation'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <div className="h-2 w-2 bg-blue-500 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Fleet Management */}
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="lg:order-2">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm">
              <Truck size={32} />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">Fleet & Driver <span className="text-emerald-600">Management.</span></h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10">
              Maintain full control over your assets. Track vehicle health, monitor driver performance, and manage documentation in one place.
            </p>
            <ul className="space-y-4">
              {['Real-time GPS tracking', 'Driver performance scoring', 'Maintenance scheduling', 'Fuel consumption analytics'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:order-1 relative group">
            <div className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2075&auto=format&fit=crop" 
                alt="Fleet on Road" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-emerald-600/10 group-hover:bg-emerald-600/0 transition-colors" />
            </div>
            <div className="absolute -top-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 animate-bounce-subtle">
              <Truck className="text-emerald-600" size={32} />
            </div>
          </div>
        </div>

        {/* Driver App */}
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="h-16 w-16 bg-orange-50 text-orange-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm">
              <Smartphone size={32} />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">Mobile-First <span className="text-orange-600">Driver App.</span></h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10">
              Built for the realities of the road. Our driver app works offline, supports mobile money, and provides clear, turn-by-turn instructions.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-orange-600">
                  <WifiOff size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Offline Mode</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Sync data when connection returns.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-orange-600">
                  <DollarSign size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Instant Pay</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Receive earnings via M-Pesa.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-64 h-[500px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-6 bg-slate-800 flex justify-center items-end pb-1">
                <div className="w-16 h-1 bg-slate-700 rounded-full" />
              </div>
              <div className="p-6 pt-12 space-y-6">
                <div className="h-32 bg-brand/20 border border-brand/30 rounded-2xl flex flex-col items-center justify-center text-white text-center p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Next Delivery</p>
                  <p className="text-sm font-black uppercase tracking-tight">Industrial Area, NBO</p>
                </div>
                <div className="space-y-3">
                  <div className="h-10 w-full bg-white/5 rounded-xl border border-white/10" />
                  <div className="h-10 w-full bg-white/5 rounded-xl border border-white/10" />
                  <div className="h-12 w-full bg-brand text-white rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-lg">Complete Delivery</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand py-24 text-center text-white px-6">
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8">Ready to digitize?</h2>
        <Link to="/register" className="inline-flex bg-white text-brand px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
          Start Free Trial
        </Link>
      </section>
    </MarketingLayout>
  );
};

export default ProductPage;
