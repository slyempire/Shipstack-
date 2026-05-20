
import React, { useState, useEffect } from 'react';
import { useAuthStore, useAppStore } from '../../store';
import { api } from '../../api';
import { DeliveryNote, DNStatus } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useTripTelemetry } from '../../hooks/useTripTelemetry';
import { offlineDb } from '../../services/offlineDb';
import { syncService } from '../../services/syncService';
import MapEngine from '../../components/MapEngine';
import { DriverBottomNav, DriverTab } from '../../components/driver/DriverBottomNav';
import { DriverPortalOfflineBanner } from '../../components/driver/portal/DriverPortalOfflineBanner';
import { DriverPortalChatOverlay } from '../../components/driver/portal/DriverPortalChatOverlay';
import { DriverPortalSignaturePad } from '../../components/driver/portal/DriverPortalSignaturePad';
import { DriverPortalTripList } from '../../components/driver/portal/DriverPortalTripList';
import { StatsOverview } from '../../components/driver/portal/StatsOverview';
import {
  Layers,
  Camera as CameraIcon,
  ChevronRight,
  X,
  Check,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Activity,
  MessageSquare,
  Wallet,
  Map as MapIcon,
  Bell,
  Droplets,
  Target,
  Zap,
  Package,
  Navigation,
  FileText
} from 'lucide-react';

