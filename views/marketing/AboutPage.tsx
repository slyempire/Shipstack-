
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
      {/* Hero (v2: dark + full-bleed photo + bottom-left headline) */}
      <header className="relative bg-[#0B0E16] overflow-hidden h-[70vh] min-h-[560px] flex flex-col">
        <img
          src="https://images.unsplash.com/photo-1549194388-f61be84a6e9e?q=80&w=2600&auto=format&fit=crop"
          alt="Africa logistics corridor"
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
            <Heart size={14} className="text-[#FF5722]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">Our story</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-3xl lg:ml-12 xl:ml-20"
          >
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[0.95] mb-8 uppercase">
              Built for Africa. <br />
              <span className="text-[#FF5722]">Built to scale.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 font-medium leading-relaxed max-w-2xl">
              We&rsquo;re building the infrastructure layer to simplify how goods move across the continent.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Story Section */}
      <section className="px-6 py-24 max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-10">
          <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">The <span className="text-brand-accent">Challenge.</span></h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            Logistics in Africa is complex &mdash; fragmented systems, limited visibility, and processes still running on spreadsheets and WhatsApp. We started Shipstack because we believe African operators deserve software built for the way they actually work.
          </p>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            We're early. We're spending our first months on the ground in Nairobi and Lagos &mdash; in warehouses, at border posts, in truck cabins &mdash; learning from operators and building the product alongside them. If that sounds like something you want to help shape, we'd love to talk.
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

          <div className="mt-32 pt-20 border-t border-slate-200 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6">Who's behind this</p>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">A Product of <a href="https://murzaktech.com" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Murzak Technologies</a></h3>
            <p className="text-slate-500 font-medium max-w-xl mx-auto">
              Shipstack is built and run by the team at Murzak Technologies &mdash; engineers solving real African logistics problems with clean code.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-48 overflow-hidden bg-slate-900 border-y border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1570675114274-850697cca205?q=80&w=2600&auto=format&fit=crop" 
            alt="Engineering Logistics" 
            className="w-full h-full object-cover opacity-60 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-900/40" />
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-12 leading-none">
            Want to <br/><span className="text-brand">work together?</span>
          </h2>
          <p className="text-xl md:text-3xl text-slate-400 font-bold uppercase tracking-tight mb-16 leading-tight">
            Join us in building the new standard <br className="hidden md:block" /> for African logistics.
          </p>
          <Link to="/register" className="inline-flex bg-brand hover:bg-orange-600 text-white px-16 py-8 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
            Get started
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default AboutPage;
