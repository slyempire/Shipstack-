
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
      link: '/solutions/ecommerce'
    },
    {
      id: 'agriculture',
      icon: Sprout,
      title: 'Agriculture',
      desc: 'Farm-to-market logistics with bulk shipment tracking and cold chain support.',
      features: ['Farm-to-market logistics', 'Bulk shipment tracking', 'Cold chain monitoring', 'Vendor management'],
      color: 'emerald',
      link: '/solutions/agriculture'
    },
    {
      id: 'retail',
      icon: Building2,
      title: 'Retail & Distribution',
      desc: 'Route optimization and multi-drop deliveries for large-scale operations.',
      features: ['Route optimization', 'Multi-drop deliveries', 'Warehouse management', 'Inventory forecasting'],
      color: 'orange',
      link: '/solutions/retail'
    },
    {
      id: 'healthcare',
      icon: Stethoscope,
      title: 'Healthcare',
      desc: 'Cold chain monitoring and regulatory compliance for medical logistics.',
      features: ['Cold chain monitoring', 'Regulatory compliance', 'Urgent medical dispatch', 'Sensitive handling'],
      color: 'rose',
      link: '/solutions/healthcare'
    }
  ];

  return (
    <MarketingLayout>
      {/* Hero */}
      <header className="px-6 pt-32 pb-24 max-w-7xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 px-4 py-2 rounded-full mb-8"
        >
          <Globe size={14} className="text-brand" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Solutions</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-8 uppercase font-display"
        >
          Built for <span className="text-brand-accent">your industry.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto font-medium"
        >
          Shipstack adapts to the unique operational challenges of different sectors across Africa.
        </motion.p>
      </header>

      {/* Solutions Grid */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-12">
          {solutions.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 flex flex-col h-full hover:shadow-2xl transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.05] -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-700">
                <item.icon size={128} />
              </div>
              <div className={`h-16 w-16 bg-${item.color}-50 text-${item.color}-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:bg-${item.color}-600 group-hover:text-white transition-colors relative z-10`}>
                <item.icon size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4 relative z-10">{item.title}</h3>
              <p className="text-slate-500 font-medium mb-8 flex-grow relative z-10">{item.desc}</p>
              <ul className="space-y-4 mb-10 relative z-10">
                {item.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <CheckCircle size={16} className={`text-${item.color}-500`} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to={item.link} className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-${item.color}-600 hover:translate-x-1 transition-transform relative z-10`}>
                Learn More <ArrowRight size={16} />
              </Link>
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

      {/* CTA */}
      <section className="bg-brand py-24 text-center text-white px-6">
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8">Ready to scale?</h2>
        <Link to="/register" className="inline-flex bg-white text-brand px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
          Get Started
        </Link>
      </section>
    </MarketingLayout>
  );
};

export default SolutionsPage;
