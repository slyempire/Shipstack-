import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X, ArrowRight, ArrowLeft, Rocket, LayoutDashboard,
  PackagePlus, MapPin, Headphones, Sparkles, Check, ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../store';

interface TutorialStep {
  icon: React.ElementType;
  color: string;
  title: string;
  body: string;
  tip?: string;
  route?: string;        // navigate here when user clicks "Show me"
  actionLabel?: string;  // label for the "take me there" button
}

const STEPS_BY_ROLE: Record<string, TutorialStep[]> = {
  DRIVER: [
    {
      icon: Rocket,
      color: 'bg-brand',
      title: "Welcome to Shipstack!",
      body: "Your delivery hub is ready. Let's take 60 seconds to show you exactly where everything lives.",
      tip: "You can skip this tour anytime — tap the X above."
    },
    {
      icon: LayoutDashboard,
      color: 'bg-blue-600',
      title: "Your Delivery Hub",
      body: "All your assigned deliveries for the day live here. Tap any delivery to see the full details: address, customer name, and special instructions.",
      tip: "Your manifest updates automatically — no need to refresh.",
      route: '/driver',
      actionLabel: 'Open My Deliveries'
    },
    {
      icon: MapPin,
      color: 'bg-emerald-600',
      title: "Navigate to Deliveries",
      body: "Tap 'Start Delivery' on any order to get turn-by-turn directions. The app tracks your progress and auto-notifies the customer when you're close.",
      tip: "Works offline too — great for areas with spotty signal.",
      route: '/driver',
      actionLabel: 'See My Route'
    },
    {
      icon: PackagePlus,
      color: 'bg-amber-600',
      title: "Confirm Each Drop-off",
      body: "When you arrive, collect a signature or photo as proof of delivery. This protects you and closes the delivery automatically.",
      tip: "Photos and signatures are tamper-proof and stored securely.",
      route: '/driver',
      actionLabel: 'Try It Now'
    },
    {
      icon: Headphones,
      color: 'bg-purple-600',
      title: "Help & Support",
      body: "Tap the Driver Hub for settings, emergency SOS, call dispatch, and offline maps. Everything you need is one tap away.",
      tip: "In an emergency, use the SOS button in the support section.",
      route: '/driver/hub',
      actionLabel: 'Open Driver Hub'
    }
  ],

  CLIENT: [
    {
      icon: Rocket,
      color: 'bg-brand',
      title: "Welcome to Shipstack!",
      body: "Your account is live. Book deliveries, track shipments in real time, and keep your customers automatically updated.",
      tip: "You can skip this tour anytime — tap the X above."
    },
    {
      icon: LayoutDashboard,
      color: 'bg-blue-600',
      title: "Your Shipment Dashboard",
      body: "Every delivery you've booked — active, completed, or pending — is right here. One glance tells you the status of every shipment.",
      tip: "Click any shipment to see the full timeline and live location.",
      route: '/client',
      actionLabel: 'Open Dashboard'
    },
    {
      icon: PackagePlus,
      color: 'bg-emerald-600',
      title: "Book a Delivery in Seconds",
      body: "Click 'New Delivery', enter the pickup and drop-off details, and a driver gets assigned automatically. Done in under 2 minutes.",
      tip: "You can schedule in advance or book for right now.",
      route: '/client',
      actionLabel: 'Book First Delivery'
    },
    {
      icon: MapPin,
      color: 'bg-amber-600',
      title: "Track It Live",
      body: "Watch your delivery move on a live map. Your customers automatically get SMS updates — no phone calls needed.",
      tip: "Share the tracking link with your customer directly from the app.",
      route: '/client',
      actionLabel: 'See Live Map'
    },
    {
      icon: Headphones,
      color: 'bg-purple-600',
      title: "We're Always Here",
      body: "Questions? Use the in-app help guide or reach our support team via WhatsApp 24/7 in English, Swahili, or French.",
    }
  ],

  DEFAULT: [
    {
      icon: Rocket,
      color: 'bg-brand',
      title: "Welcome to Shipstack!",
      body: "Your logistics command center is live. Let's walk through the key things you'll use every day — takes under 2 minutes.",
      tip: "You can skip this tour anytime — tap the X above."
    },
    {
      icon: LayoutDashboard,
      color: 'bg-blue-600',
      title: "Operations Dashboard",
      body: "Live deliveries, driver locations, fleet status, and performance metrics — all updating in real time without a page refresh.",
      tip: "Use the sidebar to switch between dispatch, fleet, analytics, and more.",
      route: '/admin',
      actionLabel: 'Open Dashboard'
    },
    {
      icon: PackagePlus,
      color: 'bg-emerald-600',
      title: "Create Your First Delivery",
      body: "Click the + button in the Delivery Queue to create a delivery note. Add the customer, address, and items — the system finds the best driver automatically.",
      tip: "You can also import deliveries in bulk via CSV or API.",
      route: '/admin/queue',
      actionLabel: 'Open Delivery Queue'
    },
    {
      icon: MapPin,
      color: 'bg-amber-600',
      title: "Live Tracking",
      body: "Watch every driver and delivery move on a live map. Spot delays before they become problems and reroute drivers instantly.",
      tip: "Set up automatic SLA alerts for late deliveries in Settings.",
      route: '/admin/tracking',
      actionLabel: 'Open Live Map'
    },
    {
      icon: Headphones,
      color: 'bg-purple-600',
      title: "You're All Set!",
      body: "Our support team is available 24/7 via WhatsApp, email, or phone. The in-app help guide answers most questions instantly.",
      tip: "Explore Analytics to see your team's performance at a glance.",
      route: '/admin/analytics',
      actionLabel: 'See Analytics'
    }
  ]
};

