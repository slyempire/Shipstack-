
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Lightbulb, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Zap, 
  Target, 
  Info,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../store';
import { SystemRole } from '../types';

interface GuideStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  targetedTo?: SystemRole[];
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: "RBAC Governance",
    description: "Your platform now operates on high-fidelity granular permissions. Monitor the 'Security Clearance' badge in your profile for your current operational tier.",
    icon: <ShieldCheck className="text-emerald-500" />,
    targetedTo: ['super_admin', 'tenant_admin']
  },
  {
    title: "Vertical Intelligence",
    description: "The Marketplace isn't just a store—it's your growth engine. Inject industry-specific logic like Healthcare Pharamceuticals or Cold Chain directly into your stack.",
    icon: <Target className="text-brand" />,
  },
  {
    title: "Cortex Deployment",
    description: "Operational insights are now evidence-backed. Look for the 'AI-assisted' label on recommendations to see the underlying ML logic.",
    icon: <Zap className="text-amber-500" />,
    targetedTo: ['operations_manager', 'dispatcher']
  },
  {
    title: "Audit Transparency",
    description: "Every significant action—from module installs to role changes—is logged with sub-second precision in the Security Audit terminal.",
    icon: <Info className="text-slate-400" />,
  }
];

interface FeatureGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeatureGuide: React.FC<FeatureGuideProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { currentUserRole } = useAuthStore();

  const filteredSteps = GUIDE_STEPS.filter(step => 
    !step.targetedTo || step.targetedTo.includes(currentUserRole)
  );

  const nextStep = () => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="w-full max-w-lg bg-white rounded-[3rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => onClose()}
                className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-12">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center">
                       <Lightbulb size={20} className="text-yellow-500" />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Intelligence Briefing</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                          Step {currentStep + 1} of {filteredSteps.length}
                       </p>
                    </div>
                 </div>

                 <AnimatePresence mode="wait">
                    <motion.div 
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6 min-h-[160px]"
                    >
                       <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                          {filteredSteps[currentStep].icon}
                       </div>
                       <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                          {filteredSteps[currentStep].title}
                       </h4>
                       <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          {filteredSteps[currentStep].description}
                       </p>
                    </motion.div>
                 </AnimatePresence>

                 <div className="mt-12 flex items-center justify-between">
                    <div className="flex gap-2">
                       {filteredSteps.map((_, i) => (
                         <div 
                           key={i} 
                           className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-8 bg-brand' : 'w-2 bg-slate-100'}`}
                         />
                       ))}
                    </div>
                    
                    <div className="flex gap-3">
                       <button 
                         onClick={prevStep}
                         disabled={currentStep === 0}
                         className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-all"
                       >
                         <ChevronLeft size={20} />
                       </button>
                       <button 
                         onClick={nextStep}
                         className="px-8 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all"
                       >
                         {currentStep === filteredSteps.length - 1 ? 'Get Started' : 'Next Intelligence'} <ArrowRight size={14} />
                       </button>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-50 px-12 py-6 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                 <span>Operational Guide v4.0</span>
                 <span className="text-brand">Confidential Ops Only</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

export default FeatureGuide;
