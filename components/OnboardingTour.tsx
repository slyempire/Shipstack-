
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  HelpCircle,
  Layers,
  Navigation,
  Activity,
  Zap,
  Truck,
  ShieldCheck,
  SkipForward,
} from 'lucide-react';
import ReactDOM from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';

interface TourStep {
  /** id of the DOM element the spotlight should anchor to (optional; missing -> centered tooltip). */
  targetId?: string;
  title: string;
  description: string;
  icon?: any;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Route to navigate to before the step renders. */
  path?: string;
}

// Plain-language tour. Steps map roughly to the core admin loop:
// fleet -> dispatch -> intelligence. Copy intentionally avoids jargon.
const steps: TourStep[] = [
  {
    title: 'Welcome to Shipstack',
    description:
      "Let's take a quick tour so you know where things live. You can skip any time and come back later.",
    icon: Layers,
    position: 'center',
  },
  {
    targetId: 'nav-fleet',
    title: 'Add your vehicles',
    description:
      "Start in Fleet — add the trucks, vans, or bikes you'll be dispatching. You can also register your warehouses and hubs here.",
    icon: Truck,
    position: 'right',
    path: '/admin',
  },
  {
    targetId: 'tour-checklist-0',
    title: 'Track your setup',
    description:
      "This checklist tells you what's left to do before you can start dispatching. Tick items off as you go.",
    icon: CheckCircle,
    position: 'top',
    path: '/admin',
  },
  {
    targetId: 'nav-dispatch',
    title: 'Plan your first run',
    description:
      'Dispatch is where you turn orders into routes. Once you have a vehicle and a delivery note, head here to batch them into a trip.',
    icon: Navigation,
    position: 'right',
    path: '/admin',
  },
  {
    targetId: 'tour-create-manifest',
    title: 'Create a route',
    description:
      "Click Create Route Manifest to open the wizard — it picks the order, maps the route, and assigns a driver in one place.",
    icon: Navigation,
    position: 'bottom',
    path: '/admin/dispatch',
  },
  {
    targetId: 'nav-intelligence',
    title: 'See how things are going',
    description:
      'Intelligence shows on-time delivery, where you are losing time, and forecasts upcoming volume. Check in here once a day.',
    icon: Activity,
    position: 'right',
    path: '/admin',
  },
  {
    title: "You're all set",
    description:
      "That's the core loop: vehicles → dispatch → insights. You can re-open this tour any time from the help button bottom-right.",
    icon: ShieldCheck,
    position: 'center',
  },
];

const STORAGE_KEY = 'shipstack_onboarding_complete';

/**
 * Wait for a DOM element to appear, retrying on a short interval. Resolves
 * with the element once found, or `null` when the timeout expires. Used to
 * survive the gap between react-router navigating to a route and the target
 * route's content actually mounting + populating its DOM ids.
 */