const DriverPortal: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification, isOnline, notifications } = useAppStore();
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [currentDn, setCurrentDn] = useState<DeliveryNote | null>(null);
  const [step, setStep] = useState<'CHECK_IN' | 'BRIEFING' | 'LIST' | 'EXECUTION' | 'SUCCESS' | 'INSPECTION' | 'NOTIFICATIONS' | 'EXCEPTION' | 'RECONCILIATION' | 'FLEET_MAP' | 'SAFETY' | 'WALLET' | 'HUB'>('CHECK_IN');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [exceptionType, setExceptionType] = useState<string>('');
  const [exceptionReason, setExceptionReason] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState<'DISPATCH' | 'WAREHOUSE'>('DISPATCH');
  const [chatMessages, setChatMessages] = useState<{ sender: 'DRIVER' | 'DISPATCH' | 'WAREHOUSE', text: string, time: string }[]>([
    { sender: 'DISPATCH', text: 'Welcome to your shift. Drive safely!', time: '08:00 AM' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [inspections, setInspections] = useState<Record<string, boolean>>({});
  const [pickedItems, setPickedItems] = useState<Record<number, boolean>>({});
  const [odoStart, setOdoStart] = useState('');
  const [odoEnd, setOdoEnd] = useState('');
  const [podPhoto, setPodPhoto] = useState<string | null>(null);
  const [podSignature, setPodSignature] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [safetyScore, setSafetyScore] = useState(98);
  const [ecoScore, setEcoScore] = useState(83);
  const [driveTime, setDriveTime] = useState(8.4);

  const isEnRouteStatus = currentDn?.status === DNStatus.IN_TRANSIT;
  const isAtSiteStatus = currentDn?.status === DNStatus.DELIVERED;
  const { syncing } = useTripTelemetry(currentDn?.id, step === 'EXECUTION' && isEnRouteStatus);
  const currentCoords = useGeolocation(step === 'EXECUTION' && (isEnRouteStatus || isAtSiteStatus), currentDn?.id);

  useEffect(() => {
    if (user?.onDuty) setStep('LIST');
    else setStep('CHECK_IN');

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    syncService.startAutoSync();
    loadManifest();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      syncService.stopAutoSync();
    };
  }, [user?.onDuty, isOnline]);

  const loadManifest = async () => {
    setLoading(true);
    try {
      let data: DeliveryNote[] = [];
      if (isOnline) {
        data = await api.getDriverTrips(user?.id || '');
        const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
        await offlineDb.deliveryNotes.bulkPut(uniqueData);
      } else {
        data = await offlineDb.deliveryNotes.toArray();
      }
      setDns(data.filter(d => d.status !== DNStatus.COMPLETED && d.status !== DNStatus.INVOICED));
    } catch (e) {
      const offlineData = await offlineDb.deliveryNotes.toArray();
      setDns(offlineData.filter(d => d.status !== DNStatus.COMPLETED && d.status !== DNStatus.INVOICED));
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    setIsSubmitting(true);
    try {
      await api.clockIn(user?.id || '');
      useAuthStore.getState().updateUser({ onDuty: true });
      setStep('BRIEFING');
    } finally { setIsSubmitting(false); }
  };

  const handleClockOut = async () => {
    setIsSubmitting(true);
    try {
      await api.clockOut(user?.id || '');
      useAuthStore.getState().updateUser({ onDuty: false });
      setStep('CHECK_IN');
    } finally { setIsSubmitting(false); }
  };

  const handleStartTrip = async () => {
    if (!currentDn || !odoStart || isSubmitting) return;

    const odometerStart = Number(odoStart);
    const allItemsPicked = currentDn.items.every((_, index) => pickedItems[index]);

    if (Number.isNaN(odometerStart) || odometerStart < 0) {
      addNotification('Please enter a valid start odometer reading.', 'error');
      return;
    }

    if (!allItemsPicked) {
      addNotification('Confirm all manifest items before departure.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.updateDNStatus(currentDn.id, DNStatus.IN_TRANSIT, { odometerStart }, user?.name);
      await loadManifest();
      setStep('EXECUTION');
      setIsPanelExpanded(false);
    } finally { setIsSubmitting(false); }
  };

  const handleArrival = async () => {
    if (!currentDn || !odoEnd || isSubmitting) return;

    const odometerEnd = Number(odoEnd);
    if (Number.isNaN(odometerEnd) || odometerEnd < 0) {
      addNotification('Please enter a valid arrival odometer reading.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.updateDNStatus(currentDn.id, DNStatus.DELIVERED, { odometerEnd }, user?.name);
      await loadManifest();
      setIsPanelExpanded(true);
    } finally { setIsSubmitting(false); }
  };

  const handleLogTemperature = async (temp: number) => {
    if (!currentDn) return;
    await api.logTemperature(currentDn.id, temp, user?.name || 'Driver');
    addNotification(`Temp Log: ${temp}°C`, "success");
    loadManifest();
  };

  const handleComplete = async () => {
    if (!currentDn || !podPhoto || !podSignature) return;
    setIsSubmitting(true);
    try {
      await api.updateDNStatus(currentDn.id, DNStatus.COMPLETED, { podImageUrl: podPhoto, signatureUrl: podSignature }, user?.name);
      setStep('SUCCESS');
    } finally { setIsSubmitting(false); }
  };

  const handleException = async () => {
    if (!currentDn || !exceptionType || !exceptionReason) return;
    setIsSubmitting(true);
    try {
      await api.updateDNStatus(currentDn.id, DNStatus.EXCEPTION, { exceptionType, exceptionReason }, user?.name);
      setStep('LIST');
      setCurrentDn(null);
    } finally { setIsSubmitting(false); }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages(p => [...p, { sender: 'DRIVER', text: newMessage, time: 'Now' }]);
    setNewMessage('');
  };

  const handleCaptureSignature = () => {
    setPodSignature('https://upload.wikimedia.org/wikipedia/commons/7/7d/Signature_of_John_Hancock.png');
    setShowSignaturePad(false);
  };

  const renderBottomNav = (activeTab: DriverTab) => (
    <DriverBottomNav 
      activeTab={activeTab} 
      onTabChange={(tab) => {
        if (tab === 'LIST') setStep('LIST');
        else if (tab === 'SAFETY') setStep('SAFETY');
        else if (tab === 'ALERTS') setStep('NOTIFICATIONS');
        else if (tab === 'HUB') setStep('HUB');
        else if (tab === 'MORE') setStep('HUB');
      }}
      hasUnreadNotifications={notifications.some(n => !n.read)}
    />
  );

  const renderOfflineBanner = () => (
    isOffline ? (
      <div className="bg-amber-200 border-b border-amber-300 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 py-3">
        Offline mode active — using cached trip data.
      </div>
    ) : null
  );

  // --- RENDERING BRANCHES ---

  if (step === 'CHECK_IN') return (
    <div className="h-screen flex flex-col items-center justify-center p-12 text-center bg-white animate-in fade-in duration-1000">
      <div className="mb-32 space-y-12">
        <div className="h-24 w-24 bg-slate-900 mx-auto flex items-center justify-center shadow-2xl">
          <Layers size={48} className="text-white" strokeWidth={3} />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl md:text-8xl font-black text-slate-900 uppercase tracking-tighter leading-tight md:leading-none">Initialize<br/>Session.</h1>
          <p className="text-slate-400 font-bold uppercase tracking-tight text-sm">Awaiting authentication from terminal.</p>
        </div>
      </div>
      <button 
        onClick={handleClockIn}
        disabled={isSubmitting}
        className="w-full max-w-sm h-20 bg-slate-900 text-white text-base font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-black rounded-none shadow-2xl shadow-slate-900/20"
      >
        {isSubmitting ? <RefreshCw className="animate-spin mx-auto" size={24} /> : "Validate Identity"}
      </button>
    </div>
  );

  if (step === 'BRIEFING') return (
    <div className="min-h-screen bg-white p-12 flex flex-col justify-between animate-in fade-in duration-500">
      <div className="space-y-20">
        <header className="flex justify-between items-center">
          <div className="h-12 w-12 bg-black flex items-center justify-center">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Auth: {user?.name}</span>
        </header>
        <div className="space-y-6">
          <span className="label-minimal">Mission Parameters</span>
          <h1 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter leading-tight md:leading-none">Safety<br/>& Protocol</h1>
          <p className="text-xl font-bold uppercase tracking-tight opacity-40 leading-tight">ISO 39001 Road Traffic Safety Management Systems mandated.</p>
        </div>
      </div>
      <button 
        onClick={() => setStep('INSPECTION')}
        className="w-full h-24 bg-black text-white text-2xl font-black uppercase tracking-widest active:bg-slate-900 transition-all"
      >
        Acknowledge
      </button>
    </div>
  );

  if (step === 'LIST') return (
    <div className="min-h-screen bg-white flex flex-col animate-in fade-in duration-500">
      <DriverPortalOfflineBanner isOffline={isOffline} />
      <main className="flex-1 px-8 py-20 space-y-20 overflow-y-auto no-scrollbar pb-32">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
             <h1 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter leading-none">Manifest.</h1>
             <p className="text-slate-400 font-bold uppercase tracking-tight text-sm">Directives active in your corridor.</p>
          </div>
          <div className="text-right">
             <p className="text-5xl md:text-7xl font-black tracking-tighter leading-none">{dns.length}</p>
          </div>
        </div>

        <StatsOverview driveTime={driveTime} ecoScore={ecoScore} dnsCount={dns.length} />

        <div className="space-y-2">
          {dns.length === 0 ? (
            <div className="py-48 text-center border-t border-slate-100">
              <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No active deployments found.</p>
            </div>
          ) : (
            <DriverPortalTripList
              dns={dns}
              onSelect={(dn) => { setCurrentDn(dn); setStep('EXECUTION'); }}
            />
          )}
        </div>
      </main>
      {renderBottomNav('LIST')}
    </div>
  );

  if (step === 'EXECUTION' && currentDn) {
    const isPreStart = currentDn.status === DNStatus.ASSIGN_DRIVER;
    const isEnRoute = currentDn.status === DNStatus.IN_TRANSIT;
    const isAtSite = currentDn.status === DNStatus.DELIVERED;

    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden animate-in fade-in duration-500">
         {renderOfflineBanner()}
         {/* Monochromatic Tactical Interface */}
         <div className="flex-1 relative">
            <div className="absolute inset-0 grayscale">
               <MapEngine 
                  dns={currentDn ? [currentDn] : []}
                  focusedDnId={currentDn?.id}
                  followDriver={isEnRoute}
                  showTraffic={true}
                  center={isEnRoute ? { lat: currentCoords?.lat || 0, lng: currentCoords?.lng || 0 } : { lat: currentDn.lat || 0, lng: currentDn.lng || 0 }} 
                  zoom={15} 
               />
            </div>

            <div className="absolute top-6 left-6 z-50 pointer-events-auto w-full max-w-sm">
              <div className="rounded-3xl bg-white/95 border border-slate-200/80 p-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-xl font-black">{currentDn?.recipient?.charAt(0) || currentDn?.clientName?.charAt(0) || 'D'}</div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Live Delivery Map</p>
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 mt-1 line-clamp-2">{currentDn?.recipient || currentDn?.clientName || 'Delivery Target'}</h2>
                    <p className="mt-2 text-[11px] text-slate-500 leading-snug line-clamp-2">{currentDn?.address || 'Destination address unavailable'}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Status</p>
                    <p className="text-sm font-black uppercase tracking-tight text-slate-900">{currentDn?.status.replace('_', ' ')}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Type</p>
                    <p className="text-sm font-black uppercase tracking-tight text-slate-900">{currentDn?.type || 'N/A'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">ETA</p>
                    <p className="text-sm font-black uppercase tracking-tight text-slate-900">25 min</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical HUD Overlay */}
            <div className="absolute top-12 left-8 right-8 flex justify-between items-start pointer-events-none">
               <div className="bg-white border-2 border-slate-900 p-8 space-y-6 pointer-events-auto shadow-2xl">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                     <div className="h-8 w-8 bg-slate-900 text-white flex items-center justify-center">
                        {isPreStart ? <Package size={16} strokeWidth={3} /> : isEnRoute ? <Navigation size={16} strokeWidth={3} /> : <ShieldCheck size={16} strokeWidth={3} />}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">{isPreStart ? 'Validation' : isEnRoute ? 'Navigation' : 'Verification'}</span>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Point</p>
                     <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight text-slate-900">{currentDn.recipient || (currentDn as any).clientName}</h2>
                  </div>
                  {isEnRoute && (
                     <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-8">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ETA</p>
                           <p className="text-2xl font-black tracking-tight text-slate-900">18 MIN</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rating</p>
                           <p className="text-2xl font-black tracking-tight text-emerald-500">92%</p>
                        </div>
                     </div>
                  )}
               </div>

               <div className="flex flex-col gap-3 pointer-events-auto">
                  <button onClick={() => setStep('LIST')} className="h-14 w-14 bg-white border-2 border-slate-900 flex items-center justify-center shadow-xl active:bg-slate-900 active:text-white transition-all"><X size={24} strokeWidth={3}/></button>
                  <button onClick={() => setIsChatOpen(true)} className="h-14 w-14 bg-white border-2 border-slate-900 flex items-center justify-center shadow-xl active:bg-slate-900 active:text-white transition-all"><MessageSquare size={24} strokeWidth={3}/></button>
                  <button onClick={() => setStep('EXCEPTION')} className="h-14 w-14 bg-white border-2 border-red-600 text-red-600 flex items-center justify-center shadow-xl active:bg-red-600 active:text-white transition-all"><AlertTriangle size={24} strokeWidth={3}/></button>
               </div>
            </div>
         </div>

         {/* Mechanical Controls Drawer */}
         <div className={`bg-white border-t-2 border-slate-900 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isPanelExpanded ? 'h-[75vh]' : 'h-36'}`}>
            <button 
              onClick={() => setIsPanelExpanded(!isPanelExpanded)}
              className="w-full h-10 flex items-center justify-center group"
            >
               <div className="w-12 h-1.5 bg-slate-100 rounded-full group-hover:bg-slate-900 transition-all" />
            </button>

            {!isPanelExpanded ? (
               <div className="px-8 flex items-center justify-between h-20">
                  <div className="flex items-center gap-6">
                     <div className="animate-pulse h-3 w-3 bg-slate-900 rounded-full" />
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active State</p>
                        <p className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">{isPreStart ? 'Awaiting Clearance' : isEnRoute ? 'Transit Phase' : 'Site Verification'}</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setIsPanelExpanded(true)}
                    className="h-14 px-10 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-[0.98]"
                  >
                    Control
                  </button>
               </div>
            ) : (
               <div className="px-10 py-16 overflow-y-auto no-scrollbar h-full space-y-20 animate-in slide-in-from-bottom-12 duration-700">
                  
                  {isPreStart && (
                    <div className="space-y-16">
                       <h2 className="text-7xl font-black text-black uppercase tracking-tighter leading-[0.8] mb-12">Clearance Protocol.</h2>
                       <div className="space-y-8">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Inventory Validation</p>
                          <div className="space-y-2">
                             {currentDn.items.map((item, idx) => (
                                <button 
                                  key={idx}
                                  onClick={() => setPickedItems(p => ({...p, [idx]: !p[idx]}))}
                                  className={`w-full p-10 text-left flex items-center justify-between border-2 transition-all ${pickedItems[idx] ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                >
                                   <div className="flex items-center gap-8">
                                      <div className={`h-8 w-8 border-2 flex items-center justify-center ${pickedItems[idx] ? 'border-white' : 'border-slate-900'}`}>
                                         {pickedItems[idx] && <Check size={20} strokeWidth={4} />}
                                      </div>
                                      <span className="text-2xl font-black uppercase tracking-tighter">{item.qty} {item.name}</span>
                                   </div>
                                   <p className="text-[10px] font-black opacity-30">UNIT {idx + 101}</p>
                                </button>
                             ))}
                          </div>
                       </div>
                       
                       <div className="space-y-8">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Telemetry Sync</p>
                          <div className="p-12 bg-slate-50 border-2 border-transparent focus-within:border-slate-900 transition-all">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Master Odometer (KM)</p>
                             <input 
                               type="number"
                               value={odoStart}
                               onChange={e => setOdoStart(e.target.value)}
                               className="w-full bg-transparent text-8xl font-black outline-none tracking-tighter text-slate-900"
                               placeholder="000,000"
                             />
                          </div>
                       </div>

                       <button 
                         onClick={handleStartTrip}
                         disabled={!odoStart || !currentDn.items.every((_, index) => pickedItems[index])}
                         className="w-full h-24 bg-slate-900 text-white text-2xl font-black uppercase tracking-widest disabled:opacity-5 transition-all shadow-2xl shadow-slate-900/40"
                       >
                         Initialize Transit
                       </button>
                    </div>
                  )}

                  {isEnRoute && (
                    <div className="space-y-16">
                       <h2 className="text-7xl font-black text-black uppercase tracking-tighter leading-[0.8] mb-12">Arrival Submission.</h2>
                       <div className="grid grid-cols-2 gap-4">
                          <button className="bg-white border-2 border-slate-100 p-12 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all">Traffic Report</button>
                          <button className="bg-white border-2 border-slate-100 p-12 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all">Fuel Ledger</button>
                       </div>
                       
                       <div className="space-y-8">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">End Segment Telemetry</p>
                          <div className="p-12 bg-slate-50 border-2 border-transparent focus-within:border-slate-900 transition-all">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Current Odometer (KM)</p>
                             <input 
                               type="number"
                               value={odoEnd}
                               onChange={e => setOdoEnd(e.target.value)}
                               className="w-full bg-transparent text-8xl font-black outline-none tracking-tighter text-slate-900"
                               placeholder="000,000"
                             />
                          </div>
                       </div>

                       <button 
                         onClick={handleArrival}
                         disabled={!odoEnd}
                         className="w-full h-24 bg-slate-900 text-white text-2xl font-black uppercase tracking-widest disabled:opacity-5 transition-all shadow-2xl shadow-slate-900/40"
                       >
                         Confirm Arrival
                       </button>
                    </div>
                  )}

                  {isAtSite && (
                    <div className="space-y-16 pb-32">
                       <h2 className="text-7xl font-black text-black uppercase tracking-tighter leading-[0.8] mb-12">Handover Proof.</h2>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => setPodPhoto('https://picsum.photos/seed/pod/800/600')}
                            className={`aspect-square border-2 border-slate-100 flex flex-col items-center justify-center gap-6 transition-all ${podPhoto ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white text-slate-900 hover:border-slate-900'}`}
                          >
                             <div className={`h-20 w-20 rounded-full flex items-center justify-center ${podPhoto ? 'bg-white text-slate-900' : 'bg-slate-50 text-slate-400'}`}>
                                {podPhoto ? <Check size={40} strokeWidth={4} /> : <CameraIcon size={40} />}
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Visual Evidence</span>
                          </button>
                          <button 
                            onClick={() => setShowSignaturePad(true)}
                            className={`aspect-square border-2 border-slate-100 flex flex-col items-center justify-center gap-6 transition-all ${podSignature ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white text-slate-900 hover:border-slate-900'}`}
                          >
                             <div className={`h-20 w-20 rounded-full flex items-center justify-center ${podSignature ? 'bg-white text-slate-900' : 'bg-slate-50 text-slate-400'}`}>
                                {podSignature ? <Check size={40} strokeWidth={4} /> : <FileText size={40} />}
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Customer Token</span>
                          </button>
                       </div>

                       <button 
                         onClick={handleComplete}
                         disabled={!podPhoto || !podSignature}
                         className="w-full h-24 bg-slate-900 text-white text-2xl font-black uppercase tracking-widest disabled:opacity-5 transition-all shadow-2xl shadow-slate-900/40"
                       >
                         Finalize Exchange
                       </button>
                    </div>
                  )}
               </div>
            )}
         </div>

         {showSignaturePad && (
           <DriverPortalSignaturePad
             open={showSignaturePad}
             onClose={() => setShowSignaturePad(false)}
             onSign={handleCaptureSignature}
           />
         )}

         {isChatOpen && (
           <DriverPortalChatOverlay
             messages={chatMessages}
             recipient={chatRecipient}
             newMessage={newMessage}
             onChangeMessage={setNewMessage}
             onSendMessage={handleSendMessage}
             onClose={() => setIsChatOpen(false)}
           />
         )}
      </div>
    );
  }

  if (step === 'SUCCESS') return (
    <div className="fixed inset-0 bg-black z-[9000] flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-1000">
       <div className="space-y-12 max-w-sm">
          <div className="h-32 w-32 border-4 border-white mx-auto flex items-center justify-center">
             <Check size={64} strokeWidth={4} className="text-white" />
          </div>
                  <div>
                     <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">Mission<br/>Complete</h2>
                     <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-relaxed">Directive finalized. Data transmitted to central intelligence successfully.</p>
                  </div>
          <button 
            onClick={() => { setStep('LIST'); setCurrentDn(null); }}
            className="w-full h-24 bg-white text-black text-xl font-black uppercase tracking-widest active:bg-slate-200 transition-all"
          >
            Acknowledge
          </button>
       </div>
    </div>
  );

  if (step === 'NOTIFICATIONS') return (
    <div className="min-h-screen bg-white flex flex-col pt-12 animate-in fade-in duration-500">
       <main className="flex-1 px-8 py-12 space-y-12 overflow-y-auto no-scrollbar">
          <div className="space-y-4">
             <span className="label-minimal">Central Intelligence</span>
             <h1 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter leading-none">Intelligence</h1>
          </div>

          <div className="divide-y divide-black border-y border-black">
             {notifications.length === 0 ? (
               <div className="py-24 flex items-center justify-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No intelligence available.</p>
               </div>
             ) : (
               notifications.map(n => (
                 <div key={n.id} className="py-10 flex gap-8 items-start group">
                    <div className="h-12 w-12 border border-black flex items-center justify-center shrink-0">
                       <Bell size={24}/>
                    </div>
                    <div>
                       <p className="text-xl font-black uppercase tracking-tight leading-none mb-2">{n.message}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{n.time}</p>
                    </div>
                 </div>
               ))
             )}
          </div>
       </main>
       {renderBottomNav('ALERTS')}
    </div>
  );

  if (step === 'WALLET') return (
    <div className="min-h-screen bg-white flex flex-col pt-12 animate-in fade-in duration-500">
       <main className="flex-1 px-8 py-12 space-y-12 overflow-y-auto no-scrollbar pb-32">
          <div className="space-y-4">
             <span className="label-minimal">Financial Assets</span>
             <h1 className="text-6xl font-black text-black uppercase tracking-tighter leading-none">Earnings</h1>
          </div>

          <div className="bg-black text-white p-12 space-y-12 border border-black">
             <div>
                <p className="label-minimal !text-white opacity-40 !mb-2">Available Assets</p>
                <h3 className="text-5xl md:text-7xl font-black tracking-tighter">KES 48,250</h3>
             </div>
             <div className="flex gap-px bg-white/20 border border-white/20 overflow-hidden">
                <button className="flex-1 h-16 bg-white text-black text-xs font-black uppercase tracking-widest active:bg-slate-200 transition-all">Withdraw</button>
             </div>
          </div>

          <div className="space-y-6">
             <span className="label-minimal">Ledger Logs</span>
             <div className="divide-y divide-slate-100">
                {[
                  { label: 'Directive: 8214-X', amount: '+4,500', date: 'MAY 18', type: 'CREDIT' },
                  { label: 'Directive: 8192-A', amount: '+2,800', date: 'MAY 17', type: 'CREDIT' },
                  { label: 'System Withdrawal', amount: '-10,000', date: 'MAY 16', type: 'DEBIT' },
                ].map((t, i) => (
                  <div key={i} className="py-8 flex items-center justify-between">
                     <div>
                        <p className="text-lg font-black uppercase tracking-tight leading-none mb-2">{t.label}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.date}</p>
                     </div>
                     <span className={`text-2xl font-black ${t.type === 'CREDIT' ? 'text-black' : 'text-slate-300'}`}>{t.amount}</span>
                  </div>
                ))}
             </div>
          </div>
       </main>
       {renderBottomNav('LIST')}
    </div>
  );

  if (step === 'HUB') return (
    <div className="min-h-screen bg-white flex flex-col animate-in fade-in duration-500">
       <main className="flex-1 px-8 py-24 space-y-24 overflow-y-auto no-scrollbar pb-32">
          <div className="space-y-4">
             <h1 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter leading-none">Console.</h1>
             <p className="text-slate-400 font-bold uppercase tracking-tight text-sm">System Management & Core Modules.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
             {[
               { id: 'INSPECTION', label: 'Safety Check', icon: ShieldCheck, desc: 'ISO 9001 Protocol' },
               { id: 'WALLET', label: 'Financials', icon: Wallet, desc: 'Settlement Ledger' },
               { id: 'FLEET_MAP', label: 'Fleet Grid', icon: MapIcon, desc: 'Live Network Status' },
               { id: 'SAFETY', label: 'Metrics', icon: Activity, desc: 'Performance Score' },
             ].map((item) => (
               <button 
                 key={item.id}
                 onClick={() => setStep(item.id as any)}
                 className="p-10 border border-slate-100 hover:border-slate-900 bg-white flex items-center gap-10 transition-all text-left group shadow-sm hover:shadow-xl"
               >
                 <div className="h-16 w-16 bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-all">
                    <item.icon size={32} strokeWidth={3} />
                 </div>
                 <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1">{item.label}</h3>
                    <p className="text-[10px] font-black uppercase tracking-tight text-slate-300">{item.desc}</p>
                 </div>
               </button>
             ))}
          </div>

          <button 
            onClick={handleClockOut}
            className="w-full h-20 border-2 border-slate-900 text-slate-900 text-sm font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all active:scale-[0.98]"
          >
            End Shift
          </button>
       </main>
       {renderBottomNav('HUB')}
    </div>
  );

  if (step === 'INSPECTION') return (
    <div className="min-h-screen bg-white flex flex-col pt-12 animate-in fade-in duration-500">
       <main className="flex-1 px-8 py-12 space-y-12 overflow-y-auto no-scrollbar pb-40">
          <div className="space-y-6">
             <span className="label-minimal">ISO 9001 Readiness</span>
             <h1 className="text-6xl font-black text-black uppercase tracking-tighter leading-none">Inspection</h1>
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Mandatory pre-operation inspection. Any failure requires immediate report.</p>
          </div>

          <div className="space-y-px bg-black border border-black overflow-hidden">
             {[
               { id: 'tyres', label: 'Tire Integrity', icon: Target },
               { id: 'brakes', label: 'Braking Systems', icon: Zap },
               { id: 'lights', label: 'Optical Signals', icon: Activity },
               { id: 'fluids', label: 'Fluid Levels', icon: Droplets },
             ].map((check) => (
               <button 
                 key={check.id}
                 onClick={() => setInspections(prev => ({ ...prev, [check.id]: !prev[check.id] }))}
                 className={`w-full p-12 text-left flex items-center justify-between transition-all ${inspections[check.id] ? 'bg-black text-white' : 'bg-white text-black'}`}
               >
                  <div className="flex items-center gap-8">
                     <check.icon size={32} />
                     <span className="text-2xl font-black uppercase tracking-tighter">{check.label}</span>
                  </div>
                  {inspections[check.id] && <Check size={32} />}
               </button>
             ))}
          </div>

          <button 
             onClick={() => { setStep('LIST'); addNotification("Inspection completed.", "success"); }}
             disabled={Object.keys(inspections).length < 4}
             className="w-full h-24 bg-black text-white text-2xl font-black uppercase tracking-widest disabled:opacity-10"
          >
             Certify Readiness
          </button>
       </main>
    </div>
  );

  if (step === 'EXCEPTION') return (
    <div className="min-h-screen bg-white flex flex-col pt-12 animate-in fade-in duration-500">
       <main className="flex-1 px-8 py-12 space-y-12 overflow-y-auto no-scrollbar">
          <div className="space-y-6">
             <span className="label-minimal">Protocol Deviation</span>
             <h1 className="text-6xl font-black text-black uppercase tracking-tighter leading-none text-red-600">Incident<br/>Report</h1>
          </div>

          <div className="space-y-12">
             <div className="space-y-6">
                <span className="label-minimal">Category</span>
                <div className="grid grid-cols-1 gap-px bg-black border border-black overflow-hidden">
                   {['Mechanical Failure', 'Security Breach', 'Cargo Damage', 'Road Obstacle'].map(cat => (
                     <button 
                       key={cat}
                       onClick={() => setExceptionType(cat)}
                       className={`p-10 text-left text-2xl font-black uppercase tracking-tighter transition-all ${exceptionType === cat ? 'bg-black text-white' : 'bg-white text-black'}`}
                     >
                       {cat}
                     </button>
                   ))}
                </div>
             </div>

             <div className="space-y-6">
                <span className="label-minimal">Details</span>
                <textarea 
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  placeholder="Describe the incident specifics..."
                  className="w-full h-48 p-10 bg-white border border-black text-2xl font-black uppercase outline-none focus:bg-slate-50 transition-all placeholder:text-slate-100"
                />
             </div>

             <button 
               onClick={handleException}
               disabled={!exceptionType || !exceptionReason}
               className="w-full h-24 bg-red-600 text-white text-2xl font-black uppercase tracking-widest active:bg-red-700 transition-all disabled:opacity-10"
             >
               Transmit Alert
             </button>
          </div>
       </main>
       <div className="p-8">
          <button onClick={() => setStep('EXECUTION')} className="w-full h-16 border border-black text-xs font-black uppercase tracking-widest active:bg-black active:text-white transition-all">Cancel</button>
       </div>
    </div>
  );

  if (step === 'SAFETY') return (
    <div className="min-h-screen bg-white flex flex-col pt-12 animate-in fade-in duration-500">
       <main className="flex-1 px-8 py-12 space-y-16 overflow-y-auto no-scrollbar">
          <div className="space-y-4">
             <span className="label-minimal">Drive Metrics</span>
             <h1 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter leading-none">Safety<br/>Passport</h1>
          </div>

          <div className="grid grid-cols-1 gap-12">
             <div className="space-y-12">
                <div>
                   <p className="label-minimal opacity-40">Cumulative Score</p>
                   <p className="text-9xl font-black tracking-tighter">98</p>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-black" style={{ width: '98%' }} />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-px bg-black border border-black overflow-hidden">
                <div className="bg-white p-10">
                   <p className="text-4xl font-black tracking-tighter">0.0</p>
                   <p className="label-minimal !mb-0 opacity-40">Infractions</p>
                </div>
                <div className="bg-white p-10">
                   <p className="text-4xl font-black tracking-tighter text-emerald-500">A+</p>
                   <p className="label-minimal !mb-0 opacity-40">Eco Bonus</p>
                </div>
             </div>
          </div>
       </main>
       {renderBottomNav('SAFETY')}
    </div>
  );

  if (step === 'FLEET_MAP') return (
    <div className="h-screen bg-white flex flex-col pt-12 animate-in fade-in duration-500">
       <header className="px-8 py-8 flex justify-between items-end border-b border-black">
          <div className="space-y-4">
             <span className="label-minimal">Network Status</span>
             <h1 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">Fleet Grid</h1>
          </div>
          <button onClick={() => setStep('HUB')} className="h-12 w-12 border border-black flex items-center justify-center active:bg-black active:text-white transition-all">
             <X size={24} />
          </button>
       </header>
       <div className="flex-1 relative">
          <MapEngine center={{ lat: -1.286389, lng: 36.817223 }} zoom={12} />
          <div className="absolute bottom-8 left-8 right-8 bg-black text-white p-8 space-y-4 border border-black flex justify-between items-center">
             <div>
                <p className="text-lg font-black uppercase tracking-tight">Active Nodes</p>
                <p className="text-xs font-bold uppercase opacity-40">34 Vehicles Online</p>
             </div>
             <div className="flex items-center gap-4">
                <div className="h-3 w-3 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Live Uplink</span>
             </div>
          </div>
       </div>
    </div>
  );

  return null;
};

export default DriverPortal;
