import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowRight, ArrowLeft, Rocket, LayoutDashboard,
  PackagePlus, MapPin, Headphones, Sparkles, Check
} from 'lucide-react';
import { useAuthStore } from '../store';

interface TutorialStep {
  icon: React.ElementType;
  color: string;
  title: string;
  body: string;
  tip?: string;
}

const STEPS_BY_ROLE: Record<string, TutorialStep[]> = {
  DRIVER: [
    {
      icon: Rocket,
      color: 'bg-brand',
      title: "Welcome to Shipstack!",
      body: "You're all set up. Your delivery hub is ready and waiting. Let's take 60 seconds to show you the ropes.",
      tip: "You can skip this tour anytime — just tap the X above."
    },
    {
      icon: LayoutDashboard,
      color: 'bg-blue-600',
      title: "Your Delivery Hub",
      body: "When you open the app, you'll see your assigned deliveries for the day. Tap any delivery to see the full details: address, customer name, and instructions.",
      tip: "Your manifest updates automatically — no need to refresh."
    },
    {
      icon: MapPin,
      color: 'bg-emerald-600',
      title: "Navigate to Deliveries",
      body: "Tap 'Start Delivery' to get turn-by-turn directions. The app tracks your progress and notifies the customer automatically when you're nearby.",
      tip: "Works offline too — great for areas with spotty signal."
    },
    {
      icon: PackagePlus,
      color: 'bg-amber-600',
      title: "Confirm Each Drop-off",
      body: "When you arrive, collect a signature or photo from the customer as proof of delivery. This protects you and keeps everyone accountable.",
      tip: "Photos and signatures are stored securely and can't be altered."
    },
    {
      icon: Headphones,
      color: 'bg-purple-600',
      title: "Need Help? We're Here.",
      body: "Tap the Help button in the Driver Hub any time. You can also call dispatch directly from the app — your team is always a tap away.",
      tip: "In an emergency, use the SOS button in the support section."
    }
  ],
  CLIENT: [
    {
      icon: Rocket,
      color: 'bg-brand',
      title: "Welcome to Shipstack!",
      body: "Your account is ready. You can now book deliveries, track shipments live, and get automatic updates — all in one place.",
      tip: "You can skip this tour anytime — just tap the X above."
    },
    {
      icon: LayoutDashboard,
      color: 'bg-blue-600',
      title: "Your Shipment Dashboard",
      body: "Your dashboard shows every delivery you've booked — active, completed, or pending. At a glance, you'll know the status of every shipment.",
      tip: "Click any shipment to see the full timeline and live location."
    },
    {
      icon: PackagePlus,
      color: 'bg-emerald-600',
      title: "Book a Delivery in Seconds",
      body: "Click 'New Delivery', enter the pickup and drop-off address, and add what's being delivered. A driver will be assigned and on their way.",
      tip: "You can schedule deliveries in advance or book for right now."
    },
    {
      icon: MapPin,
      color: 'bg-amber-600',
      title: "Track it Live",
      body: "Once your delivery is on the way, you can watch it move on a live map. Your customers also get automatic SMS updates — no need to call.",
      tip: "Share the tracking link with your customer directly from the app."
    },
    {
      icon: Headphones,
      color: 'bg-purple-600',
      title: "We're Always Here",
      body: "Questions? Use the in-app help guide or reach our support team via WhatsApp 24/7. We're available in English, Swahili, and French.",
    }
  ],
  DEFAULT: [
    {
      icon: Rocket,
      color: 'bg-brand',
      title: "Welcome to Shipstack!",
      body: "Your logistics command center is live. Let's take 2 minutes to show you the key things you'll use every day.",
      tip: "You can skip this tour anytime — just tap the X above."
    },
    {
      icon: LayoutDashboard,
      color: 'bg-blue-600',
      title: "Your Operations Dashboard",
      body: "Everything in one view: live deliveries, driver locations, fleet status, and performance metrics. Your command center updates in real time.",
      tip: "Use the sidebar to switch between different operational views."
    },
    {
      icon: PackagePlus,
      color: 'bg-emerald-600',
      title: "Creating a Delivery",
      body: "Click the + button to create a new delivery note. Enter the customer, address, and items. The system will automatically find the best available driver.",
      tip: "You can also import deliveries in bulk via CSV or API."
    },
    {
      icon: MapPin,
      color: 'bg-amber-600',
      title: "Live Tracking",
      body: "Watch every driver and delivery on a live map. Spot delays before they become problems and reroute drivers instantly when needed.",
      tip: "Set up automatic alerts for late deliveries in your settings."
    },
    {
      icon: Headphones,
      color: 'bg-purple-600',
      title: "You're All Set!",
      body: "Explore at your own pace. Our support team is available 24/7 via WhatsApp, email, or phone — and the in-app help guide answers most questions instantly.",
      tip: "Check out the 'Platform Pillars' guide in the Help section for a deeper dive."
    }
  ]
};

interface WelcomeTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'shipstack_tutorial_seen';

export const WelcomeTutorial: React.FC<WelcomeTutorialProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const { user } = useAuthStore();

  const role = user?.role?.toUpperCase() || 'DEFAULT';
  const steps = STEPS_BY_ROLE[role] ?? STEPS_BY_ROLE.DEFAULT;
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      setDone(true);
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, 'true');
        onClose();
      }, 1800);
    } else {
      setStep(s => s + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative"
        >
          {/* Progress bar */}
          <div className="h-1 bg-slate-100">
            <motion.div
              className="h-full bg-brand"
              initial={{ width: `${(step / steps.length) * 100}%` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Skip button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all z-10"
            aria-label="Skip tutorial"
          >
            <X size={18} />
          </button>

          <div className="p-10">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="text-center py-8 space-y-6"
                >
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                    transition={{ duration: 0.6 }}
                    className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-200"
                  >
                    <Check size={48} strokeWidth={3} />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">You're Ready!</h2>
                    <p className="text-slate-500 font-medium mt-2">Taking you to your dashboard...</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Step counter */}
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Step {step + 1} of {steps.length}
                  </p>

                  {/* Icon */}
                  <div className={`w-16 h-16 ${current.color} text-white rounded-[1.5rem] flex items-center justify-center shadow-lg`}>
                    <current.icon size={30} />
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                      {current.title}
                    </h2>
                    <p className="text-slate-600 font-medium leading-relaxed text-base">
                      {current.body}
                    </p>
                  </div>

                  {/* Tip */}
                  {current.tip && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                      <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold text-amber-700 leading-relaxed">{current.tip}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          {!done && (
            <div className="px-10 pb-10 flex items-center justify-between">
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-2 px-5 py-3 text-slate-400 hover:text-slate-700 disabled:opacity-0 disabled:pointer-events-none transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <ArrowLeft size={16} /> Back
              </button>

              {/* Dot indicators */}
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`rounded-full transition-all ${i === step ? 'w-6 h-2 bg-brand' : 'w-2 h-2 bg-slate-200'}`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-colors shadow-lg active:scale-95"
              >
                {isLast ? (
                  <><Check size={14} strokeWidth={3} /> Done</>
                ) : (
                  <>Next <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const TUTORIAL_STORAGE_KEY = STORAGE_KEY;
export default WelcomeTutorial;
