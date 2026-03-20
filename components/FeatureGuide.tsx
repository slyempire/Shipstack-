
import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Layers, 
  Truck, 
  Map as MapIcon, 
  Package, 
  ShieldCheck, 
  Zap,
  LayoutDashboard,
  Route as RouteIcon,
  DatabaseZap,
  FileText,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GuideStep {
  title: string;
  desc: string;
  icon: any;
  color: string;
  features: string[];
}

const guideSteps: GuideStep[] = [
  {
    title: "Operational Command",
    desc: "The central nervous system of your logistics fleet. Monitor global health and mission status from a single pane of glass.",
    icon: LayoutDashboard,
    color: "bg-blue-500",
    features: ["Real-time KPI tracking", "Fleet status overview", "Revenue & Volume analytics"]
  },
  {
    title: "Operations Hub",
    desc: "Manage the lifecycle of delivery notes. From initial receipt to final dispatch, this is where cargo meets movement.",
    icon: Package,
    color: "bg-brand",
    features: ["Delivery Note queue", "Bulk order processing", "Status management"]
  },
  {
    title: "Dispatch Workspace",
    desc: "The tactical engine. Consolidate orders into optimized runs, assign pilots, and initialize vehicle missions.",
    icon: RouteIcon,
    color: "bg-brand-accent",
    features: ["Route optimization", "Vehicle & Pilot assignment", "Run manifest generation"]
  },
  {
    title: "Live Tracking",
    desc: "Street-level telemetry. Watch your fleet move across the East African corridor with audited GPS precision.",
    icon: MapIcon,
    color: "bg-emerald-500",
    features: ["Real-time GPS tracking", "ETA calculations", "Geofence alerts"]
  },
  {
    title: "Commercial Hub",
    desc: "Automate the financial layer. Generate invoices, manage rate profiles, and settle accounts with industrial clarity.",
    icon: FileText,
    color: "bg-amber-500",
    features: ["Automated invoicing", "Custom rate profiles", "Financial reporting"]
  }
];

interface FeatureGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeatureGuide: React.FC<FeatureGuideProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = guideSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand/40 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-brand leading-none mb-1">Platform Guide</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Step {currentStep + 1} of {guideSteps.length}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 sm:p-12">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
            >
              <div className="flex flex-col items-center text-center">
                <div className={`h-24 w-24 ${step.color} text-white rounded-[2rem] flex items-center justify-center shadow-2xl mb-8`}>
                  <Icon size={48} strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">{step.title}</h2>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md">{step.desc}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {step.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className={`h-2 w-2 rounded-full ${step.color}`} />
                    <span className="text-[11px] font-black uppercase tracking-tight text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex gap-2">
            {guideSteps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? `w-8 ${step.color}` : 'w-2 bg-slate-200'}`} 
              />
            ))}
          </div>
          
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all flex items-center gap-2"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
            
            <button 
              onClick={() => {
                if (currentStep < guideSteps.length - 1) {
                  setCurrentStep(prev => prev + 1);
                } else {
                  onClose();
                }
              }}
              className={`px-8 py-3 rounded-xl ${step.color} text-white font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2`}
            >
              {currentStep === guideSteps.length - 1 ? "Get Started" : "Next Pillar"} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FeatureGuide;
