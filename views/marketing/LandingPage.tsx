
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { api } from '../../api';
import { 
  Layers, 
  ArrowRight, 
  Truck, 
  Route as RouteIcon, 
  FileText, 
  DollarSign, 
  ShieldCheck, 
  Zap, 
  Map as MapIcon,
  ChevronRight,
  LayoutDashboard,
  Globe
} from 'lucide-react';

import FeatureGuide from '../../components/FeatureGuide';
import ScrollToTop from '../../components/ScrollToTop';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [guideOpen, setGuideOpen] = React.useState(false);

  const handleDashboardRedirect = () => {
    if (user?.role === 'DRIVER') navigate('/driver');
    else if (user?.role === 'FACILITY') navigate('/facility');
    else navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-auto selection:bg-brand-accent selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg">
              <Layers size={22} />
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tighter uppercase font-display">Shipstack</span>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <Link to="/infrastructure" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-brand transition-colors">Infrastructure</Link>
            <Link to="/pricing" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-brand transition-colors">Pricing</Link>
            <Link to="/legal" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-brand transition-colors">Operational Charter</Link>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button 
                onClick={handleDashboardRedirect}
                className="bg-brand text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-brand-accent transition-all"
              >
                <LayoutDashboard size={14} /> Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-brand px-3 py-2 hover:bg-slate-50 rounded-lg transition-all">Sign In</Link>
                <Link to="/register" className="bg-brand text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pt-24 pb-32 max-w-7xl mx-auto flex flex-col items-center text-center relative overflow-hidden min-h-[80vh] justify-center">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000" 
            alt="Logistics Network" 
            className="w-full h-full object-cover opacity-[0.4]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/40 to-white"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-accent/30 rounded-full blur-[120px]"></div>
        </div>

        <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full mb-10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700 relative z-10">
          <Globe size={14} className="text-brand-accent" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">The Operating System for African Trade</span>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-10 uppercase font-display relative z-10">
          Logistics that <br />
          <span className="text-brand-accent">moves with you.</span>
        </h1>
        
        <p className="text-lg md:text-2xl text-slate-500 max-w-3xl mb-16 font-medium relative z-10">
          Shipstack is the heartbeat of East African commerce. We empower the drivers, dispatchers, and businesses who keep the continent moving with a platform built for the real-world challenges of the African corridor.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto px-4 relative z-10">
          <button 
            onClick={() => navigate(isAuthenticated ? '/admin' : '/register')} 
            className="touch-btn sm:px-12 bg-brand text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand/40 active:scale-95 transition-all flex items-center gap-3 group"
          >
            Initialize Shipstack <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => setGuideOpen(true)} 
            className="touch-btn sm:px-12 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:border-brand-accent hover:shadow-xl transition-all"
          >
            Watch the Vision
          </button>
        </div>
      </section>

      {/* Value Prop Section */}
      <section className="py-32 bg-slate-950 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-8">
                Built for the <br />
                <span className="text-brand-accent">Backbone of Trade.</span>
              </h2>
              <p className="text-lg text-white/60 font-medium leading-relaxed mb-10">
                We didn't build Shipstack in a vacuum. We built it at the border points, in the warehouses, and in the truck cabins. We understand that logistics in Africa isn't just about moving boxes—it's about trust, transparency, and the people who make it happen.
              </p>
              <div className="space-y-8">
                {[
                  { title: "Human-Centric Design", desc: "Interfaces built for drivers and warehouse staff, not just executives." },
                  { title: "Corridor-Ready", desc: "Optimized for the unique challenges of the Northern and Central corridors." },
                  { title: "Real-Time Trust", desc: "Eliminate the 'where is my cargo?' anxiety with absolute transparency." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} className="text-brand-accent" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase text-sm tracking-tight mb-1">{item.title}</h4>
                      <p className="text-sm text-white/40 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000">
              <div className="aspect-square rounded-[4rem] overflow-hidden shadow-2xl border border-white/10">
                <img 
                  src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2075&auto=format&fit=crop" 
                  alt="Trucking in Africa" 
                  className="w-full h-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 bg-brand-accent p-10 rounded-[3rem] shadow-2xl text-white max-w-xs">
                <p className="text-4xl font-black tracking-tighter mb-2">99.9%</p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Visibility across the East African corridor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="bg-white py-12 border-y border-slate-100 overflow-hidden">
         <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Trusted by the region's leading transporters</p>
            <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 grayscale filter">
               <div className="flex items-center gap-2 font-black text-lg uppercase tracking-tighter">Nairobi Hub Ops</div>
               <div className="flex items-center gap-2 font-black text-lg uppercase tracking-tighter">Mombasa Port Ops</div>
               <div className="flex items-center gap-2 font-black text-lg uppercase tracking-tighter">Pharma Transporters</div>
               <div className="flex items-center gap-2 font-black text-lg uppercase tracking-tighter">Transit East Africa</div>
            </div>
         </div>
      </div>

      {/* Feature Grid */}
      <section id="features" className="px-6 py-32 max-w-7xl mx-auto relative">
         <div className="absolute inset-0 -z-10 opacity-[0.2] pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&q=80&w=2000" 
              alt="Cargo Ship" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
         </div>
         <div className="text-center mb-24">
            <h2 className="mobile-h2 uppercase font-display text-slate-900 mb-6">Everything you need <br /> <span className="text-brand-accent">to scale.</span></h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">A comprehensive suite of tools designed to stabilize your supply chain and empower your workforce.</p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 sm:gap-24">
            <FeatureItem 
              icon={RouteIcon} 
              title="Intelligent Routing" 
              desc="Save fuel and time with routes that account for border delays, road conditions, and real-time traffic across the corridor." 
            />
            <FeatureItem 
              icon={Zap} 
              title="Live Telemetry" 
              desc="Monitor your fleet's health and location with precision. Get notified the moment a vehicle reaches a hub or crosses a border." 
            />
            <FeatureItem 
              icon={ShieldCheck} 
              title="Digital Compliance" 
              desc="Stay ahead of regulations with automated NTSA checks, insurance tracking, and safety audits for every unit in your pool." 
            />
            <FeatureItem 
              icon={Globe} 
              title="Multi-Hub Control" 
              desc="Manage multiple warehouses and distribution centers from a single, unified command center with regional data isolation." 
            />
            <FeatureItem 
              icon={FileText} 
              title="Proof of Delivery" 
              desc="Eliminate paperwork. Capture geo-tagged signatures, photos, and timestamps digitally at every drop-off point." 
            />
            <FeatureItem 
              icon={DollarSign} 
              title="Financial Settlement" 
              desc="Integrated mobile money payments for drivers and vendors. Settle accounts in seconds based on verified operational data." 
            />
         </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 relative overflow-hidden">
         <div className="max-w-7xl mx-auto bg-slate-900 rounded-[4rem] p-16 sm:p-32 text-center text-white relative overflow-hidden shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1494412574743-0194856f038f?auto=format&fit=crop&q=80&w=2000" 
              alt="Warehouse Operations" 
              className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_2px_2px,_rgba(255,255,255,0.1)_1px,_transparent_0)] bg-[length:40px_40px]"></div>
            <div className="relative z-10">
               <h2 className="mobile-h2 mb-8 uppercase font-display tracking-tight">Ready to stabilize your <span className="text-brand-accent">Supply Chain?</span></h2>
               <p className="mobile-p text-white/40 max-w-2xl mx-auto mb-16 font-medium">Join the hundreds of businesses digitizing their logistics across East Africa.</p>
               <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <Link to="/register" className="inline-flex bg-brand-accent text-white px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
                     Get Started for Free <ChevronRight size={18} />
                  </Link>
                  <a href="mailto:ops@shipstack.africa" className="inline-flex bg-white/5 border border-white/10 text-white px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                     Contact Sales
                  </a>
               </div>
            </div>
         </div>
      </section>

      <footer className="bg-slate-900 text-white py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 border-b border-white/5 pb-20">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-brand-accent rounded-xl flex items-center justify-center">
                <Layers size={22} />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase font-display">Shipstack</span>
            </div>
            <p className="text-sm text-white/40 font-medium leading-relaxed">The premier operating stack for high-performance logistics across the East African corridor. Built in Nairobi, for the world.</p>
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest mb-8 text-brand-accent">Infrastructure</h4>
            <ul className="space-y-5 text-xs font-bold text-white/60">
              <li><Link to="/infrastructure" className="hover:text-white transition-colors">Operational Command</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Pilot Terminal</Link></li>
              <li><Link to="/legal" className="hover:text-white transition-colors">Hub Management</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest mb-8 text-brand-accent">Legal</h4>
            <ul className="space-y-5 text-xs font-bold text-white/60">
              <li><Link to="/legal" className="hover:text-white transition-colors">Charter of Ops</Link></li>
              <li><Link to="/legal" className="hover:text-white transition-colors">Data Privacy Shield</Link></li>
              <li><Link to="/legal" className="hover:text-white transition-colors">Compliance Audit</Link></li>
            </ul>
          </div>
          <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5">
             <h4 className="text-lg font-black mb-3 uppercase font-display">Contact Sales</h4>
             <p className="text-xs text-white/40 mb-8 font-medium leading-relaxed">Inquire for enterprise fleet deployments in Kenya, Uganda & Rwanda.</p>
             <a href="mailto:ops@shipstack.africa" className="text-xs font-black uppercase tracking-widest text-brand-accent flex items-center gap-2 hover:translate-x-1 transition-all">
                ops@shipstack.africa <ArrowRight size={16} />
             </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 flex flex-col sm:flex-row justify-between items-center text-[10px] font-black text-white/20 uppercase tracking-widest gap-6">
           <span>&copy; 2025 Shipstack Technologies. All rights reserved.</span>
           <div className="flex gap-8">
              <span>Stack Status: Nominal</span>
              <span>Region: KE-NBO-1</span>
           </div>
        </div>
      </footer>
      <FeatureGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      <ScrollToTop />
    </div>
  );
};

const FeatureItem = ({ icon: Icon, title, desc }: any) => (
  <div className="space-y-6 group">
     <div className="h-14 w-14 sm:h-16 sm:w-16 bg-slate-50 text-brand rounded-2xl sm:rounded-[1.25rem] flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-all shadow-sm">
        <Icon size={30} strokeWidth={2.5} />
     </div>
     <h3 className="text-lg sm:text-xl font-black tracking-tight uppercase text-slate-900 leading-none">{title}</h3>
     <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;