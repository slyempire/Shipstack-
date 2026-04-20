
import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Zap, Globe, ShieldCheck, ArrowRight, Package, Truck, Clock } from 'lucide-react';
import MarketingLayout from '../../../components/marketing/MarketingLayout';
import { Link } from 'react-router-dom';

const EcommerceSolution: React.FC = () => {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-slate-50">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 px-4 py-2 rounded-full mb-8"
          >
            <ShoppingCart size={14} className="text-brand" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">E-commerce Logistics</span>
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8 uppercase font-display"
              >
                Scale Your <br />
                <span className="text-brand-accent">Online Store.</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg md:text-xl text-slate-500 max-w-xl mb-10 font-medium leading-relaxed"
              >
                From checkout to doorstep. Shipstack provides the infrastructure you need to offer same-day delivery, real-time tracking, and seamless returns for your customers.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/register" className="bg-brand text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-brand-accent transition-all text-center">
                  Get Started
                </Link>
                <Link to="/contact" className="bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-brand-accent transition-all text-center">
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
                  src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?q=80&w=2070&auto=format&fit=crop" 
                  alt="E-commerce Fulfillment" 
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
                <p className="text-2xl font-black text-brand-accent">98%</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">On-time Delivery</p>
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
              className="label-mono !text-brand mb-4"
            >
              The Platform
            </motion.p>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-6">Built for <span className="text-brand-accent">Speed.</span></h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">Everything you need to delight your customers and grow your brand in the digital age.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Main Feature */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="md:col-span-2 md:row-span-2 p-10 bg-slate-900 text-white rounded-[2.5rem] flex flex-col justify-between group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Zap size={200} />
              </div>
              <div className="relative z-10">
                <div className="h-14 w-14 bg-brand rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-brand/20">
                  <Zap size={28} />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Instant Dispatch</h3>
                <p className="text-white/60 font-medium leading-relaxed max-w-xs">Automatically assign orders to the nearest available driver as soon as they're confirmed. Reduce wait times by up to 40%.</p>
              </div>
              <div className="mt-12 relative z-10">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                      <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                  <div className="h-10 w-10 rounded-full border-2 border-slate-900 bg-brand flex items-center justify-center text-[10px] font-black">+500</div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mt-4 text-white/40">Trusted by 500+ local merchants</p>
              </div>
            </motion.div>

            {/* Secondary Features */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between group"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="h-12 w-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <ShieldCheck size={24} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900">99.9%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Success</p>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Secure Payments</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Integrated M-Pesa and card payments for seamless cash-on-delivery or pre-paid orders.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 bg-brand/5 border border-brand/10 rounded-[2rem] group"
            >
              <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe size={20} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight mb-2">Live Tracking</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Branded tracking pages for your customers.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] group"
            >
              <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Package size={20} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight mb-2">Inventory Sync</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Real-time visibility across all warehouses.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <p className="label-mono !text-brand mb-4">The Workflow</p>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 mb-8 leading-[0.9]">How it <span className="text-brand-accent">Works.</span></h2>
              
              <div className="space-y-8">
                {[
                  { step: "01", title: "Order Placement", desc: "Customer places an order on your Shopify, WooCommerce, or custom store." },
                  { step: "02", title: "Auto-Dispatch", desc: "Shipstack instantly identifies the best driver and route for the delivery." },
                  { step: "03", title: "Real-time Fulfillment", desc: "Driver picks up the package and the customer receives a live tracking link." },
                  { step: "04", title: "Successful Delivery", desc: "Package is delivered, payment is settled, and your inventory is updated." }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6 group"
                  >
                    <div className="text-2xl font-black text-brand/20 group-hover:text-brand transition-colors">{item.step}</div>
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
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center"><Package size={20} /></div>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="h-full bg-brand w-1/2"
                      />
                    </div>
                    <div className="h-10 w-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center"><ShieldCheck size={20} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-2">
                      <Truck size={32} className="text-brand" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">In Transit</p>
                    </div>
                    <div className="h-32 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-2">
                      <Clock size={32} className="text-orange-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ETA: 14m</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8">Connect Your <span className="text-brand-accent">Stack.</span></h2>
          <p className="text-white/60 max-w-2xl mx-auto font-medium mb-16">Shipstack integrates seamlessly with the world's leading e-commerce platforms.</p>
          
          <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale">
            <div className="text-2xl font-black tracking-tighter">Shopify</div>
            <div className="text-2xl font-black tracking-tighter">WooCommerce</div>
            <div className="text-2xl font-black tracking-tighter">Magento</div>
            <div className="text-2xl font-black tracking-tighter">Custom API</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-brand rounded-[3rem] p-16 text-center text-white shadow-2xl shadow-brand/40">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8">Ready to ship?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-12 font-medium">Join the fastest-growing e-commerce brands in Africa using Shipstack.</p>
          <Link to="/register" className="inline-flex bg-white text-brand px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-50 transition-all">
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default EcommerceSolution;