function waitForElement(id: string, timeoutMs = 2000, intervalMs = 100): Promise<HTMLElement | null> {
  return new Promise(resolve => {
    const start = Date.now();
    const tick = () => {
      const el = document.getElementById(id);
      if (el) return resolve(el);
      if (Date.now() - start >= timeoutMs) return resolve(null);
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

export const OnboardingTour: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  // True when a step declared a targetId but we couldn't find it in time;
  // surfaces a "Skip step" affordance instead of leaving the tour orphaned.
  const [anchorMissing, setAnchorMissing] = useState(false);
  // Token used to abort in-flight waitForElement calls when the user advances
  // before the previous step's DOM lookup finishes.
  const lookupToken = useRef(0);

  // Auto-trigger 1s after first mount for users who haven't seen the tour yet.
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => {
        setIsVisible(true);
        setActiveStep(0);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, []);

  // Step transitions: navigate first (if needed), then wait for the target
  // DOM id to appear, then anchor the spotlight. Depending on
  // `location.pathname` instead of `window.location.pathname` so the effect
  // re-runs on react-router navigations.
  useEffect(() => {
    if (activeStep === null) {
      setTargetRect(null);
      setAnchorMissing(false);
      return;
    }

    const step = steps[activeStep];
    const token = ++lookupToken.current;
    setAnchorMissing(false);

    if (step.path && location.pathname !== step.path) {
      navigate(step.path);
    }

    if (!step.targetId) {
      setTargetRect(null);
      return;
    }

    (async () => {
      const el = await waitForElement(step.targetId!);
      // Abort if the user advanced/closed while we were waiting.
      if (token !== lookupToken.current) return;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // One paint frame after scrollIntoView so the rect reflects the
        // post-scroll position rather than the pre-scroll one.
        requestAnimationFrame(() => {
          if (token === lookupToken.current) {
            setTargetRect(el.getBoundingClientRect());
          }
        });
      } else {
        setTargetRect(null);
        setAnchorMissing(true);
      }
    })();
  }, [activeStep, location.pathname, navigate]);

  // Keep the spotlight rect in sync with resize + scroll so it stays on the
  // anchor as the page reflows.
  useEffect(() => {
    const update = () => {
      if (activeStep === null) return;
      const id = steps[activeStep].targetId;
      if (!id) return;
      const el = document.getElementById(id);
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [activeStep]);

  const handleNext = () => {
    if (activeStep === null) return;
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (activeStep !== null && activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const completeTour = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    setActiveStep(null);
  };

  const relaunchTour = () => {
    setIsVisible(true);
    setActiveStep(0);
  };

  // Once dismissed, render a small "Show me around" affordance bottom-right
  // so users can re-open the tour without clearing localStorage by hand.
  if (!isVisible && localStorage.getItem(STORAGE_KEY)) {
    return (
      <button
        onClick={relaunchTour}
        className="fixed bottom-8 right-32 h-12 w-12 bg-white border border-slate-200 text-slate-400 rounded-full flex items-center justify-center shadow-xl hover:text-brand hover:border-brand transition-all z-40 group"
        aria-label="Show me around"
      >
        <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
        <div className="absolute bottom-full mb-3 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-y-2 group-hover:translate-y-0 shadow-2xl whitespace-nowrap">
          Show me around
        </div>
      </button>
    );
  }

  if (activeStep === null) return null;

  const currentStep = steps[activeStep];
  const Icon = currentStep.icon;

  const getTooltipPosition = (): React.CSSProperties => {
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
      {/* Dark overlay with spotlight hole around the anchor (if any). */}
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

            {/* Pulsing highlight ring around the spotlit target. */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.05, 1],
                borderColor: ['#0066FF', '#00FFFF', '#0066FF'],
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

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="absolute bg-white rounded-[2rem] shadow-2xl shadow-black/50 p-8 w-[320px] pointer-events-auto border border-slate-100 overflow-hidden"
          style={getTooltipPosition()}
        >
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
            <Icon size={160} className="text-brand" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-slate-900 text-brand rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                <Icon size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Step {activeStep + 1} of {steps.length}
                </span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none">Quick tour</span>
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3 leading-tight">
              {currentStep.title}
            </h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
              {currentStep.description}
            </p>

            {anchorMissing && (
              <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-700 leading-snug">
                We couldn&apos;t spotlight the thing this step refers to (it may not be on this page).
                Use Next to continue, or skip this step.
              </div>
            )}

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
                  aria-label="Previous step"
                >
                  <ChevronLeft size={18} />
                </button>
                {anchorMissing && (
                  <button
                    onClick={handleNext}
                    className="h-10 px-3 rounded-xl bg-slate-50 text-slate-500 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 hover:text-slate-900 transition-all"
                    title="Skip this step"
                  >
                    <SkipForward size={14} /> Skip
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all flex items-center gap-2 shadow-xl active:scale-95"
                >
                  {activeStep === steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={completeTour}
            className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors"
            aria-label="Close tour"
          >
            <X size={18} />
          </button>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={completeTour}
        className="absolute top-10 right-10 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20 transition-all pointer-events-auto"
      >
        Skip tour
      </button>
    </div>,
    document.body
  );
};
