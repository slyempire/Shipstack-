
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  ArrowRight, 
  Globe, 
  Truck, 
  Map as MapIcon, 
  CheckCircle,
  Heart,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import MarketingLayout from '../../components/marketing/MarketingLayout';

const AboutPage: React.FC = () => {
  return (
    <MarketingLayout>
      {/* Hero */}
      <header className="px-6 pt-32 pb-24 max-w-7xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 px-4 py-2 rounded-full mb-8"
        >
          <Heart size={14} className="text-brand" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Our Story</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-8 uppercase font-display"
        >
          Built for Africa. <br />
          <span className="text-brand-accent">Built to scale.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto font-medium"
        >
          We’re building the infrastructure layer to simplify how goods move across the continent.
        </motion.p>
      </header>

      {/* Story Section */}
      <section className="px-6 py-24 max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-10">
          <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">The <span className="text-brand-accent">Challenge.</span></h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            Logistics in Africa is complex—fragmented systems, limited visibility, and inefficient processes. For too long, businesses have had to rely on manual spreadsheets and fragmented communication to move goods across borders and corridors.
          </p>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            We saw this firsthand at the border points, in the warehouses, and in the truck cabins. We realized that the solution wasn't just "more trucks"—it was a unified operating system that could stabilize the supply chain and empower the workforce.
          </p>
          <div className="flex items-center gap-6">
            <div className="h-12 w-12 bg-brand/5 text-brand rounded-2xl flex items-center justify-center shadow-sm">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-900">Our Mission</p>
              <p className="text-xs text-slate-500 font-medium">To digitize the African corridor and make trade seamless.</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-square rounded-[4rem] overflow-hidden shadow-2xl border border-slate-100 group">
            <img 
              src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2075&auto=format&fit=crop" 
              alt="Logistics in Africa" 
              className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand/40 to-transparent"></div>
          </div>
          <div className="absolute -bottom-10 -left-10 bg-brand p-10 rounded-[3rem] shadow-2xl text-white max-w-xs">
            <p className="text-3xl font-black tracking-tighter mb-2">Nairobi Hub</p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Where it all started.</p>
          </div>
        </div>
      </section>

      {/* Logistics Gallery */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-xl border border-slate-100 relative group">
            <img 
              src="https://images.unsplash.com/photo-1580674285054-bed31e145f59?q=80&w=2070&auto=format&fit=crop" 
              alt="Truck on Road" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/0 transition-colors" />
          </div>
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-xl border border-slate-100 relative group md:mt-12">
            <img 
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000" 
              alt="Warehouse Operations" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/0 transition-colors" />
          </div>
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-xl border border-slate-100 relative group">
            <img 
              src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2070&auto=format&fit=crop" 
              alt="Cargo Ship" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/0 transition-colors" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 mb-6">Our <span className="text-brand-accent">Values.</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { title: "Local First", desc: "We build for the real-world challenges of the African corridor." },
              { title: "Radical Transparency", desc: "We believe absolute visibility is the key to trust in logistics." },
              { title: "Human Centric", desc: "Our platform empowers the people who keep the continent moving." }
            ].map((item, i) => (
              <div key={i} className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 text-center">
                <h4 className="text-xl font-black uppercase tracking-tight mb-4">{item.title}</h4>
                <p className="text-slate-500 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand py-24 text-center text-white px-6">
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8">Join the movement.</h2>
        <Link to="/register" className="inline-flex bg-white text-brand px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
          Get Started
        </Link>
      </section>
    </MarketingLayout>
  );
};

export default AboutPage;
