
import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Zap, Globe, ShieldCheck, ArrowRight, Package, Truck, Clock, Leaf } from 'lucide-react';
import MarketingLayout from '../../../components/marketing/MarketingLayout';
import { Link } from 'react-router-dom';

const AgricultureSolution: React.FC = () => {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-emerald-50/30">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-emerald-600/5 border border-emerald-600/10 px-4 py-2 rounded-full mb-8"
          >
            <Sprout size={14} className="text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Agricultural Logistics</span>
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8 uppercase font-display"
              >
                Farm to <br />
                <span className="text-emerald-600">Fork.</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg md:text-xl text-slate-500 max-w-xl mb-10 font-medium leading-relaxed"
              >
                Reduce post-harvest loss and ensure freshness with Shipstack's specialized agricultural logistics platform. Track produce from the farm gate to the final consumer.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/register" className="bg-emerald-600 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all text-center">
                  Get Started
                </Link>
                <Link to="/contact" className="bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-600 transition-all text-center">
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
                  src="https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=2070&auto=format&fit=crop" 
                  alt="Agricultural Logistics" 
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
                <p className="text-2xl font-black text-emerald-600">30%</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Waste Reduction</p>
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
              className="label-mono !text-emerald-600 mb-4"
            >
              The Infrastructure
            </motion.p>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-6">Built for <span className="text-emerald-600">Freshness.</span></h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">Specialized tools for the unique challenges of the agricultural supply chain in Sub-Saharan Africa.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Main Feature */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="md:col-span-2 md:row-span-2 p-10 bg-slate-900 text-white rounded-[2.5rem] flex flex-col justify-between group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Leaf size={200} />
              </div>
              <div className="relative z-10">
                <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-600/20">
                  <Leaf size={28} />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Cold Chain Ready</h3>
                <p className="text-white/60 font-medium leading-relaxed max-w-xs">Monitor temperature and humidity levels in real-time to ensure produce quality throughout the journey. Reduce post-harvest loss by up to 30%.</p>
              </div>
              <div className="mt-12 relative z-10">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                      <img src={`https://picsum.photos/seed/farmer${i}/100/100`} alt="Farmer" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                  <div className="h-10 w-10 rounded-full border-2 border-slate-900 bg-emerald-600 flex items-center justify-center text-[10px] font-black">+50k</div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mt-4 text-white/40">Powering 50,000+ smallholder farmers</p>
              </div>
            </motion.div>

            {/* Secondary Features */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 p-10 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100 flex flex-col justify-between group"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="h-12 w-12 bg-emerald-600/10 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <ShieldCheck size={24} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-600">100%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Traceability</p>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Quality Audits</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Capture photos and quality reports at every collection point to ensure only the best produce is shipped.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 bg-emerald-600/5 border border-emerald-600/10 rounded-[2rem] group"
            >
              <div className="h-10 w-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe size={20} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight mb-2">Farmer Onboarding</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Easily manage thousands of smallholder farmers.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] group"
            >
              <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Truck size={20} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight mb-2">Rural Routing</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Optimized routes for rural collection points.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <p className="label-mono !text-emerald-600 mb-4">The Workflow</p>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 mb-8 leading-[0.9]">Farm to <span className="text-emerald-600">Fork.</span></h2>
              
              <div className="space-y-8">
                {[
                  { step: "01", title: "Farmer Collection", desc: "Produce is collected from smallholder farmers or large estates at the farm gate." },
                  { step: "02", title: "Quality Verification", desc: "Shipstack's mobile app captures quality audits and weight measurements instantly." },
                  { step: "03", title: "Cold Chain Transport", desc: "Produce is transported in temperature-controlled vehicles with real-time monitoring." },
                  { step: "04", title: "Market Delivery", desc: "Fresh produce is delivered to retailers or export hubs with full traceability." }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6 group"
                  >
                    <div className="text-2xl font-black text-emerald-600/20 group-hover:text-emerald-600 transition-colors">{item.step}</div>
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
                <motion.div 
                  animate={{ 
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 opacity-[0.03]"
                >
                  <Globe size={600} />
                </motion.div>
                <div className="relative z-10 space-y-6 w-full">
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                    <div className="h-10 w-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center"><Sprout size={20} /></div>
                    <div className="flex-1 h-2 bg-emerald-200 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="h-full bg-emerald-600 w-1/2"
                      />
                    </div>
                    <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><Truck size={20} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center gap-2">
                      <Leaf size={32} className="text-emerald-600" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Freshness: 100%</p>
                    </div>
                    <div className="h-32 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center gap-2">
                      <Clock size={32} className="text-orange-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">ETA: 2h 14m</p>
                    </div>
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
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8">Empowering <span className="text-emerald-600">Communities.</span></h2>
          <p className="text-white/60 max-w-2xl mx-auto font-medium mb-16">Shipstack is more than just software. We're building the infrastructure for a more resilient and equitable food system.</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-10 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-4xl font-black text-emerald-600 mb-2">50,000+</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Farmers Connected</p>
            </div>
            <div className="p-10 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-4xl font-black text-emerald-600 mb-2">1M+ Tons</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Produce Moved</p>
            </div>
            <div className="p-10 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-4xl font-black text-emerald-600 mb-2">20%</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Income Increase for Farmers</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-emerald-600 rounded-[3rem] p-16 text-center text-white shadow-2xl shadow-emerald-600/40">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8">Ready to scale?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-12 font-medium">Join the leading agricultural exporters and distributors using Shipstack.</p>
          <Link to="/register" className="inline-flex bg-white text-emerald-600 px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-50 transition-all">
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default AgricultureSolution;
