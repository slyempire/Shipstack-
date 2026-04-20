
import React from 'react';
import { motion } from 'framer-motion';
import { Store, Zap, Globe, ShieldCheck, ArrowRight, Package, Truck, Clock, BarChart } from 'lucide-react';
import MarketingLayout from '../../../components/marketing/MarketingLayout';
import { Link } from 'react-router-dom';

const RetailSolution: React.FC = () => {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-blue-50/30">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-blue-600/5 border border-blue-600/10 px-4 py-2 rounded-full mb-8"
          >
            <Store size={14} className="text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Retail Distribution</span>
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.85] mb-8 uppercase font-display"
              >
                Stocked. <br />
                <span className="text-blue-600">Always.</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg md:text-xl text-slate-500 max-w-xl mb-10 font-medium leading-relaxed"
              >
                Eliminate out-of-stock situations and optimize your retail distribution network. Shipstack provides the visibility you need to keep your shelves full and your customers happy.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/register" className="bg-blue-600 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all text-center">
                  Get Started
                </Link>
                <Link to="/contact" className="bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-600 transition-all text-center">
                  Talk to Sales
                </Link>
              </motion.div>
            </div>
            <div className="relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white"
              >
                <img 
                  src="https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?q=80&w=2072&auto=format&fit=crop" 
                  alt="Retail Distribution" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              {/* Floating Stats */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100"
              >
                <p className="text-2xl font-black text-blue-600">15%</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sales Increase</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="label-mono !text-blue-600 mb-4"
            >
              The Retail Edge
            </motion.p>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-6">Built for <span className="text-blue-600">Growth.</span></h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">Scalable tools for multi-point retail distribution across the continent.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Main Feature */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="md:col-span-2 md:row-span-2 p-10 bg-slate-900 text-white rounded-[2.5rem] flex flex-col justify-between group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Store size={200} />
              </div>
              <div className="relative z-10">
                <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-600/20">
                  <BarChart size={28} />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Demand Forecasting</h3>
                <p className="text-white/60 font-medium leading-relaxed max-w-xs">Predict stock needs based on historical data and seasonal trends. Eliminate out-of-stock situations and increase sales by up to 15%.</p>
              </div>
              <div className="mt-12 relative z-10">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center"><Zap size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Auto-Replenishment</p>
                    <p className="text-sm font-bold">Active for 124 stores</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Secondary Features */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 p-10 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex flex-col justify-between group"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="h-12 w-12 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Globe size={24} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-blue-600">99.9%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory Accuracy</p>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Multi-Store Control</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Manage distribution across hundreds of retail points from a single, unified dashboard with real-time stock levels.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 bg-blue-600/5 border border-blue-600/10 rounded-[2rem] group"
            >
              <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck size={20} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight mb-2">Shrinkage Control</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Track every item to minimize loss and ensure accountability.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] group"
            >
              <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock size={20} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight mb-2">Rapid Restocking</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">High-frequency, low-volume restocking cycles.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <p className="label-mono !text-blue-600 mb-4">The Process</p>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 mb-8 leading-[0.9]">Stocked. <br /><span className="text-blue-600">Always.</span></h2>
              
              <div className="space-y-8">
                {[
                  { step: "01", title: "Inventory Analysis", desc: "Real-time monitoring of stock levels across all retail locations." },
                  { step: "02", title: "Smart Replenishment", desc: "AI-driven triggers generate replenishment orders before stock runs out." },
                  { step: "03", title: "Optimized Dispatch", desc: "Orders are consolidated and routed for the most efficient multi-store delivery." },
                  { step: "04", title: "Shelf Verification", desc: "Drivers and store staff verify delivery and shelf placement via the mobile app." }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6 group"
                  >
                    <div className="text-2xl font-black text-blue-600/20 group-hover:text-blue-600 transition-colors">{item.step}</div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tight mb-1">{item.title}</h4>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="aspect-square bg-white rounded-[3rem] shadow-2xl p-12 flex items-center justify-center overflow-hidden border border-slate-100">
                <div className="relative z-10 w-full space-y-4">
                  {[
                    { store: "Nairobi Central", stock: 85, status: "Healthy" },
                    { store: "Mombasa Mall", stock: 24, status: "Low Stock" },
                    { store: "Kisumu Plaza", stock: 92, status: "Healthy" }
                  ].map((store, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${store.stock < 30 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <p className="text-sm font-bold uppercase tracking-tight">{store.store}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${store.stock}%` }}
                            className={`h-full ${store.stock < 30 ? 'bg-red-500' : 'bg-blue-600'}`}
                          />
                        </div>
                        <p className="text-[10px] font-black text-slate-400">{store.stock}%</p>
                      </div>
                    </motion.div>
                  ))}
                  <div className="mt-8 p-6 bg-blue-600 rounded-2xl text-white flex items-center justify-between shadow-xl shadow-blue-600/20">
                    <div className="flex items-center gap-3">
                      <Truck size={20} />
                      <p className="text-xs font-black uppercase tracking-widest">Dispatching Replenishment</p>
                    </div>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8">Optimized <span className="text-blue-600">Operations.</span></h2>
          <p className="text-white/60 max-w-2xl mx-auto font-medium mb-16">Shipstack helps retailers of all sizes achieve operational excellence and drive growth.</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-10 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-4xl font-black text-blue-600 mb-2">25%</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Operational Cost Reduction</p>
            </div>
            <div className="p-10 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-4xl font-black text-blue-600 mb-2">99%</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Inventory Accuracy</p>
            </div>
            <div className="p-10 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-4xl font-black text-blue-600 mb-2">10x</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Faster Restocking</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-blue-600 rounded-[3rem] p-16 text-center text-white shadow-2xl shadow-blue-600/40">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8">Ready to scale?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-12 font-medium">Join the leading retailers and distributors in Africa using Shipstack.</p>
          <Link to="/register" className="inline-flex bg-white text-blue-600 px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-50 transition-all">
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default RetailSolution;
