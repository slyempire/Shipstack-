
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  ArrowRight, 
  ShoppingBag, 
  Sprout, 
  Building2, 
  Truck, 
  Map as MapIcon, 
  CheckCircle,
  Globe,
  Stethoscope
} from 'lucide-react';
import { motion } from 'framer-motion';
import MarketingLayout from '../../components/marketing/MarketingLayout';

const SolutionsPage: React.FC = () => {
  const solutions = [
    {
      id: 'ecommerce',
      icon: ShoppingBag,
      title: 'E-commerce',
      desc: 'Same-day delivery and customer tracking links for modern retailers.',
      features: ['Same-day delivery', 'Customer tracking links', 'Inventory management', 'Returns handling'],
      color: 'blue',
      image: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?q=80&w=2000&auto=format&fit=crop',
      link: '/solutions/ecommerce'
    },
    {
      id: 'agriculture',
      icon: Sprout,
      title: 'Agriculture',
      desc: 'Farm-to-market logistics with bulk shipment tracking and cold chain support.',
      features: ['Farm-to-market logistics', 'Bulk shipment tracking', 'Cold chain monitoring', 'Vendor management'],
      color: 'emerald',
      image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2000&auto=format&fit=crop',
      link: '/solutions/agriculture'
    },
    {
      id: 'retail',
      icon: Building2,
      title: 'Retail & Distribution',
      desc: 'Route optimization and multi-drop deliveries for large-scale operations.',
      features: ['Route optimization', 'Multi-drop deliveries', 'Warehouse management', 'Inventory forecasting'],
      color: 'orange',
      image: 'https://images.unsplash.com/photo-1542435503-956c469947f6?q=80&w=2000&auto=format&fit=crop',
      link: '/solutions/retail'
    },
    {
      id: 'healthcare',
      icon: Stethoscope,
      title: 'Healthcare',
      desc: 'Cold chain monitoring and regulatory compliance for medical logistics.',
      features: ['Cold chain monitoring', 'Regulatory compliance', 'Urgent medical dispatch', 'Sensitive handling'],
      color: 'rose',
      image: 'https://images.unsplash.com/photo-1583912267550-d44d2a3c79be?q=80&w=2000&auto=format&fit=crop',
      link: '/solutions/healthcare'
    }
  ];

  return (
    <MarketingLayout>
      {/* Hero */}
      <header className="px-6 pt-32 pb-48 max-w-7xl mx-auto text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=2600" 
            alt="Sector Grid" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-white/70" />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 px-4 py-2 rounded-full mb-8 shadow-sm"
        >
          <Globe size={14} className="text-brand" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Vectored Solutions</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none mb-8 uppercase font-display"
        >
          Built for <br/><span className="text-brand">specific mission sets.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-2xl text-slate-500 max-w-4xl mx-auto font-bold uppercase tracking-tight leading-tight"
        >
          Shipstack is engineered to handle the unique physics <br className="hidden md:block" /> of diverse African supply chain verticals.
        </motion.p>
      </header>

      {/* Solutions Grid */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12">
          {solutions.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[3.5rem] p-12 border border-slate-100 flex flex-col h-full hover:shadow-2xl transition-all group relative overflow-hidden min-h-[500px]"
            >
              {/* Background Image Reveal */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover opacity-0 group-hover:opacity-20 scale-110 group-hover:scale-100 transition-all duration-1000 grayscale group-hover:grayscale-0"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-12">
                  <div className={`h-20 w-20 bg-${item.color}-50 text-${item.color}-600 rounded-[2rem] flex items-center justify-center shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all duration-300`}>
                    <item.icon size={40} />
                  </div>
                  <span className="text-[10px] font-black text-slate-200">SECTOR / 0{i+1}</span>
                </div>

                <h3 className="text-4xl font-black uppercase tracking-tight mb-6">{item.title}</h3>
                <p className="text-xl text-slate-500 font-medium mb-12 leading-tight uppercase tracking-tight">{item.desc}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                  {item.features.map((feature, j) => (
                    <div key={j} className="flex items-center gap-3 text-sm font-bold text-slate-800 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl group-hover:bg-white group-hover:border-slate-200 transition-colors">
                      <div className={`h-2 w-2 rounded-full bg-${item.color}-500`} />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <Link 
                    to={item.link} 
                    className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 bg-slate-50 px-10 py-6 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"
                  >
                    Analyze Protocol <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-32 bg-slate-950 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-12">Powering large-scale operations <br /> <span className="text-brand-accent">across Africa.</span></h2>
          <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale filter">
            <div className="text-2xl font-black uppercase tracking-tighter">Nairobi Retail</div>
            <div className="text-2xl font-black uppercase tracking-tighter">Lagos FMCG</div>
            <div className="text-2xl font-black uppercase tracking-tighter">Kigali Agri-Hub</div>
            <div className="text-2xl font-black uppercase tracking-tighter">Dar Logistics</div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-48 overflow-hidden bg-slate-900 border-y border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1494412519320-aa613dfb7738?q=80&w=2600&auto=format&fit=crop" 
            alt="Trade Corridor" 
            className="w-full h-full object-cover opacity-50 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-900/30" />
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-12 leading-none">
            Ready to <br/><span className="text-brand">Automate?</span>
          </h2>
          <p className="text-xl md:text-3xl text-slate-400 font-bold uppercase tracking-tight mb-16 leading-tight">
            Connect your region's supply chain to a <br className="hidden md:block" /> single, intelligent command plane.
          </p>
          <Link to="/register" className="inline-flex bg-brand hover:bg-orange-600 text-white px-16 py-8 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
            Get Started Now
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default SolutionsPage;
