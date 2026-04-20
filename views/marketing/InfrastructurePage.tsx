
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  Server, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Database, 
  Cpu, 
  Network,
  ArrowRight,
  CheckCircle2,
  Lock,
  Cloud
} from 'lucide-react';
import ScrollToTop from '../../components/ScrollToTop';

const InfrastructurePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-brand-accent selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg group-hover:bg-brand-accent transition-colors">
              <Layers size={20} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase font-display">Shipstack</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand transition-colors">Home</Link>
            <Link to="/pricing" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand transition-colors">Pricing</Link>
            <Link to="/register" className="bg-brand text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-brand-accent transition-all">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-6 pt-24 pb-32 max-w-7xl mx-auto text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-[0.15] pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1558494949-ef010cbdcc48?auto=format&fit=crop&q=80&w=2000" 
            alt="Data Center" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-brand-accent/5 rounded-full blur-[120px] -z-10"></div>
        
        <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full mb-10 shadow-sm">
          <Server size={14} className="text-brand-accent" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Industrial Grade Backend</span>
        </div>

        <h1 className="mobile-h1 mb-8 uppercase font-display text-slate-900">
          The <span className="text-brand-accent">Infrastructure</span> of <br className="hidden md:block" /> Modern Logistics.
        </h1>
        
        <p className="mobile-p text-slate-500 max-w-3xl mx-auto mb-16 font-medium">
          ShipStack isn't just a dashboard. It's a high-performance distributed network designed to stabilize the most complex supply chains in East Africa.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <StatCard label="Uptime SLA" value="99.99%" sub="Carrier Grade Reliability" />
          <StatCard label="Latency" value="< 50ms" sub="Regional Edge Processing" />
          <StatCard label="Data Encryption" value="AES-256" sub="Bank-Level Security" />
        </div>
      </header>

      {/* Core Infrastructure Layers */}
      <section className="bg-white py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2 space-y-12">
              <div className="space-y-6">
                <h2 className="mobile-h2 uppercase font-display text-slate-900">The <span className="text-brand-teal">Stack</span> Architecture</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Our infrastructure is built on a multi-layered architecture that ensures data integrity from the driver's handset to the corporate boardroom.
                </p>
              </div>

              <div className="space-y-8">
                <LayerItem 
                  icon={Cloud} 
                  title="Regional Edge Network" 
                  desc="Strategically placed nodes in Nairobi, Mombasa, and Kampala ensure low-latency telemetry even in low-bandwidth environments."
                />
                <LayerItem 
                  icon={Database} 
                  title="Immutable Ledger" 
                  desc="Every manifest, delivery note, and settlement is recorded in an immutable audit trail, providing 100% transparency for KRA compliance."
                />
                <LayerItem 
                  icon={Lock} 
                  title="Identity & Access (RBAC)" 
                  desc="Granular security roles ensure that drivers, dispatchers, and facility managers only access the data relevant to their unit."
                />
              </div>
            </div>
            
            <div className="lg:w-1/2 w-full">
              <div className="aspect-square bg-slate-50 rounded-[4rem] border border-slate-200 p-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,_rgba(15,42,68,0.05)_1px,_transparent_0)] bg-[length:30px_30px]"></div>
                <div className="relative h-full flex flex-col justify-center gap-8">
                  <div className="h-24 w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 flex items-center gap-6 transform group-hover:-translate-y-2 transition-transform">
                    <div className="h-12 w-12 bg-brand rounded-xl flex items-center justify-center text-white"><Globe size={24} /></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-1/3 bg-slate-100 rounded-full"></div>
                      <div className="h-2 w-2/3 bg-slate-50 rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-24 w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 flex items-center gap-6 translate-x-12 transform group-hover:-translate-y-2 transition-transform delay-75">
                    <div className="h-12 w-12 bg-brand-accent rounded-xl flex items-center justify-center text-white"><Cpu size={24} /></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-1/4 bg-slate-100 rounded-full"></div>
                      <div className="h-2 w-1/2 bg-slate-50 rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-24 w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 flex items-center gap-6 transform group-hover:-translate-y-2 transition-transform delay-150">
                    <div className="h-12 w-12 bg-brand-teal rounded-xl flex items-center justify-center text-white"><ShieldCheck size={24} /></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-1/2 bg-slate-100 rounded-full"></div>
                      <div className="h-2 w-1/3 bg-slate-50 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24 space-y-6">
          <h2 className="mobile-h2 uppercase font-display text-slate-900">Advanced <span className="text-brand-accent">Capabilities</span></h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">Engineered for the specific demands of the East African trade corridors.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <FeatureCard 
            icon={Zap} 
            title="Predictive Dispatch" 
            desc="AI-driven manifest optimization that accounts for historical border crossing times and seasonal road conditions in the region."
          />
          <FeatureCard 
            icon={Globe} 
            title="Multi-Currency Settlements" 
            desc="Seamlessly handle KES, UGX, and RWF with real-time exchange rate integration and automated M-Pesa payouts."
          />
          <FeatureCard 
            icon={Network} 
            title="Offline-First Telemetry" 
            desc="Our mobile infrastructure buffers data in dead zones, ensuring no kilometer is untracked across remote transit routes."
          />
          <FeatureCard 
            icon={ShieldCheck} 
            title="Biometric Verification" 
            desc="Optional fingerprint or facial verification for high-value cargo handovers at secure facilities."
          />
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="bg-slate-900 text-white py-32 px-6 overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.2] pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2000" 
            alt="Cyber Security" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-accent/10 rounded-full blur-[100px]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <h2 className="mobile-h2 uppercase font-display">Enterprise <br /> <span className="text-brand-accent">Security Shield</span></h2>
              <p className="text-white/40 font-medium leading-relaxed">
                We maintain the highest standards of data sovereignty and protection, ensuring your operational intelligence remains private and secure.
              </p>
              <ul className="space-y-6">
                <SecurityPoint text="SOC2 Type II Compliant Infrastructure" />
                <SecurityPoint text="Regional Data Residency (KE-NBO-1)" />
                <SecurityPoint text="End-to-End Encrypted Telemetry Streams" />
                <SecurityPoint text="Automated Threat Detection & Mitigation" />
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="aspect-square bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex flex-col justify-between">
                <Lock className="text-brand-accent" size={32} />
                <p className="text-xs font-black uppercase tracking-widest text-white/40">Zero Trust Access</p>
              </div>
              <div className="aspect-square bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex flex-col justify-between mt-12">
                <ShieldCheck className="text-brand-teal" size={32} />
                <p className="text-xs font-black uppercase tracking-widest text-white/40">Audit Integrity</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 text-center max-w-7xl mx-auto">
        <h2 className="mobile-h2 uppercase font-display text-slate-900 mb-8">Ready to <span className="text-brand-accent">Upgrade</span> your Stack?</h2>
        <p className="text-slate-500 max-w-2xl mx-auto mb-16 font-medium">Join the regional leaders who have digitized their entire logistics infrastructure with ShipStack.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link to="/register" className="touch-btn sm:px-12 bg-brand text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-brand-accent transition-all">
            Deploy Now
          </Link>
          <Link to="/pricing" className="touch-btn sm:px-12 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:border-brand-accent transition-all">
            View Pricing
          </Link>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-brand rounded-xl flex items-center justify-center text-white">
              <Layers size={20} />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase font-display">Shipstack</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">&copy; 2025 Shipstack Technologies. KE-NBO-1</p>
        </div>
      </footer>
      <ScrollToTop />
    </div>
  );
};

const StatCard = ({ label, value, sub }: any) => (
  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{label}</p>
    <h3 className="text-4xl font-black text-slate-900 mb-2 font-display">{value}</h3>
    <p className="text-xs font-bold text-brand-accent">{sub}</p>
  </div>
);

const LayerItem = ({ icon: Icon, title, desc }: any) => (
  <div className="flex gap-6 group">
    <div className="h-12 w-12 shrink-0 bg-slate-50 text-brand rounded-xl flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
      <Icon size={24} />
    </div>
    <div className="space-y-2">
      <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">{title}</h4>
      <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc }: any) => (
  <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
    <div className="h-16 w-16 bg-slate-50 text-brand-accent rounded-2xl flex items-center justify-center mb-8 group-hover:bg-brand-accent group-hover:text-white transition-all">
      <Icon size={32} />
    </div>
    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-4 font-display">{title}</h3>
    <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
  </div>
);

const SecurityPoint = ({ text }: { text: string }) => (
  <li className="flex items-center gap-3 text-sm font-bold text-white/60">
    <CheckCircle2 size={18} className="text-brand-teal" />
    {text}
  </li>
);

export default InfrastructurePage;
