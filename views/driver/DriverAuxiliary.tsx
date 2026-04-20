
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../../store';
import { api } from '../../api';
import { 
  ChevronLeft, 
  Truck, 
  Activity, 
  ShieldCheck, 
  Settings, 
  HelpCircle, 
  ClipboardCheck, 
  TrendingUp, 
  Award, 
  Clock, 
  MapPin, 
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronRight,
  LogOut,
  Bell,
  Moon,
  Sun,
  Smartphone,
  Circle,
  User as UserIcon,
  Camera,
  Upload,
  Check,
  RefreshCw,
  Play,
  Navigation,
  List
} from 'lucide-react';
import { Badge } from '../../packages/ui/Badge';
import { DNStatus, DeliveryNote } from '../../types';

import FeatureGuide from '../../components/FeatureGuide';

type AuxTab = 'PERFORMANCE' | 'INSPECTION' | 'SUPPORT' | 'SETTINGS';

interface InspectionStatus {
  status: 'PASS' | 'FAIL' | 'PENDING';
  photoUrl?: string;
}

const DriverAuxiliary: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { addNotification } = useAppStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuxTab>('PERFORMANCE');
  const [inspectionStep, setInspectionStep] = useState(0);
  const [inspectionData, setInspectionData] = useState<Record<string, InspectionStatus>>({});
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeTrip, setActiveTrip] = useState<DeliveryNote | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(true);

  // Gamification & ISO 14001 States
  const [badges, setBadges] = useState([
    { id: 'safety_pro', name: 'Safety Pro', icon: ShieldCheck, color: 'text-emerald-500', earned: true },
    { id: 'eco_warrior', name: 'Eco Warrior', icon: Activity, color: 'text-blue-500', earned: true },
    { id: 'night_owl', name: 'Night Owl', icon: Moon, color: 'text-indigo-500', earned: false },
    { id: 'top_driver', name: 'Top Driver', icon: Award, color: 'text-orange-500', earned: false },
  ]);

  const [carbonSaved, setCarbonSaved] = useState(124.5); // kg CO2

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const trips = await api.getDriverTrips(user?.id || '');
        const active = trips.find(t => t.status !== DNStatus.COMPLETED);
        setActiveTrip(active || null);
      } catch (error) {
        console.error("Failed to fetch trip", error);
      } finally {
        setLoadingTrip(false);
      }
    };
    fetchTrip();
  }, [user?.id]);

  const getActionConfig = () => {
    if (loadingTrip) return { label: 'Loading', icon: RefreshCw, path: '/driver' };
    if (!activeTrip) return { label: 'Manifest', icon: List, path: '/driver' };
    
    switch (activeTrip.status) {
      case DNStatus.RECEIVED:
      case DNStatus.DISPATCHED:
      case DNStatus.LOADED:
        return { label: 'Start Trip', icon: Play, path: '/driver' };
      case DNStatus.IN_TRANSIT:
        return { label: 'View Route', icon: Navigation, path: '/driver' };
      case DNStatus.DELIVERED:
        return { label: 'Complete', icon: Check, path: '/driver' };
      default:
        return { label: 'Manifest', icon: List, path: '/driver' };
    }
  };

  const actionConfig = getActionConfig();

  const inspectionItems = [
    { id: 'tires', label: 'Tire Pressure & Tread' },
    { id: 'brakes', label: 'Brake Fluid & Function' },
    { id: 'lights', label: 'Headlights & Indicators' },
    { id: 'fluids', label: 'Oil & Coolant Levels' },
    { id: 'cargo', label: 'Cargo Restraints' },
    { id: 'safety', label: 'Safety Kit & Fire Extinguisher' }
  ];

  const handleInspectionStatus = (id: string, status: 'PASS' | 'FAIL') => {
    setInspectionData(prev => ({ 
      ...prev, 
      [id]: { 
        ...prev[id], 
        status,
        // Reset photo if switching to PASS
        photoUrl: status === 'PASS' ? undefined : prev[id]?.photoUrl 
      } 
    }));
  };

  const handlePhotoUpload = (id: string) => {
    // Simulate photo capture/upload
    const mockUrl = `https://picsum.photos/seed/${id}/400/300`;
    setInspectionData(prev => ({
      ...prev,
      [id]: { ...prev[id], photoUrl: mockUrl }
    }));
    addNotification(`Evidence captured for ${id}`, "success");
  };

  const submitInspection = () => {
    const allProcessed = inspectionItems.every(item => 
      inspectionData[item.id]?.status === 'PASS' || 
      (inspectionData[item.id]?.status === 'FAIL' && inspectionData[item.id]?.photoUrl)
    );

    if (!allProcessed) {
      addNotification("Please complete all items and provide evidence for failures.", "error");
      return;
    }

    const failures = inspectionItems.filter(item => inspectionData[item.id]?.status === 'FAIL');
    if (failures.length > 0) {
      addNotification(`Inspection logged with ${failures.length} issues reported. Maintenance notified.`, "info");
    } else {
      addNotification("Daily inspection logged successfully. Vehicle clear.", "success");
    }
    
    setActiveTab('PERFORMANCE');
  };

  const renderPerformance = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 gap-3">
        <div className="card-tactical !p-5 flex flex-col justify-between">
          <TrendingUp className="text-emerald-500 mb-3" size={20} />
          <p className="label-mono mb-1">On-Time Rate</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">98.4%</p>
        </div>
        <div className="card-tactical !p-5 flex flex-col justify-between">
          <Award className="text-orange-500 mb-3" size={20} />
          <p className="label-mono mb-1 text-slate-500 dark:text-white/60">Driver Score</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">4.92</p>
        </div>
      </div>

      {/* ISO 14001: Environmental Impact */}
      <div className="card-tactical bg-emerald-600/10 border-emerald-500/20 !p-6 flex items-center gap-5">
        <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shrink-0">
          <Activity size={24} />
        </div>
        <div>
          <h4 className="label-mono !text-slate-900 dark:!text-white mb-0.5">ISO 14001: Eco Impact</h4>
          <p className="text-xl font-black text-emerald-400">{carbonSaved}kg CO₂ Saved</p>
          <p className="text-[8px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mt-0.5">Based on smooth acceleration & idle reduction</p>
        </div>
      </div>

      {/* Gamification: Badges */}
      <div className="card-tactical !p-6">
        <h3 className="label-mono mb-5 flex items-center gap-2">
          <Award size={12} className="text-orange-500" /> Driver Achievements
        </h3>
        <div className="grid grid-cols-4 gap-4">
           {badges.map(badge => (
             <div key={badge.id} className="flex flex-col items-center gap-2">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${badge.earned ? 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-xl' : 'bg-slate-100 dark:bg-slate-900/50 opacity-20 grayscale'}`}>
                   <badge.icon size={20} className={badge.earned ? badge.color : 'text-slate-900 dark:text-white'} />
                </div>
                <span className={`label-mono text-[7px] text-center ${badge.earned ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-white/20'}`}>{badge.name}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="card-tactical !p-6">
        <h3 className="label-mono mb-5 flex items-center gap-2">
          <Activity size={12} className="text-brand-accent" /> Recent Activity
        </h3>
        <div className="space-y-5">
          {[
            { label: 'Route NBO-204', date: 'Today, 09:12', status: 'COMPLETED', value: '+ $42.00' },
            { label: 'Route NBO-198', date: 'Yesterday, 14:45', status: 'COMPLETED', value: '+ $38.50' },
            { label: 'Fuel Subsidy', date: '21 Feb, 10:00', status: 'CREDITED', value: '+ $15.00' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-500 group-hover:text-brand-accent transition-colors">
                  <Clock size={14} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.label}</p>
                  <p className="text-[8px] font-bold text-slate-500 dark:text-slate-500 uppercase">{item.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-black text-emerald-500">{item.value}</p>
                <p className="text-[7px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-tactical bg-blue-600/10 border-blue-500/20 !p-6 flex items-center gap-5">
        <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shrink-0">
          <TrendingUp size={24} />
        </div>
        <div>
          <h4 className="label-mono !text-slate-900 dark:!text-white mb-0.5">Weekly Earnings</h4>
          <p className="text-xl font-black text-slate-900 dark:text-white">$412.50</p>
          <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">Next Payout: Feb 28</p>
        </div>
      </div>
    </div>
  );

  const renderInspection = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1 transition-colors">Safety Protocol</h3>
        <p className="label-mono transition-colors">Daily Vehicle Health Check</p>
      </div>

      <div className="space-y-3">
        {inspectionItems.map((item) => {
          const data = inspectionData[item.id] || { status: 'PENDING' };
          return (
            <div key={item.id} className="card-tactical !p-0 overflow-hidden transition-colors">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${data.status === 'PASS' ? 'bg-emerald-500 text-white' : data.status === 'FAIL' ? 'bg-red-500 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-600 border border-slate-100 dark:border-transparent'}`}>
                    {data.status === 'PASS' ? <CheckCircle2 size={18} /> : data.status === 'FAIL' ? <AlertTriangle size={18} /> : <Circle size={18} />}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white transition-colors">{item.label}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handleInspectionStatus(item.id, 'PASS')}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${data.status === 'PASS' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-transparent'}`}
                  >
                    Pass
                  </button>
                  <button 
                    onClick={() => handleInspectionStatus(item.id, 'FAIL')}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${data.status === 'FAIL' ? 'bg-red-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-transparent'}`}
                  >
                    Fail
                  </button>
                </div>
              </div>

              {data.status === 'FAIL' && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="label-mono !text-red-500 dark:!text-red-400 mb-1.5">Evidence Required</p>
                      {data.photoUrl ? (
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-14 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                            <img src={data.photoUrl} className="h-full w-full object-cover" alt="Evidence" />
                          </div>
                          <button 
                            onClick={() => handlePhotoUpload(item.id)}
                            className="label-mono !text-slate-500 hover:!text-slate-900 dark:hover:!text-white flex items-center gap-1 transition-colors"
                          >
                            <RefreshCw size={8} /> Retake
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handlePhotoUpload(item.id)}
                          className="flex items-center gap-1.5 text-brand-accent hover:text-blue-400 transition-colors"
                        >
                          <Camera size={14} />
                          <span className="label-mono !text-brand-accent">Capture Photo</span>
                        </button>
                      )}
                    </div>
                    {data.photoUrl && (
                      <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button 
        onClick={submitInspection}
        className="btn-tactical w-full py-6 bg-brand text-white shadow-2xl"
      >
        <ClipboardCheck size={18} /> Submit Safety Report
      </button>
    </div>
  );

  const renderSupport = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1 transition-colors">Operations Support</h3>
        <p className="label-mono transition-colors">24/7 Field Assistance</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button className="card-tactical !p-6 flex items-center gap-5 group active:bg-slate-100 dark:active:bg-slate-700 transition-all text-left">
          <div className="h-12 w-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5 transition-colors">Emergency SOS</h4>
            <p className="text-[8px] font-bold text-slate-500 dark:text-slate-500 uppercase">Accident or Breakdown</p>
          </div>
          <ChevronRight size={18} className="text-slate-500 dark:text-slate-600" />
        </button>

        <button className="card-tactical !p-6 flex items-center gap-5 group active:bg-slate-100 dark:active:bg-slate-700 transition-all text-left">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
            <HelpCircle size={24} />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5 transition-colors">Help Center</h4>
            <p className="text-[8px] font-bold text-slate-500 dark:text-slate-500 uppercase">App Guides & FAQs</p>
          </div>
          <ChevronRight size={18} className="text-slate-500 dark:text-slate-600" />
        </button>

        <button 
          onClick={() => setGuideOpen(true)}
          className="card-tactical !p-6 bg-brand/10 dark:bg-brand/40 border-brand/20 flex items-center gap-5 group active:bg-brand/20 dark:active:bg-brand/60 transition-all text-left"
        >
          <div className="h-12 w-12 rounded-xl bg-brand-accent text-white flex items-center justify-center shadow-lg">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5 transition-colors">Platform Pillars</h4>
            <p className="text-[8px] font-bold text-brand-accent/60 dark:text-white/40 uppercase">Learn how Shipstack works</p>
          </div>
          <ChevronRight size={18} className="text-brand-accent/40 dark:text-white/20" />
        </button>
      </div>

      <div className="card-tactical text-center">
        <p className="label-mono mb-3">Direct Dispatch Line</p>
        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 transition-colors">+254 700 000 000</p>
        <button className="btn-tactical w-full bg-brand text-white shadow-lg">Call Dispatch Now</button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1 transition-colors">Terminal Config</h3>
        <p className="label-mono transition-colors">Personalize your experience</p>
      </div>

      <div className="space-y-3">
        <div className="p-5 bg-eggshell border border-line rounded-3xl flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white border border-line flex items-center justify-center text-slate-500 transition-colors">
              <Bell size={18} />
            </div>
            <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight transition-colors">Push Notifications</span>
          </div>
          <div className="h-5 w-10 bg-brand rounded-full relative p-1 cursor-pointer">
            <div className="h-3 w-3 bg-white rounded-full ml-auto" />
          </div>
        </div>

        <div className="p-5 bg-eggshell border border-line rounded-3xl flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white border border-line flex items-center justify-center text-slate-500 transition-colors">
              <Smartphone size={18} />
            </div>
            <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight transition-colors">Offline Maps Cache</span>
          </div>
          <button className="label-mono !text-brand-accent">Manage</button>
        </div>
      </div>

      <button 
        onClick={() => { logout(); navigate('/login'); }}
        className="btn-tactical w-full py-6 bg-red-500/10 text-red-500 border border-red-500/20"
      >
        <LogOut size={18} /> Terminate Session
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-eggshell text-slate-900 font-sans p-6 pb-40 transition-colors duration-300">
      <header className="flex items-center justify-between mb-8 pt-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl text-slate-900 active:scale-90 transition-all shadow-sm">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-black uppercase tracking-widest">Driver Hub</h1>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-brand text-white flex items-center justify-center text-lg font-black shadow-lg">
          {user?.name?.charAt(0) || '?'}
        </div>
      </header>

      <main className="animate-in fade-in duration-500">
        {activeTab === 'PERFORMANCE' && renderPerformance()}
        {activeTab === 'INSPECTION' && renderInspection()}
        {activeTab === 'SUPPORT' && renderSupport()}
        {activeTab === 'SETTINGS' && renderSettings()}
      </main>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border-t border-slate-100 dark:border-white/5 px-6 pb-8 pt-3 z-[100] flex items-center justify-between transition-colors">
        <button 
          onClick={() => setActiveTab('PERFORMANCE')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'PERFORMANCE' ? 'text-brand-accent' : 'text-slate-500 dark:text-slate-500'}`}
        >
          <TrendingUp size={20} strokeWidth={activeTab === 'PERFORMANCE' ? 3 : 2} />
          <span className="text-[8px] font-black uppercase tracking-widest">Stats</span>
        </button>

        <button 
          onClick={() => setActiveTab('INSPECTION')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'INSPECTION' ? 'text-brand-accent' : 'text-slate-500 dark:text-slate-500'}`}
        >
          <ClipboardCheck size={20} strokeWidth={activeTab === 'INSPECTION' ? 3 : 2} />
          <span className="text-[8px] font-black uppercase tracking-widest">Safety</span>
        </button>

        {/* Dynamic Action Button */}
        <div className="relative -mt-12">
          <button 
            onClick={() => navigate(actionConfig.path)}
            className="h-16 w-16 bg-brand-accent text-white rounded-full shadow-[0_10px_30px_rgba(31,106,225,0.4)] flex items-center justify-center active:scale-90 transition-all border-4 border-white dark:border-slate-900"
          >
            <actionConfig.icon size={28} strokeWidth={3} className={loadingTrip ? 'animate-spin' : ''} />
          </button>
          <p className="text-[8px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest text-center mt-2">{actionConfig.label}</p>
        </div>

        <button 
          onClick={() => setActiveTab('SUPPORT')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'SUPPORT' ? 'text-brand-accent' : 'text-slate-500 dark:text-slate-500'}`}
        >
          <HelpCircle size={20} strokeWidth={activeTab === 'SUPPORT' ? 3 : 2} />
          <span className="text-[8px] font-black uppercase tracking-widest">Help</span>
        </button>

        <button 
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'SETTINGS' ? 'text-brand-accent' : 'text-slate-500 dark:text-slate-500'}`}
        >
          <Settings size={20} strokeWidth={activeTab === 'SETTINGS' ? 3 : 2} />
          <span className="text-[8px] font-black uppercase tracking-widest">Config</span>
        </button>
      </div>

      <FeatureGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
};

export default DriverAuxiliary;