interface WelcomeTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TUTORIAL_STORAGE_KEY = 'shipstack_tutorial_seen';

export const WelcomeTutorial: React.FC<WelcomeTutorialProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const role = user?.role?.toUpperCase() || 'DEFAULT';
  const steps = STEPS_BY_ROLE[role] ?? STEPS_BY_ROLE.DEFAULT;
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  const handleClose = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      setDone(true);
      setTimeout(() => {
        localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
        onClose();
      }, 1500);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleShowMe = () => {
    if (current.route) {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      onClose();
      navigate(current.route);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-2xl"
        >
          {/* Progress bar */}
          <div className="h-1 bg-slate-100">
            <motion.div
              className="h-full bg-brand"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>

          {/* Skip */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all z-10"
            aria-label="Skip tutorial"
          >
            <X size={18} />
          </button>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="text-center py-6 space-y-4"
                >
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                    className="w-20 h-20 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-200"
                  >
                    <Check size={40} strokeWidth={3} />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">You're Ready!</h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">Taking you to your dashboard...</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Step counter */}
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Step {step + 1} of {steps.length}
                  </p>

                  {/* Icon */}
                  <div className={`w-14 h-14 ${current.color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                    <current.icon size={26} />
                  </div>

                  {/* Content */}
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight mb-2">
                      {current.title}
                    </h2>
                    <p className="text-slate-600 font-medium leading-relaxed text-sm">
                      {current.body}
                    </p>
                  </div>

                  {/* Tip */}
                  {current.tip && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold text-amber-700 leading-relaxed">{current.tip}</p>
                    </div>
                  )}

                  {/* "Take me there" action */}
                  {current.route && (
                    <button
                      onClick={handleShowMe}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                    >
                      <ExternalLink size={13} />
                      {current.actionLabel ?? 'Show Me'}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nav */}
          {!done && (
            <div className="px-8 pb-8 flex items-center justify-between">
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 text-slate-400 hover:text-slate-700 disabled:opacity-0 disabled:pointer-events-none transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <ArrowLeft size={14} /> Back
              </button>

              {/* Dots */}
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`rounded-full transition-all ${i === step ? 'w-5 h-2 bg-brand' : 'w-2 h-2 bg-slate-200 hover:bg-slate-300'}`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-colors active:scale-95"
              >
                {isLast ? <><Check size={13} strokeWidth={3} /> Done</> : <>Next <ArrowRight size={13} /></>}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WelcomeTutorial;
