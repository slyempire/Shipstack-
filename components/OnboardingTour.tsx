
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  CheckCircle, 
  HelpCircle,
  LayoutDashboard,
  Navigation,
  Activity,
  Layers,
  Settings,
  Zap,
  ArrowRight,
  Truck,
  ShieldCheck
} from 'lucide-react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';

interface TourStep {
  targetId?: string;
  title: string;
  description: string;
  icon?: any;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  path?: string;
}

const steps: TourStep[] = [
  {
    title: "Operational Command",
    description: "Welcome to Shipstack. Let's walk through an essential workflow: Dispatching your first fleet manifest.",
    icon: Layers,
    position: 'center'
  },
  {
    targetId: 'nav-fleet',
    title: "1. Asset Preparedness",
    description: "Workflow: Fleet Registration. First, digitize your vehicles and distribution hubs in 'Fleet & Premise management'.",
    icon: Truck,
    position: 'right',
    path: '/admin'
  },
  {
    targetId: 'tour-checklist-0',
    title: "Onboarding KPI",
    description: "Goal: Register 1st Vehicle. Use this checklist to track your setup. Completion marks your company as 'Dispatch Ready'.",
    icon: CheckCircle,
    position: 'top',
    path: '/admin'
  },
  {
    targetId: 'nav-dispatch',
    title: "2. The Dispatch Hub",
    description: "Workflow: Route Optimization. Once assets are live, navigate here to batch orders into optimized manifests.",
    icon: Navigation,
    position: 'right',
    path: '/admin'
  },
  {
    targetId: 'tour-create-manifest',
    title: "Execution: First Run",
    description: "Click 'Create Route Manifest' to launch the wizard. This combines orders, maps routes, and assigns drivers in one tool.",
    icon: Play,
    position: 'bottom',
    path: '/admin/dispatch'
  },
  {
    targetId: 'nav-intelligence',
    title: "3. Oversight & Scale",
    description: "Workflow: Performance Review. Use Intelligence to monitor delivery SLAs and predict future demand spikes.",
    icon: Zap,
    position: 'right',
    path: '/admin'
  },
  {
    title: "Deployment Ready",
    description: "You've mastered the core loop: Asset -> Dispatch -> Intel. You're now ready to process your first customer delivery.",
    icon: ShieldCheck,
    position: 'center'
  }
];

