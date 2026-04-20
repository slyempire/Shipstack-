
import React from 'react';
import MarketingLayout from '../../components/marketing/MarketingLayout';
import { 
  Layers, 
  Truck, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Package, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Info,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const StyleGuide: React.FC = () => {
  return (
    <MarketingLayout>
      <div className="container-responsive py-24">
        <header className="mb-20">
          <div className="inline-flex items-center gap-2 bg-brand/5 border border-brand/10 px-4 py-2 rounded-full mb-6">
            <Layers size={14} className="text-brand" />
            <span className="label-mono !text-brand">Design System</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6">
            Shipstack <br />
            <span className="text-brand-accent">Style Guide.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl font-medium">
            The visual language of professional logistics. A tactical, high-performance design system built for the African trade corridor.
          </p>
        </header>

        <section className="mb-24">
          <h2 className="text-2xl font-black uppercase tracking-widest mb-10 border-b border-line pb-4">Typography</h2>
          <div className="grid gap-12">
            <div>
              <p className="label-mono mb-4">Display - Space Grotesk</p>
              <h1 className="text-7xl font-black uppercase tracking-tighter">The Quick Brown Fox</h1>
              <h2 className="text-5xl font-black uppercase tracking-tighter mt-4">Jumps Over The Lazy Dog</h2>
            </div>
            <div>
              <p className="label-mono mb-4">Sans - Inter</p>
              <p className="text-4xl font-bold">The quick brown fox jumps over the lazy dog.</p>
              <p className="text-xl mt-4 text-slate-500">
                Inter is a variable font family carefully crafted & designed for computer screens.
              </p>
            </div>
            <div>
              <p className="label-mono mb-4">Mono - JetBrains Mono</p>
              <p className="font-mono text-2xl">const shipstack = "Logistics OS";</p>
              <p className="font-mono text-sm mt-2 text-slate-400 uppercase tracking-widest">
                Tactical data visualization & telemetry
              </p>
            </div>
            <div>
              <p className="label-mono mb-4">Serif - Cormorant Garamond (Accents)</p>
              <p className="font-serif italic text-4xl">Refined logistics for a modern continent.</p>
            </div>
          </div>
        </section>

        <section className="mb-24">
          <h2 className="text-2xl font-black uppercase tracking-widest mb-10 border-b border-line pb-4">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <ColorCard name="Brand Primary" hex="#0F172A" className="bg-brand text-white" />
            <ColorCard name="Brand Accent" hex="#3B82F6" className="bg-brand-accent text-white" />
            <ColorCard name="Brand Teal" hex="#1FB6A6" className="bg-brand-teal text-white" />
            <ColorCard name="Eggshell" hex="#FBFBF9" className="bg-eggshell border border-line" />
            <ColorCard name="Ink" hex="#0F172A" className="bg-ink text-white" />
            <ColorCard name="Muted" hex="#64748B" className="bg-muted text-white" />
          </div>
        </section>

        <section className="mb-24">
          <h2 className="text-2xl font-black uppercase tracking-widest mb-10 border-b border-line pb-4">Components</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <p className="label-mono">Buttons</p>
              <div className="flex flex-wrap gap-4">
                <button className="btn-tactical bg-brand text-white shadow-xl shadow-brand/20">
                  Primary Action
                </button>
                <button className="btn-tactical bg-brand-accent text-white shadow-xl shadow-brand-accent/20">
                  Accent Action
                </button>
                <button className="btn-tactical bg-white border border-line text-ink hover:bg-slate-50">
                  Secondary Action
                </button>
                <button className="btn-tactical bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle size={14} /> Success
                </button>
              </div>
              
              <p className="label-mono">Badges</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest border border-blue-100">In Transit</span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">Delivered</span>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100">Pending</span>
                <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest border border-rose-100">Exception</span>
              </div>
            </div>

            <div className="space-y-8">
              <p className="label-mono">Cards</p>
              <div className="card-tactical">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 bg-brand/5 text-brand rounded-2xl flex items-center justify-center">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight">Fleet Asset</h4>
                    <p className="label-mono !text-slate-400">KCD 452L • Active</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                  Real-time telemetry and route optimization for long-haul corridors.
                </p>
                <div className="pt-6 border-t border-line flex justify-between items-center">
                  <span className="label-mono">Health: 98%</span>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-24">
          <h2 className="text-2xl font-black uppercase tracking-widest mb-10 border-b border-line pb-4">Interactive Elements</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-10 rounded-[3rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={80} fill="currentColor" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-4">Hover Motion</h3>
              <p className="text-sm text-white/60 font-medium">
                Subtle vertical translation and opacity shifts signal interactivity.
              </p>
            </motion.div>

            <div className="p-10 rounded-[3rem] bg-white border border-line shadow-xl flex flex-col justify-center items-center text-center">
              <div className="h-16 w-16 rounded-full bg-brand text-white flex items-center justify-center mb-6 animate-float">
                <Globe size={32} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Floating Animation</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Visual Rhythm</p>
            </div>

            <div className="p-10 rounded-[3rem] bg-brand-accent text-white shadow-2xl flex flex-col justify-between">
              <Activity size={40} className="mb-8" />
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Vibrant Accents</h3>
                <p className="text-sm text-white/80 font-medium">
                  High-contrast colors for critical system feedback.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tactical Components */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-12 w-12 rounded-2xl bg-brand text-white flex items-center justify-center shadow-xl shadow-brand/20">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Tactical Components</h2>
              <p className="text-slate-400 font-medium">Specialized UI elements for high-density data and operational workflows.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Stat Card */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stat Card</p>
              <div className="card-tactical flex flex-col justify-between group">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 rounded-2xl transition-all group-hover:scale-110 shadow-sm bg-blue-50 text-blue-600">
                    <Activity size={24} />
                  </div>
                  <div className="text-right">
                    <p className="label-mono mb-2">Network Health</p>
                    <h3 className="text-4xl font-black text-ink tracking-tighter leading-none">98.4%</h3>
                  </div>
                </div>
                <div className="pt-6 border-t border-line flex items-center gap-2">
                  <span className="label-mono !text-slate-300">+2.4% from baseline</span>
                </div>
              </div>
            </div>

            {/* Checklist Item */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Checklist Item</p>
              <div className="p-8 rounded-[2rem] border bg-white border-line hover:border-brand-accent/30 hover:shadow-xl hover:-translate-y-1 transition-all text-left group flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-brand group-hover:text-white transition-all shadow-sm">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-100 group-hover:border-brand-accent/30 transition-all" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-tight mb-2 text-ink">Identity Verification</h4>
                <p className="text-[11px] font-medium leading-relaxed text-slate-400">Upload national ID and driver license for system audit.</p>
              </div>
            </div>

            {/* Data Badge */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Badges</p>
              <div className="bg-white p-8 rounded-[2rem] border border-line flex flex-wrap gap-4">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">Active</span>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100">Pending</span>
                <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest border border-rose-100">Critical</span>
                <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-100">Offline</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};

const ColorCard = ({ name, hex, className }: { name: string, hex: string, className: string }) => (
  <div className="flex flex-col gap-3">
    <div className={`aspect-square rounded-3xl flex items-end p-4 ${className}`}>
      <span className="text-[10px] font-black uppercase tracking-widest">{name}</span>
    </div>
    <p className="label-mono !text-slate-400">{hex}</p>
  </div>
);

export default StyleGuide;
