import React, { Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { 
  Layers, 
  ArrowRight, 
  Truck, 
  Route as RouteIcon, 
  FileText, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle,
  Zap, 
  Globe,
  Package,
  Search,
  ChevronRight,
  LayoutDashboard,
  MapPin,
  Navigation,
  Activity
} from 'lucide-react';

import FeatureGuide from '../../components/FeatureGuide';
import MarketingLayout from '../../components/marketing/MarketingLayout';

import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Spline from '@splinetool/react-spline';

class SplineErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn("Spline failed to load:", error);
    this.setState({ hasError: true });
  }
  render() {
    if (this.state.hasError) return (
      <div className="w-full h-full relative bg-slate-50">
        <img 
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000" 
          alt="Logistics Network Fallback" 
          className="w-full h-full object-cover opacity-20"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/40 to-white"></div>
      </div>
    );
    return this.props.children;
  }
}

gsap.registerPlugin(ScrollTrigger);

const SplineContainer: React.FC = () => {
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full relative bg-slate-50">
        <img 
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000" 
          alt="Logistics Network Fallback" 
          className="w-full h-full object-cover opacity-20"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/40 to-white"></div>
      </div>
    );
  }

  return (
    <SplineErrorBoundary>
      <Suspense fallback={<div className="w-full h-full bg-slate-50 animate-pulse" />}>
        <Spline 
          scene="https://prod.spline.design/6Wq1Q7YGyWf8Z92A/scene.splinecode" 
          onError={(e) => {
            console.warn("Spline internal error caught:", e);
            setHasError(true);
          }}
        />
      </Suspense>
    </SplineErrorBoundary>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const handleDashboardRedirect = () => {
    if (user?.role === 'DRIVER') navigate('/driver');
    else if (user?.role === 'FACILITY') navigate('/facility');
    else if (user?.role === 'WAREHOUSE') navigate('/admin/warehouse');
    else navigate('/admin');
  };

  const [guideOpen, setGuideOpen] = React.useState(false);
  const dashboardRef = React.useRef<HTMLDivElement>(null);
  const heroRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  React.useEffect(() => {
    if (dashboardRef.current) {
      gsap.fromTo(dashboardRef.current.querySelectorAll('.dashboard-card'), 
        { y: 100, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          stagger: 0.2, 
          duration: 1, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: dashboardRef.current,
            start: "top 80%",
          }
        }
      );
    }

    // GSAP Animation for SVG Cargo Lines
    if (svgRef.current) {
      const paths = svgRef.current.querySelectorAll('.cargo-line');
      paths.forEach((path) => {
        const length = (path as SVGPathElement).getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 3,
          repeat: -1,
          ease: "power1.inOut",
          delay: Math.random() * 2
        });
      });
    }
  }, []);

  return (
    <MarketingLayout>

      {/* Hero Section */}
      <motion.section 
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="container-responsive pt-32 pb-24 flex flex-col items-center text-center relative overflow-hidden min-h-[90vh] justify-center"
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000" 
            alt="Logistics Network" 
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/50 via-navy/85 to-navy"></div>
          
          {/* Spline 3D Background */}
          <div className="absolute inset-0 z-0 opacity-40">
            <SplineContainer />
          </div>

          {/* Animated Africa Map Overlay with GSAP Lines */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none z-[1]">
            <svg ref={svgRef} viewBox="0 0 500 500" className="w-full h-full max-w-5xl">
              {/* Africa Outline */}
              <path 
                d="M180,100 C220,80 280,80 320,100 C360,120 380,180 360,240 C340,300 300,380 250,450 C200,380 160,300 140,240 C120,180 140,120 180,100" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="0.5" 
                className="text-brand/20"
              />
              
              {/* GSAP Animated Cargo Lines */}
              <path d="M320,220 Q250,200 180,220" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand cargo-line" />
              <path d="M320,220 Q300,320 280,400" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand cargo-line" />
              <path d="M320,220 Q330,250 340,280" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand cargo-line" />
              <path d="M180,220 Q200,300 280,400" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand cargo-line" />
              <path d="M340,280 Q310,340 280,400" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand cargo-line" />

              {/* Pulsing Hubs */}
              <g className="hubs">
                {/* Nairobi */}
                <motion.circle cx="320" cy="220" r="4" fill="currentColor" className="text-brand" animate={{ r: [4, 12, 4], opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
                {/* Lagos */}
                <motion.circle cx="180" cy="220" r="4" fill="currentColor" className="text-brand" animate={{ r: [4, 12, 4], opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
                {/* Johannesburg */}
                <motion.circle cx="280" cy="400" r="4" fill="currentColor" className="text-brand" animate={{ r: [4, 12, 4], opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} />
                {/* Dar es Salaam */}
                <motion.circle cx="340" cy="280" r="4" fill="currentColor" className="text-brand" animate={{ r: [4, 12, 4], opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.7 }} />
              </g>
            </svg>
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[120px]"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/15 px-4 py-2 rounded-full mb-10 shadow-sm relative z-10"
        >
          <Globe size={14} className="text-blue-400" />
          <span className="label-logistics !mb-0 text-blue-300 font-bold uppercase tracking-widest text-[10px]">The Operating System for African Trade</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-10 uppercase font-display relative z-10"
        >
          Logistics Built <br />
          <span className="text-brand">for Africa.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-2xl text-slate-300 max-w-3xl mb-16 font-medium relative z-10 leading-relaxed"
        >
          Manage deliveries, track shipments in real time, and scale your logistics operations—whether you're in Nairobi, Lagos, or beyond.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto px-4 relative z-10"
        >
          <motion.button 
            onClick={() => isAuthenticated ? handleDashboardRedirect() : navigate('/register')} 
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-12 py-5 bg-navy border border-white/10 text-white rounded-2xl text-lg font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 group"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
          </motion.button>
          <motion.button 
            onClick={() => setGuideOpen(true)}
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-10 py-5 border-2 border-white/20 rounded-2xl text-lg font-black uppercase tracking-widest bg-transparent text-white backdrop-blur-md hover:bg-white/10 transition-all flex items-center justify-center gap-3"
          >
            Watch Demo
          </motion.button>
        </motion.div>
      </motion.section>

      {/* Value Prop Section */}
      <section className="py-20 bg-navy overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2075&auto=format&fit=crop" 
            alt="Trucking Route" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="container-responsive relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-4 py-2 rounded-full mb-8"
              >
                <Truck size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Logistics in Motion</span>
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-8 text-white">
                Built for the <br />
                <span className="text-brand">Backbone of Trade.</span>
              </h2>
              <p className="text-xl text-slate-300 font-medium leading-relaxed mb-12 max-w-xl">
                We didn't build Shipstack in a vacuum. We built it at the border points, in the warehouses, and in the truck cabins. We understand that logistics in Africa isn't just about moving boxes—it's about trust, transparency, and the people who make it happen.
              </p>
              <div className="grid sm:grid-cols-2 gap-8">
                {[
                  { title: "Human-Centric Design", desc: "Interfaces built for drivers and warehouse staff, not just executives.", icon: Activity },
                  { title: "Corridor-Ready", desc: "Optimized for the unique challenges of the Northern and Central corridors.", icon: Navigation },
                  { title: "Real-Time Trust", desc: "Eliminate the 'where is my cargo?' anxiety with absolute transparency.", icon: ShieldCheck },
                  { title: "Smart Settlement", desc: "Instant M-Pesa payouts for drivers upon successful delivery verification.", icon: DollarSign }
                ].map((item, i) => (
                  <div key={i} className="space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                      <item.icon size={24} className="text-brand" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase text-sm tracking-tight mb-2 text-white">{item.title}</h4>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000">
              <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl border border-white/5 relative group">
                <img 
                  src="https://images.unsplash.com/photo-1580674285054-bed31e145f59?q=80&w=2070&auto=format&fit=crop" 
                  alt="Trucking in Africa" 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                <div className="absolute bottom-12 left-12 right-12">
                  <div className="p-8 bg-card/80 backdrop-blur-md rounded-3xl border border-line">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-10 w-10 bg-brand rounded-full flex items-center justify-center text-white">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Current Location</p>
                        <p className="text-sm font-bold text-white">Namanga Border Point</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-brand/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '65%' }}
                        className="h-full bg-brand"
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                      <span>Nairobi</span>
                      <span>Arusha</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar with Stats Counter */}
      <div className="bg-navy py-12 border-y border-white/5 overflow-hidden">
         <div className="container-responsive">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 px-4">
              <StatCounter value={10000} suffix="+" label="Shipments Tracked" />
              <StatCounter value={15} label="Countries Covered" />
              <StatCounter value={500} suffix="+" label="Verified Drivers" />
              <StatCounter value={99.9} suffix="%" label="Uptime Reliability" />
            </div>
            <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Trusted by the region's leading transporters</p>
            <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale filter invert">
               <div className="flex items-center gap-2 font-black text-lg uppercase tracking-tighter text-white">Nairobi Hub Ops</div>
               <div className="flex items-center gap-2 font-black text-lg uppercase tracking-tighter text-white">Mombasa Port Ops</div>
               <div className="flex items-center gap-2 font-black text-lg uppercase tracking-tighter text-white">Pharma Transporters</div>
               <div className="flex items-center gap-2 font-black text-lg uppercase tracking-tighter text-white">Transit East Africa</div>
            </div>
         </div>
      </div>

      {/* Floating Cargo Dashboard Section */}
      <section ref={dashboardRef} className="py-20 bg-navy overflow-hidden">
        <div className="container-responsive">
          <div className="text-center mb-16 px-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-white">Real-Time <span className="text-brand">Control.</span></h2>
            <p className="text-slate-300 max-w-2xl mx-auto font-medium">Experience the power of a fully integrated logistics operating system.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="dashboard-card bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-white/10">
              <div className="h-12 w-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-6">
                <Truck size={24} />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight mb-2 text-white">Fleet Status</h4>
              <p className="text-sm text-slate-400 font-medium mb-6">Real-time monitoring of every unit in your corridor.</p>
              <div className="space-y-3">
                <div className="h-2 w-full bg-brand/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: '75%' }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-brand" />
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase opacity-40 text-slate-500">
                  <span>Active</span>
                  <span>75%</span>
                </div>
              </div>
            </div>

            <div className="dashboard-card bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-white/10">
              <div className="h-12 w-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                <RouteIcon size={24} />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight mb-2 text-white">Route Efficiency</h4>
              <p className="text-sm text-slate-400 font-medium mb-6">Optimized paths that adapt to border conditions.</p>
              <div className="flex items-end gap-2 h-12">
                {[40, 70, 45, 90, 65, 80].map((h, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ height: 0 }} 
                    whileInView={{ height: `${h}%` }} 
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex-1 bg-emerald-500 rounded-t-lg" 
                  />
                ))}
              </div>
            </div>

            <div className="dashboard-card bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-white/10">
              <div className="h-12 w-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-6">
                <Zap size={24} />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight mb-2 text-white">Live Telemetry</h4>
              <p className="text-sm text-slate-400 font-medium mb-6">Instant alerts for border crossings and hub arrivals.</p>
              <div className="flex items-center gap-4">
                <div className="h-3 w-3 rounded-full bg-brand animate-ping" />
                <span className="text-xs font-black uppercase tracking-widest text-brand">System Nominal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Shipment Tracker Section */}
      <section className="py-20 bg-navy overflow-hidden">
        <div className="container-responsive">
          <div className="flex flex-col lg:flex-row gap-20 items-center mb-16 px-4">
            <div className="lg:w-1/2">
              <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-[0.85] text-white">The Journey of <br /><span className="text-brand">Every Parcel.</span></h2>
              <p className="text-slate-300 max-w-xl font-medium text-lg">From the moment an order is created to the final mile delivery, Shipstack provides absolute visibility and control.</p>
            </div>
            <div className="lg:w-1/2 grid grid-cols-2 gap-4">
              <div className="p-8 bg-slate-900 rounded-3xl border border-white/10 shadow-sm">
                <p className="text-3xl font-black text-white mb-1">10k+</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Monthly Shipments</p>
              </div>
              <div className="p-8 bg-slate-900 rounded-3xl border border-white/10 shadow-sm">
                <p className="text-3xl font-black text-white mb-1">4.9/5</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Driver Rating</p>
              </div>
            </div>
          </div>
          
          <div className="relative max-w-5xl mx-auto py-24">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 w-full h-2 bg-brand/5 -translate-y-1/2 z-0 rounded-full" />
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              transition={{ duration: 6, ease: "linear" }}
              className="absolute top-1/2 left-0 h-2 bg-brand -translate-y-1/2 z-0 rounded-full shadow-[0_0_15px_rgba(0,102,255,0.4)]"
            />

            <div className="relative z-10 flex justify-between items-center">
              {[
                { icon: Package, label: "Origin", time: "08:00 AM" },
                { icon: Layers, label: "Warehouse", time: "10:30 AM" },
                { icon: Truck, label: "In Transit", time: "02:15 PM" },
                { icon: CheckCircle, label: "Delivered", time: "05:45 PM" }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-6">
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 1.5, duration: 0.5, type: "spring" }}
                    className="h-20 w-20 bg-slate-900 border-4 border-white/10 rounded-[2rem] flex items-center justify-center text-slate-300 shadow-2xl group hover:border-brand hover:text-brand transition-all cursor-default"
                  >
                    <step.icon size={32} />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white">{step.label}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Moving Truck Icon with GSAP-like motion */}
            <motion.div 
              initial={{ left: '0%' }}
              whileInView={{ left: '100%' }}
              transition={{ duration: 6, ease: "linear", repeat: Infinity }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
            >
              <div className="h-14 w-14 bg-brand text-white rounded-2xl flex items-center justify-center shadow-2xl relative">
                <Truck size={24} />
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-navy text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded whitespace-nowrap">
                  KCD 452L
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Industry Switcher Section */}
      <section className="py-20 bg-navy overflow-hidden px-4">
        <div className="container-responsive">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-8 text-white">
                One Platform. <br />
                <span className="text-brand">Every Industry.</span>
              </h2>
              <p className="text-lg text-slate-300 font-medium leading-relaxed mb-12">
                Shipstack adapts to the specific compliance and operational needs of your sector.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Agriculture', path: '/solutions/agriculture' },
                  { name: 'Retail', path: '/solutions/retail' },
                  { name: 'E-commerce', path: '/solutions/ecommerce' },
                  { name: 'Healthcare', path: '/solutions/healthcare' }
                ].map((industry) => (
                  <motion.div
                    key={industry.name}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link 
                      to={industry.path}
                      className="block p-6 rounded-3xl border border-white/5 bg-white/5 hover:bg-brand hover:border-brand transition-all text-left group"
                    >
                      <h4 className="font-black uppercase text-sm tracking-tight group-hover:text-white">{industry.name}</h4>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="aspect-square bg-white/5 rounded-[4rem] border border-white/5 flex items-center justify-center overflow-hidden relative">
                {/* 3D-like Rotating Globe Background */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 opacity-10"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.1" strokeDasharray="2 2" />
                    <ellipse cx="50" cy="50" rx="48" ry="20" fill="none" stroke="currentColor" strokeWidth="0.1" strokeDasharray="2 2" />
                    <ellipse cx="50" cy="50" rx="20" ry="48" fill="none" stroke="currentColor" strokeWidth="0.1" strokeDasharray="2 2" />
                  </svg>
                </motion.div>

                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="w-2/3 h-2/3 border-2 border-dashed border-brand/30 rounded-full flex items-center justify-center relative z-10"
                >
                  <Globe size={120} className="text-brand opacity-20" />
                  
                  {/* Logistics Nodes */}
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-1/4 left-1/4 h-2 w-2 bg-brand rounded-full shadow-[0_0_10px_#0066FF]"
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                    className="absolute bottom-1/3 right-1/4 h-2 w-2 bg-brand rounded-full shadow-[0_0_10px_#0066FF]"
                  />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <Layers size={80} className="text-brand mb-4 mx-auto" />
                    <p className="text-2xl font-black uppercase tracking-tighter">Unified Stack</p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Feature Grid - Bento Style */}
      <section id="features" className="px-6 py-24 max-w-7xl mx-auto relative">
         <div className="absolute inset-0 -z-10 opacity-[0.05] pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&q=80&w=2000" 
              alt="Cargo Ship" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
         </div>
         <div className="text-center mb-16">
            <h2 className="mobile-h2 uppercase font-display mb-6">Everything you need <br /> <span className="text-brand">to scale.</span></h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">A comprehensive suite of tools designed to stabilize your supply chain and empower your workforce.</p>
         </div>
         
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 px-4">
            {/* Bento Item 1: Large */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:col-span-2 lg:col-span-3 bg-slate-900 p-10 rounded-[3rem] shadow-xl border border-white/10 flex flex-col justify-between group hover:border-brand transition-all"
            >
               <div>
                  <div className="h-14 w-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-8 group-hover:bg-brand group-hover:text-white transition-colors">
                     <RouteIcon size={28} />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-white">Intelligent Routing</h3>
                  <p className="text-sm text-slate-300 font-medium leading-relaxed">Save fuel and time with routes that account for border delays, road conditions, and real-time traffic across the corridor.</p>
               </div>
               <div className="mt-10 pt-10 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand">99.9% Accuracy</span>
                  <div className="flex -space-x-2">
                     {[1,2,3].map(i => <div key={i} className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-800" />)}
                  </div>
               </div>
            </motion.div>

            {/* Bento Item 2: Tall */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="md:col-span-2 lg:col-span-3 bg-brand p-10 rounded-[3rem] shadow-xl text-white flex flex-col justify-between group hover:opacity-90 transition-all"
            >
               <div>
                  <div className="h-14 w-14 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-8">
                     <Zap size={28} />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-white">Live Telemetry</h3>
                  <p className="text-sm text-white/80 font-medium leading-relaxed">Monitor your fleet's health and location with precision. Get notified the moment a vehicle reaches a hub or crosses a border.</p>
               </div>
               <div className="mt-10">
                  <div className="h-32 w-full bg-white/10 rounded-2xl border border-white/10 flex items-end gap-1 p-4">
                     {[40, 60, 30, 80, 50, 90, 45].map((h, i) => (
                        <motion.div 
                           key={i}
                           initial={{ height: 0 }}
                           whileInView={{ height: `${h}%` }}
                           transition={{ duration: 0.5, delay: 0.5 + (i * 0.1) }}
                           className="flex-1 bg-white rounded-t-sm"
                        />
                     ))}
                  </div>
               </div>
            </motion.div>

            {/* Bento Item 3: Small */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="md:col-span-2 lg:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] shadow-lg border border-white/10 group hover:shadow-2xl transition-all"
            >
               <div className="h-12 w-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck size={24} />
               </div>
               <h4 className="text-lg font-black uppercase tracking-tight mb-2 text-white">Compliance</h4>
               <p className="text-xs text-slate-300 font-medium">Stay ahead of regulations with automated NTSA checks and safety audits.</p>
            </motion.div>

            {/* Bento Item 4: Small */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="md:col-span-2 lg:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] shadow-lg border border-white/10 group hover:shadow-2xl transition-all"
            >
               <div className="h-12 w-12 bg-brand/10 text-brand rounded-xl flex items-center justify-center mb-6">
                  <Globe size={24} />
               </div>
               <h4 className="text-lg font-black uppercase tracking-tight mb-2 text-white">Multi-Hub</h4>
               <p className="text-xs text-slate-300 font-medium">Manage multiple warehouses and distribution centers from a single command center.</p>
            </motion.div>

            {/* Bento Item 5: Small */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -5 }}
              className="md:col-span-2 lg:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] shadow-lg border border-white/10 group hover:shadow-2xl transition-all"
            >
               <div className="h-12 w-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mb-6">
                  <DollarSign size={24} />
               </div>
               <h4 className="text-lg font-black uppercase tracking-tight mb-2 text-white">Settlement</h4>
               <p className="text-xs text-slate-300 font-medium">Integrated mobile money payments for drivers and vendors. Settle in seconds.</p>
            </motion.div>
          </div>
      </section>

      {/* Driver Recruitment Section */}
      <section className="bg-navy py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1591768793355-74d7c836038c?q=80&w=2070&auto=format&fit=crop" 
            alt="Professional Driver" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="container-responsive relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-4 py-2 rounded-full mb-8">
                <Truck size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">For Professional Drivers</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-8 text-white">
                Turn your vehicle <br />
                <span className="text-brand">into a business.</span>
              </h2>
              <p className="text-lg text-slate-300 font-medium leading-relaxed mb-10">
                Shipstack isn't just for companies. We empower independent drivers and fleet owners with the tools to find consistent work, track earnings, and grow their logistics business.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <Link 
                  to="/register?role=DRIVER" 
                  className="inline-flex bg-navy border border-white/10 text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all items-center gap-3"
                >
                  Enroll as a Driver <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Matters Section */}
      <section className="py-20 bg-navy overflow-hidden">
        <div className="container-responsive">
          <div className="text-center mb-16 px-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-white">Built for the <span className="text-brand">realities</span> of African logistics</h2>
            <p className="text-slate-300 max-w-2xl mx-auto font-medium">We solve the localized pain points that global platforms ignore.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Poor visibility?", action: "Track every shipment live", icon: Search },
              { title: "Payment friction?", action: "Accept mobile money instantly", icon: DollarSign },
              { title: "Manual chaos?", action: "Automate dispatch & routing", icon: Zap },
              { title: "Unreliable delivery?", action: "Optimize routes & drivers", icon: Truck }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900 p-8 rounded-[2rem] shadow-lg border border-white/10 hover:shadow-2xl transition-all group"
              >
                <div className="h-12 w-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-white transition-colors">
                  <item.icon size={24} />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight mb-2 text-white">{item.title}</h4>
                <p className="text-sm text-brand font-bold uppercase tracking-widest">→ {item.action}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-navy overflow-hidden">
        <div className="container-responsive">
          <div className="text-center mb-16 px-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-white">How It <span className="text-brand">Works.</span></h2>
            <p className="text-slate-300 max-w-2xl mx-auto font-medium text-lg">Simple. Visual. Clear.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative px-4">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-white/5 -z-10" />
            
            {[
              { step: "01", title: "Create shipment", desc: "Enter details and generate order" },
              { step: "02", title: "Assign driver", desc: "Automated or manual dispatch" },
              { step: "03", title: "Track in real-time", desc: "Full visibility for you & client" },
              { step: "04", title: "Deliver & proof", desc: "Geo-tagged digital confirmation" }
            ].map((item, i) => (
              <div key={i} className="text-center space-y-6">
                <div className="h-24 w-24 bg-brand text-white rounded-full mx-auto flex items-center justify-center text-3xl font-black shadow-xl border-8 border-navy">
                  {item.step}
                </div>
                <h4 className="text-xl font-black uppercase tracking-tight text-white">{item.title}</h4>
                <p className="text-sm text-slate-300 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-navy">
        <div className="container-responsive">
          <div className="text-center mb-16 px-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-white">Trusted by the <span className="text-brand">Best.</span></h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 px-4">
            {[
              { quote: "We reduced delivery delays by 40% within 2 months.", author: "Nairobi-based distributor" },
              { quote: "The M-Pesa integration changed how we pay our drivers.", author: "Lagos Logistics Hub" },
              { quote: "Finally, a platform that understands the African corridor.", author: "Dar es Salaam Fleet Owner" }
            ].map((item, i) => (
              <div key={i} className="bg-slate-900 p-10 rounded-[3rem] shadow-xl border border-white/10 relative">
                <div className="text-brand mb-6">
                  <Layers size={32} />
                </div>
                <p className="text-lg font-medium text-slate-200 mb-8 italic">"{item.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-brand/10 rounded-full" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-300">— {item.author}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 bg-navy">
        <div className="container-responsive text-center">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 text-white">Start free. <span className="text-brand">Scale as you grow.</span></h2>
          <p className="text-slate-300 max-w-2xl mx-auto font-medium text-lg mb-12">No setup fees. Pay via M-Pesa, card, or invoice.</p>
          <Link to="/pricing" className="inline-flex bg-navy border border-white/10 text-white px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
            View Pricing Plans
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 relative overflow-hidden">
         <div className="container-responsive bg-charcoal rounded-[4rem] p-16 sm:p-32 text-center relative overflow-hidden shadow-2xl border border-line">
            <img 
              src="https://images.unsplash.com/photo-1494412574743-0194856f038f?auto=format&fit=crop&q=80&w=2000" 
              alt="Warehouse Operations" 
              className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay dark:opacity-20"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,_rgba(0,102,255,0.1)_1px,_transparent_0)] bg-[length:40px_40px]"></div>
            <div className="relative z-10">
               <h2 className="mobile-h2 mb-8 uppercase font-display tracking-tight">Ready to simplify your <span className="text-brand">logistics?</span></h2>
               <p className="mobile-p text-slate-500 max-w-2xl mx-auto mb-16 font-medium">Join the hundreds of businesses digitizing their logistics across Africa.</p>
               <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <Link to="/register" className="inline-flex bg-navy border border-white/10 text-white px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
                     Start Free Trial
                  </Link>
                  <Link to="/contact" className="inline-flex border-2 border-white/20 text-white px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                     Book a Demo
                  </Link>
               </div>
            </div>
         </div>
      </section>

      <AnimatePresence>
        {guideOpen && (
          <FeatureGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
        )}
      </AnimatePresence>
    </MarketingLayout>
  );
};

const FeatureItem = ({ icon: Icon, title, desc }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="space-y-6 group"
  >
     <div className="h-14 w-14 sm:h-16 sm:w-16 bg-slate-50 text-brand rounded-2xl sm:rounded-[1.25rem] flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-all shadow-sm">
        <Icon size={30} strokeWidth={2.5} />
     </div>
     <h3 className="text-lg sm:text-xl font-black tracking-tight uppercase text-slate-900 leading-none">{title}</h3>
     <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
  </motion.div>
);

const StatCounter = ({ value, suffix = '', label }: { value: number, suffix?: string, label: string }) => {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  React.useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2;
      const increment = end / (duration * 60);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);

      return () => clearInterval(timer);
    }
  }, [value, isInView]);

  return (
    <div ref={ref} className="text-center p-8 bg-slate-900 rounded-3xl border border-white/10 shadow-xl">
      <div className="text-4xl md:text-5xl font-black tracking-tighter mb-2 text-white">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
        {label}
      </div>
    </div>
  );
};

export default LandingPage;