export const OnboardingTour: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const isComplete = localStorage.getItem('shipstack_onboarding_complete');
    if (!isComplete) {
      setTimeout(() => {
        setIsVisible(true);
        setActiveStep(0);
      }, 1000);
    }
  }, []);

  useEffect(() => {
    if (activeStep !== null) {
      const step = steps[activeStep];
      
      // Handle navigation if path is specified
      if (step.path && window.location.pathname !== step.path) {
        navigate(step.path);
        // Wait for navigation transition
        setTimeout(() => updateRect(step.targetId), 500);
      } else {
        updateRect(step.targetId);
      }
    } else {
      setTargetRect(null);
    }
  }, [activeStep, window.location.pathname]);

  const updateRect = (targetId?: string) => {
    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          setTargetRect(element.getBoundingClientRect());
        }, 300);
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  };

  // Update rect on resize or scroll
  useEffect(() => {
    const update = () => {
      if (activeStep !== null && steps[activeStep].targetId) {
        const element = document.getElementById(steps[activeStep].targetId!);
        if (element) setTargetRect(element.getBoundingClientRect());
      }
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [activeStep]);

  const handleNext = () => {
    if (activeStep !== null) {
      if (activeStep < steps.length - 1) {
        setActiveStep(activeStep + 1);
      } else {
        completeTour();
      }
    }
  };

  const handlePrev = () => {
    if (activeStep !== null && activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const completeTour = () => {
    localStorage.setItem('shipstack_onboarding_complete', 'true');
    setIsVisible(false);
    setActiveStep(null);
  };

  const relaunchTour = () => {
    setIsVisible(true);
    setActiveStep(0);
  };

  if (!isVisible && localStorage.getItem('shipstack_onboarding_complete')) {
    return (
      <button 
        onClick={relaunchTour}
        className="fixed bottom-8 right-32 h-12 w-12 bg-white border border-slate-200 text-slate-400 rounded-full flex items-center justify-center shadow-xl hover:text-brand hover:border-brand transition-all z-40 group"
      >
        <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
        <div className="absolute bottom-full mb-3 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-y-2 group-hover:translate-y-0 shadow-2xl">
          Relaunch Tour
        </div>
      </button>
    );
  }

  if (activeStep === null) return null;

  const currentStep = steps[activeStep];
  const Icon = currentStep.icon;

  const spotlightStyle = targetRect ? {
    width: targetRect.width + 16,
    height: targetRect.height + 16,
    top: targetRect.top - 8,
    left: targetRect.left - 8,
    borderRadius: '12px'
  } : null;

  // Render tooltip position
  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const padding = 24;
    switch (currentStep.position) {
      case 'right':
        return { top: targetRect.top + targetRect.height / 2, left: targetRect.right + padding, transform: 'translateY(-50%)' };
      case 'left':
        return { top: targetRect.top + targetRect.height / 2, right: window.innerWidth - targetRect.left + padding, transform: 'translateY(-50%)' };
      case 'bottom':
        return { top: targetRect.bottom + padding, left: targetRect.left + targetRect.width / 2, transform: 'translateX(-50%)' };
      case 'top':
        return { bottom: window.innerHeight - targetRect.top + padding, left: targetRect.left + targetRect.width / 2, transform: 'translateX(-50%)' };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[6000] pointer-events-none">
      {/* Dark Overlay with Hole */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] transition-all duration-500 pointer-events-auto">
        {targetRect && (
          <>
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <mask id="spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect 
                    x={targetRect.left - 12} 
                    y={targetRect.top - 12} 
                    width={targetRect.width + 24} 
                    height={targetRect.height + 24} 
                    rx="16" 
                    ry="16" 
                    fill="black" 
                  />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0)" mask="url(#spotlight-mask)" />
            </svg>

            {/* Pulsing Ring Highlight */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0.5, 1, 0.5], 
                scale: [1, 1.05, 1],
                borderColor: ['#0066FF', '#00FFFF', '#0066FF']
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute border-4 rounded-[1.25rem] shadow-[0_0_30px_rgba(0,102,255,0.6)] z-[6001] pointer-events-none"
              style={{
                width: targetRect.width + 24,
                height: targetRect.height + 24,
                top: targetRect.top - 12,
                left: targetRect.left - 12,
              }}
            />
          </>
        )}
      </div>

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeStep}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="absolute bg-white rounded-[2rem] shadow-2xl shadow-black/50 p-8 w-[320px] pointer-events-auto border border-slate-100 overflow-hidden"
          style={getTooltipPosition()}
        >
          {/* Animated Background Pulse for Spotlight effect in tooltip icon */}
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
            <Icon size={160} className="text-brand" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-slate-900 text-brand rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                <Icon size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pillar {activeStep + 1}</span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none">Intelligence Tour</span>
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-3 leading-none">
              {currentStep.title}
            </h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
              {currentStep.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-300 ${i === activeStep ? 'w-6 bg-brand' : 'w-1.5 bg-slate-100'}`} 
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrev}
                  disabled={activeStep === 0}
                  className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-0 disabled:pointer-events-none"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all flex items-center gap-2 shadow-xl active:scale-95"
                >
                  {activeStep === steps.length - 1 ? 'Deploy' : 'Next'} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={completeTour}
            className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors"
          >
            <X size={18} />
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Skip Button */}
      <button 
        onClick={completeTour}
        className="absolute top-10 right-10 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20 transition-all pointer-events-auto"
      >
        Skip Intelligence Briefing
      </button>
    </div>,
    document.body
  );
};
