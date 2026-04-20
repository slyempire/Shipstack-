
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
      {/* Hero */}
      <header className="px-6 pt-32 pb-24 max-w-7xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 px-4 py-2 rounded-full mb-8"
        >
          <MessageSquare size={14} className="text-brand" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Contact Us</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-8 uppercase font-display"
        >
          Let’s talk <span className="text-brand-accent">logistics.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto font-medium"
        >
          Whether you're an SME, a fleet operator, or an enterprise, we're here to help you scale.
        </motion.p>
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
