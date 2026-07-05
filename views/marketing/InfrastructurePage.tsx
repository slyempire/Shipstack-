
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

      {/* Hero Section (v2: dark + full-bleed network photo + bottom-left headline + stat bar) */}
      <header className="relative bg-[#0B0E16] overflow-hidden flex flex-col">
        <div className="relative h-[70vh] min-h-[560px]">
          <img
            src="https://images.unsplash.com/photo-1549194388-f61be84a6e9e?q=80&w=2600&auto=format&fit=crop"
            alt="Global logistics network"
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E16] via-[#0B0E16]/70 to-[#0B0E16]/20" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0B0E16]/80 to-transparent" />

          <div className="relative h-full max-w-7xl mx-auto px-8 md:px-16 lg:px-24 flex flex-col justify-between pt-32 pb-16">
            <div className="self-start inline-flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
              <Server size={14} className="text-brand" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">Built for scale</span>
            </div>

            <div className="max-w-3xl lg:ml-12 xl:ml-20">
              <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-white tracking-tight leading-[0.95] mb-8 uppercase">
                Built for <br /> <span className="text-brand">scale.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 font-medium leading-relaxed max-w-2xl">
                Shipstack isn't just a dashboard. It's a platform built to handle the complexities of African supply chains.
              </p>
            </div>
          </div>
        </div>

        {/* Stat bar */}
        <div className="border-t border-white/5 bg-[#1A1F2E]">
          <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
              <div className="py-10 px-6 md:px-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 mb-3">Uptime SLA</p>
                <p className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-2">99.99%</p>
                <p className="text-xs font-medium text-brand">Built for production</p>
              </div>
              <div className="py-10 px-6 md:px-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 mb-3">Latency</p>
                <p className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-2">&lt;25 ms</p>
                <p className="text-xs font-medium text-brand">Regional edge servers</p>
              </div>
              <div className="py-10 px-6 md:px-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 mb-3">Data encryption</p>
                <p className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-2">AES-256</p>
                <p className="text-xs font-medium text-brand">Bank-grade security</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Core Infrastructure Layers */}
      <section className="bg-white py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2 space-y-12">
              <div className="space-y-6">
                <h2 className="mobile-h2 uppercase font-display text-slate-900">How it&rsquo;s <span className="text-brand-teal">built.</span></h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Built on a multi-layered architecture that keeps your data safe from the driver's phone all the way to your dashboard.
                </p>
              </div>

              <div className="space-y-8">
                <LayerItem
                  icon={Cloud}
                  title="Regional edge servers"
                  desc="Servers in Nairobi, Mombasa, and Kampala mean fast response times even on slow networks."
                />
                <LayerItem
                  icon={Database}
                  title="Audit log"
                  desc="Every manifest, delivery note, and payment is logged for full, KRA-compliant traceability."
                />
                <LayerItem
                  icon={Lock}
                  title="Role-based access"
                  desc="Drivers, dispatchers, and facility managers only see the data they need."
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
          <h2 className="mobile-h2 uppercase font-display text-slate-900">What sets us <span className="text-brand-accent">apart.</span></h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">Built for the specific demands of African logistics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <FeatureCard
            icon={Zap}
            title="Smart dispatch"
            desc="AI-powered route planning that factors in border crossing times and seasonal road conditions."
          />
          <FeatureCard
            icon={Globe}
            title="Multi-currency payouts"
            desc="Pay in KES, UGX, or RWF with live exchange rates and M-Pesa payouts."
          />
          <FeatureCard
            icon={Network}
            title="Works offline"
            desc="Buffers GPS data in dead zones so no trip goes untracked, even on remote routes."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Biometric verification"
            desc="Optional fingerprint or face verification for high-value cargo handovers."
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
              <h2 className="mobile-h2 uppercase font-display">Bank-grade <br /> <span className="text-brand-accent">security.</span></h2>
              <p className="text-white/40 font-medium leading-relaxed">
                We hold your data to the highest security standards. Your operations stay private and protected.
              </p>
              <ul className="space-y-6">
                <SecurityPoint text="SOC2 Type II compliant infrastructure" />
                <SecurityPoint text="Regional data residency (Kenya)" />
                <SecurityPoint text="End-to-end encrypted data streams" />
                <SecurityPoint text="Automated threat detection" />
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

      {/* Final CTA Section */}
      <section className="relative py-48 overflow-hidden bg-slate-900 border-y border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2600&auto=format&fit=crop" 
            alt="Infrastructure Lab" 
            className="w-full h-full object-cover opacity-60 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-900/40" />
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-12 leading-none">
            Want to <br/><span className="text-brand">scale?</span>
          </h2>
          <p className="text-xl md:text-3xl text-slate-400 font-bold uppercase tracking-tight mb-16 leading-tight">
            Join our pilot and help build the most resilient <br className="hidden md:block" /> logistics platform in Africa.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/register" className="bg-brand hover:bg-brand-orange-dark text-white px-16 py-8 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all text-center">
              Apply for pilot
            </Link>
            <Link to="/pricing" className="bg-white/5 border-2 border-white/10 text-white px-16 py-8 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all text-center">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-100 py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-slate-950 rounded-xl flex items-center justify-center text-white">
              <Layers size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase font-display">Shipstack</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            &copy; 2025 Shipstack and <a href="https://murzaktech.com" target="_blank" rel="noopener noreferrer" className="text-slate-900 hover:text-brand">Murzak Technologies</a>. Built in Africa.
          </p>
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
