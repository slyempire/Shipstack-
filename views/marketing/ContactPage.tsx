
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  ArrowRight, 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare,
  Globe,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import MarketingLayout from '../../components/marketing/MarketingLayout';

const ContactPage: React.FC = () => {
  return (
    <MarketingLayout>
      {/* Hero (v2: dark + full-bleed photo + bottom-left headline) */}
      <header className="relative bg-[#0B0E16] overflow-hidden h-[55vh] min-h-[460px] flex flex-col">
        <img
          src="https://images.unsplash.com/photo-1494412519320-aa613dfb7738?q=80&w=2600&auto=format&fit=crop"
          alt="Trade corridor"
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
            <MessageSquare size={14} className="text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">Contact us</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-3xl lg:ml-12 xl:ml-20"
          >
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[0.95] mb-8 uppercase">
              Let&rsquo;s talk <span className="text-brand">logistics.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 font-medium leading-relaxed max-w-2xl">
              Whether you're an SME, a fleet operator, or an enterprise, we're here to help you scale.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Contact Grid */}
      <section className="px-6 py-24 max-w-7xl mx-auto grid lg:grid-cols-2 gap-20">
        {/* Contact Info */}
        <div className="space-y-12">
          <div className="space-y-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Get in <span className="text-brand-accent">touch.</span></h2>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 bg-slate-50 text-brand rounded-2xl flex items-center justify-center shadow-sm">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Email</p>
                  <p className="text-sm font-bold text-slate-900">ops@shipstack.africa</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 bg-slate-50 text-brand rounded-2xl flex items-center justify-center shadow-sm">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Phone / WhatsApp</p>
                  <p className="text-sm font-bold text-slate-900">+254 700 000 000</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 bg-slate-50 text-brand rounded-2xl flex items-center justify-center shadow-sm">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Location</p>
                  <p className="text-sm font-bold text-slate-900">Nairobi Hub, Kenya</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
            <h4 className="text-xl font-black uppercase tracking-tight mb-6">Why book a demo?</h4>
            <ul className="space-y-4">
              {['Personalized walkthrough', 'Industry-specific solutions', 'Pricing consultation', 'Integration strategy'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle size={16} className="text-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">First Name</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Name</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand transition-colors" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Work Email</label>
              <input type="email" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Company Name</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message</label>
              <textarea rows={4} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand transition-colors resize-none" />
            </div>
            <button type="submit" className="w-full bg-brand text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
              Send Message
            </button>
          </form>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default ContactPage;
