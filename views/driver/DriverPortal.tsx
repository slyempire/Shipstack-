
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../../store';
import { api } from '../../api';
import { DeliveryNote, DNStatus, LogisticsDocument, DocumentStatus, Facility, LogisticsType, SafetyEventType } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useTripTelemetry } from '../../hooks/useTripTelemetry';
import { offlineDb } from '../../services/offlineDb';
import { syncService } from '../../services/syncService';
import DocumentPreview from '../../components/DocumentPreview';
import MapEngine from '../../components/MapEngine';
import { Badge } from '../../packages/ui/Badge';
import { 
  Truck, 
  MapPin, 
  Camera as CameraIcon, 
  ChevronRight, 
  ChevronLeft,
  LogOut,
  Navigation,
  FileText,
  X,
  Check,
  CheckCircle,
  Package,
  Play,
  ShieldCheck,
  AlertCircle,
  CameraOff,
  RefreshCw,
  Phone,
  FileSearch,
  Wifi,
  Activity,
  User as UserIcon,
  Settings,
  Navigation2,
  Circle,
  Target,
  Thermometer,
  Menu,
  Info,
  Clock,
  ClipboardCheck,
  AlertTriangle,
  FileCheck,
  History,
  Zap,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Receipt
} from 'lucide-react';
import { PaymentModal } from '../../components/PaymentModal';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const DriverPortal: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { addNotification, isOnline } = useAppStore();
  const navigate = useNavigate();
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [currentDn, setCurrentDn] = useState<DeliveryNote | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [step, setStep] = useState<'CHECK_IN' | 'BRIEFING' | 'LIST' | 'EXECUTION' | 'SUCCESS' | 'INSPECTION' | 'NOTIFICATIONS' | 'EXCEPTION' | 'RECONCILIATION' | 'FLEET_MAP' | 'SAFETY_PASSPORT'>('CHECK_IN');
  const [allActiveDns, setAllActiveDns] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // ISO & Disruptive States
  const [safetyScore, setSafetyScore] = useState(98);
  const [fatigueLevel, setFatigueLevel] = useState(0); // 0-100
  const [ecoScore, setEcoScore] = useState(85);
  const [driveTime, setDriveTime] = useState(0); // seconds
  const [safetyEvents, setSafetyEvents] = useState<{ type: string, time: string }[]>([]);
  const [sealVerified, setSealVerified] = useState(false);
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);
  const [safetyAlertMsg, setSafetyAlertMsg] = useState('');

  // Exception State
  const [exceptionType, setExceptionType] = useState<string>('');
  const [exceptionNotes, setExceptionNotes] = useState<string>('');
  const [exceptionPhoto, setExceptionPhoto] = useState<string | null>(null);
  const [selectedExceptionItems, setSelectedExceptionItems] = useState<Record<number, boolean>>({});

  // Reconciliation State
  const [reconData, setReconData] = useState({
    codCollected: 0,
    returnedItemsCount: 0
  });

  // Payment & eTIMS State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [customerPhone, setCustomerPhone] = useState('');
  const [eTimsInvoice, setETimsInvoice] = useState<any>(null);
  const [isGeneratingEtims, setIsGeneratingEtims] = useState(false);

  // Inspection State
  const [inspectionData, setInspectionData] = useState<Record<string, { status: 'PASS' | 'FAIL', photo?: string }>>({});
  const inspectionItems = [
    { id: 'fuel', label: 'Fuel Level (>25%)' },
    { id: 'tires', label: 'Tire Pressure & Tread' },
    { id: 'brakes', label: 'Brake Fluid & Function' },
    { id: 'fluids', label: 'Oil & Coolant Levels' },
    { id: 'lights', label: 'Headlights & Indicators' },
    { id: 'gps', label: 'GPS Signal & Terminal' },
    { id: 'cleanliness', label: 'Vehicle Cleanliness' }
  ];

  // Evidence State
  const [pickedItems, setPickedItems] = useState<Record<number, boolean>>({});
  const [loadingConfirmed, setLoadingConfirmed] = useState(false);
  const [odoStart, setOdoStart] = useState('');
  const [odoEnd, setOdoEnd] = useState('');
  const [podPhoto, setPodPhoto] = useState<string | null>(null);
  const [podSignature, setPodSignature] = useState<string | null>(null);
  const [tempLog, setTempLog] = useState<string>('');
  const [isTempVerified, setIsTempVerified] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const isEnRouteStatus = currentDn?.status === DNStatus.IN_TRANSIT;
  const isAtSiteStatus = currentDn?.status === DNStatus.DELIVERED;
  
  // Audited GPS Telemetry: 15s interval configured in hooks
  const { syncing } = useTripTelemetry(currentDn?.id, step === 'EXECUTION' && isEnRouteStatus);
  const currentCoords = useGeolocation(step === 'EXECUTION' && (isEnRouteStatus || isAtSiteStatus), currentDn?.id);

  useEffect(() => {
    let interval: any;
    if (step === 'EXECUTION' && isEnRouteStatus) {
      interval = setInterval(() => {
        setDriveTime(prev => prev + 1);
        // Simulate fatigue increase every 10 mins
        if (driveTime % 600 === 0 && driveTime > 0) {
          setFatigueLevel(prev => Math.min(100, prev + 5));
        }
        // Random safety events simulation
        if (Math.random() > 0.995) {
          setSafetyScore(prev => Math.max(0, prev - 1));
          const event = { type: 'Harsh Braking', time: new Date().toLocaleTimeString() };
          setSafetyEvents(prev => [event, ...prev].slice(0, 5));
          setSafetyAlertMsg('Harsh Braking Detected');
          setShowSafetyAlert(true);
          setTimeout(() => setShowSafetyAlert(false), 3000);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, isEnRouteStatus, driveTime]);

  const liveDn = useMemo(() => {
    if (!currentDn) return null;
    return {
      ...currentDn,
      lastLat: currentCoords?.lat ?? currentDn.lastLat,
      lastLng: currentCoords?.lng ?? currentDn.lastLng,
    };
  }, [currentDn, currentCoords]);

  const distanceToTarget = (currentCoords && currentDn?.lat && currentDn?.lng) 
    ? calculateDistance(currentCoords.lat, currentCoords.lng, currentDn.lat, currentDn.lng)
    : null;

  useEffect(() => {
    syncService.startAutoSync();
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Harsh Braking Detection
    const handleMotion = (event: DeviceMotionEvent) => {
      const accel = event.accelerationIncludingGravity;
      if (!accel) return;
      
      const threshold = 15; // m/s^2
      const magnitude = Math.sqrt(accel.x!**2 + accel.y!**2 + accel.z!**2);
      
      if (magnitude > threshold) {
        logSafetyEvent('HARSH_BRAKING', 'MEDIUM');
      }
    };
    
    window.addEventListener('devicemotion', handleMotion);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  const logSafetyEvent = async (type: SafetyEventType, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    const event = {
      type,
      time: new Date().toLocaleTimeString(),
      severity
    };
    
    setSafetyEvents(prev => [event, ...prev].slice(0, 5));
    setSafetyScore(prev => Math.max(0, prev - (severity === 'CRITICAL' ? 10 : 2)));
    setSafetyAlertMsg(`${type.replace('_', ' ')} Detected`);
    setShowSafetyAlert(true);
    setTimeout(() => setShowSafetyAlert(false), 3000);

    if (!isOffline) {
      // api.logSafetyEvent(...)
    } else {
      await offlineDb.addPendingUpdate({
        type: 'EMERGENCY',
        targetId: currentDn?.id || 'global',
        data: { type, severity, lat: currentCoords?.lat, lng: currentCoords?.lng }
      });
    }
  };

  const handleSOS = async () => {
    await logSafetyEvent('SOS', 'CRITICAL');
    addNotification("SOS SIGNAL SENT TO DISPATCH", "error");
  };

  useEffect(() => { 
    if (user?.onDuty) {
      setStep('LIST');
    } else {
      setStep('CHECK_IN');
    }
    loadManifest();
    api.getFacilities().then(setFacilities);
  }, [user?.onDuty]);

  useEffect(() => {
    if (step === 'NOTIFICATIONS') {
      const unread = useAppStore.getState().notifications.filter(n => !n.read);
      unread.forEach(n => useAppStore.getState().markAsRead(n.id));
    }
  }, [step]);

  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const allDns = await api.getDeliveryNotes();
        setAllActiveDns(allDns.filter(d => d.status === DNStatus.IN_TRANSIT));
      } catch (e) {}
    };
    if (step === 'FLEET_MAP') {
      fetchFleet();
      const interval = setInterval(fetchFleet, 10000); // Update every 10s
      return () => clearInterval(interval);
    }
  }, [step]);

  const loadManifest = async () => {
    setLoading(true);
    try {
      let data: DeliveryNote[] = [];
      if (!isOffline) {
        data = await api.getDriverTrips(user?.id || '');
        // Cache to offlineDb
        await offlineDb.deliveryNotes.clear();
        await offlineDb.deliveryNotes.bulkAdd(data);
      } else {
        data = await offlineDb.deliveryNotes.toArray();
      }
      // Filter out reconciled trips too
      setDns(data.filter(d => d.status !== DNStatus.COMPLETED && d.status !== DNStatus.INVOICED));
    } catch (e) {
      console.error("Failed to load manifest", e);
      // Fallback to offline data if online fetch fails
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
      addNotification("Shift Started. Stay Safe.", "success");
      setStep('BRIEFING');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    setIsSubmitting(true);
    try {
      await api.clockOut(user?.id || '');
      useAuthStore.getState().updateUser({ onDuty: false });
      addNotification("Shift Ended. Reconcile with dispatch.", "info");
      setStep('CHECK_IN');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportException = async () => {
    if (!currentDn || !exceptionType || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updatedItems = currentDn.items.map((item, idx) => {
        if (selectedExceptionItems[idx]) {
          return {
            ...item,
            exceptionType: exceptionType as any,
            exceptionStatus: 'PENDING' as any,
            exceptionNotes: exceptionNotes
          };
        }
        return item;
      });

      await api.updateDNStatus(currentDn.id, DNStatus.EXCEPTION, {
        exceptionType,
        exceptionReason: exceptionNotes,
        notes: `Exception reported: ${exceptionType}. ${exceptionNotes}`,
        items: updatedItems
      }, user?.name);
      addNotification("Exception logged. Dispatch notified.", "error");
      setStep('LIST');
      setCurrentDn(null);
      setSelectedExceptionItems({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReconcile = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, we'd find the active trip ID
      const trips = await api.getTrips();
      const activeTrip = trips.find(t => t.driverId === user?.id && t.status === 'ACTIVE');
      if (activeTrip) {
        await api.reconcileTrip(activeTrip.id, reconData);
      }
      addNotification("Reconciliation complete.", "success");
      setStep('SUCCESS');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTrip = async () => {
    if (!currentDn || !odoStart || isSubmitting) return;
    const allPicked = Object.values(pickedItems).filter(Boolean).length === currentDn.items.length;
    if (!allPicked) {
      addNotification("Verify all cargo items before departure.", "error");
      return;
    }
    if (!sealVerified && currentDn.industry === 'MEDICAL') {
      addNotification("ISO 28000: Cargo seal verification required.", "error");
      return;
    }
    if (!loadingConfirmed) {
      addNotification("Confirm loading and manifest sign-off.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isOffline) {
        await offlineDb.addPendingUpdate({
          type: 'DN_STATUS',
          targetId: currentDn.id,
          data: { status: DNStatus.IN_TRANSIT, metadata: { odometerStart: parseFloat(odoStart) }, userName: user?.name }
        });
        addNotification("Offline: Trip started. Will sync when online.", "info");
      } else {
        await api.updateDNStatus(currentDn.id, DNStatus.IN_TRANSIT, { odometerStart: parseFloat(odoStart) }, user?.name);
      }
      await loadManifest();
      const updatedList = isOffline ? await offlineDb.deliveryNotes.toArray() : await api.getDeliveryNotes();
      const match = updatedList.find(u => u.id === currentDn.id);
      if (match) {
        setCurrentDn(match);
        setIsPanelExpanded(false);
        addNotification("Run Initialized. Tracking active.", "success");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArrival = async () => {
    if (!currentDn || !odoEnd || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (isOffline) {
        await offlineDb.addPendingUpdate({
          type: 'DN_STATUS',
          targetId: currentDn.id,
          data: { status: DNStatus.DELIVERED, metadata: { odometerEnd: parseFloat(odoEnd) }, userName: user?.name }
        });
        addNotification("Offline: Arrival logged. Will sync when online.", "info");
      } else {
        await api.updateDNStatus(currentDn.id, DNStatus.DELIVERED, { odometerEnd: parseFloat(odoEnd) }, user?.name);
      }
      await loadManifest();
      const updatedList = isOffline ? await offlineDb.deliveryNotes.toArray() : await api.getDeliveryNotes();
      const match = updatedList.find(u => u.id === currentDn.id);
      if (match) {
        setCurrentDn(match);
        setIsPanelExpanded(true);
        addNotification("Arrival Logged. Capture Evidence.", "success");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateEtims = async () => {
    if (!currentDn) return;
    setIsGeneratingEtims(true);
    try {
      const invoice = await api.generateEtimsInvoice(currentDn.id);
      setETimsInvoice(invoice);
      addNotification("KRA eTIMS Invoice generated successfully.", "success");
    } catch (error) {
      addNotification("Failed to generate eTIMS invoice.", "error");
    } finally {
      setIsGeneratingEtims(false);
    }
  };

  const handleComplete = async () => {
    if (!currentDn || isSubmitting) return;
    if (!podPhoto || !podSignature) {
      addNotification("Photo and Signature are mandatory for POD.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const podData = { 
        podImageUrl: podPhoto,
        signatureUrl: podSignature
      };
      if (isOffline) {
        await offlineDb.addPendingUpdate({
          type: 'DN_STATUS',
          targetId: currentDn.id,
          data: { status: DNStatus.COMPLETED, metadata: podData, userName: user?.name }
        });
        addNotification("Offline: POD captured. Will sync when online.", "info");
      } else {
        await api.updateDNStatus(currentDn.id, DNStatus.COMPLETED, podData, user?.name);
      }
      setStep('SUCCESS');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInspectionStatus = (id: string, status: 'PASS' | 'FAIL') => {
    setInspectionData(prev => ({ 
      ...prev, 
      [id]: { ...prev[id], status } 
    }));
  };

  const handleInspectionPhoto = (id: string) => {
    // Simulate photo capture
    setInspectionData(prev => ({
      ...prev,
      [id]: { ...prev[id], photo: `https://picsum.photos/seed/${id}-${Date.now()}/400/300` }
    }));
    addNotification(`Evidence captured for ${id}`, "success");
  };

  const submitInspection = async () => {
    const allDone = inspectionItems.every(item => inspectionData[item.id]?.status);
    if (!allDone) {
      addNotification("Please complete all inspection items.", "error");
      return;
    }

    const failures = inspectionItems.filter(item => inspectionData[item.id]?.status === 'FAIL');
    const needsPhoto = failures.some(item => !inspectionData[item.id]?.photo);
    
    if (needsPhoto) {
      addNotification("Photo evidence required for all failures.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const status = failures.length > 0 ? 'FAIL' : 'PASS';
      await api.saveInspection({
        driverId: user?.id || 'unknown',
        vehicleId: 'v-1', // Mock vehicle
        items: {
          tires: inspectionData.tires.status,
          brakes: inspectionData.brakes.status,
          fluids: inspectionData.fluids.status,
          lights: inspectionData.lights.status
        },
        photos: Object.fromEntries(
          Object.entries(inspectionData)
            .filter(([_, v]) => (v as any).photo)
            .map(([k, v]) => [k, (v as any).photo!])
        ),
        status
      });

      if (status === 'FAIL') {
        addNotification("Inspection failed. Maintenance has been notified.", "error");
      } else {
        addNotification("Inspection completed successfully.", "success");
      }
      setStep('LIST');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'BRIEFING') return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col p-8 text-white">
      <div className="flex-1 flex flex-col justify-center space-y-12">
        <div className="space-y-4">
          <p className="text-brand-accent font-black uppercase tracking-[0.3em] text-[10px]">Mission Briefing</p>
          <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Good Morning,<br/>{user?.name.split(' ')[0]}</h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex items-center gap-6">
            <div className="h-14 w-14 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Truck size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Today's Load</p>
              <h4 className="text-xl font-black uppercase tracking-tight">{dns.length} Deliveries</h4>
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex items-center gap-6">
            <div className="h-14 w-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Safety Focus</p>
              <h4 className="text-xl font-black uppercase tracking-tight">Wet Road Conditions</h4>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Route Summary</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white/60">
              <div className="h-2 w-2 rounded-full bg-brand"></div>
              <span className="text-xs font-bold uppercase tracking-tight">Nairobi Central Hub</span>
            </div>
            <div className="h-8 w-px bg-white/10 ml-1"></div>
            <div className="flex items-center gap-3 text-white/60">
              <div className="h-2 w-2 rounded-full bg-brand-accent"></div>
              <span className="text-xs font-bold uppercase tracking-tight">Mombasa Road Corridor</span>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setStep('INSPECTION')}
        className="w-full py-6 bg-brand text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
      >
        Start Pre-Trip Inspection
      </button>
    </div>
  );

  if (step === 'CHECK_IN') return (
    <div className="h-screen flex flex-col items-center justify-center p-12 text-center bg-white animate-in fade-in duration-700">
      <div className="h-24 w-24 bg-brand text-white rounded-full flex items-center justify-center mb-8 shadow-2xl scale-110">
        <Clock size={48} strokeWidth={3} />
      </div>
      <h2 className="text-3xl font-black mb-2 tracking-tighter uppercase text-slate-900">Shift Start</h2>
      <p className="text-slate-400 font-bold mb-12 uppercase text-[10px] tracking-[0.25em]">Clock in to receive assignments.</p>
      <button 
        onClick={handleClockIn} 
        disabled={isSubmitting}
        className="w-full max-w-xs bg-brand text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 shadow-lg flex items-center justify-center gap-3"
      >
        {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <><Play size={16} fill="currentColor" /> Clock In</>}
      </button>
      <button 
        onClick={() => { logout(); navigate('/login'); }} 
        className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-red-500 transition-colors"
      >
        Terminate Session
      </button>
    </div>
  );

  if (step === 'EXCEPTION') return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="px-6 py-6 border-b border-slate-200 flex justify-between items-center sticky top-0 z-30 bg-white/80 backdrop-blur-xl pt-12">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep('EXECUTION')} className="p-2 bg-slate-50 rounded-xl text-slate-400">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black tracking-tighter uppercase text-slate-900">Report Issue</h1>
        </div>
      </header>
      <main className="flex-1 p-4 space-y-6 overflow-y-auto pb-32">
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3">
          <AlertTriangle className="text-red-500 shrink-0" size={20} />
          <p className="text-[10px] font-bold text-red-700 uppercase leading-relaxed">Reporting an exception will pause this delivery. Provide clear details for dispatch.</p>
        </div>

        <div className="space-y-4">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Category</p>
           <div className="grid grid-cols-2 gap-3">
              {['REJECTED', 'UNREACHABLE', 'DAMAGED', 'SHORTAGE', 'BREAKDOWN', 'OTHER'].map(type => (
                <button 
                  key={type}
                  onClick={() => setExceptionType(type)}
                  className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-tight transition-all ${exceptionType === type ? 'bg-red-500 text-white border-red-500 shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}
                >
                  {type}
                </button>
              ))}
           </div>
        </div>

        <div className="space-y-4">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes & Evidence</p>
           <textarea 
             value={exceptionNotes}
             onChange={(e) => setExceptionNotes(e.target.value)}
             placeholder="Describe the situation..."
             className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:border-brand outline-none min-h-[120px]"
           />
           <button 
             onClick={() => setExceptionPhoto(`https://picsum.photos/seed/exc-${Date.now()}/400/300`)}
             className="w-full py-4 border border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-3 text-slate-400 hover:text-brand transition-colors"
           >
              {exceptionPhoto ? <img src={exceptionPhoto} className="h-6 w-8 object-cover rounded" /> : <CameraIcon size={20} />}
              <span className="text-[10px] font-black uppercase tracking-widest">{exceptionPhoto ? 'Photo Captured' : 'Attach Photo Evidence'}</span>
           </button>
        </div>

        <div className="space-y-4">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Flag Affected Items (Optional)</p>
           <div className="space-y-2">
              {currentDn?.items.map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedExceptionItems(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  className={`w-full p-3 rounded-xl border text-[10px] font-black uppercase flex items-center justify-between transition-all ${selectedExceptionItems[idx] ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-400'}`}
                >
                  <span>{item.qty} {item.unit} {item.name}</span>
                  {selectedExceptionItems[idx] && <AlertCircle size={14} />}
                </button>
              ))}
           </div>
        </div>

        <button 
          onClick={handleReportException}
          disabled={!exceptionType || isSubmitting}
          className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <><AlertCircle size={20} /> Log Exception</>}
        </button>
      </main>
    </div>
  );

  if (step === 'RECONCILIATION') return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="px-6 py-6 border-b border-slate-200 flex justify-between items-center sticky top-0 z-30 bg-white/80 backdrop-blur-xl pt-12">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep('LIST')} className="p-2 bg-slate-50 rounded-xl text-slate-400">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black tracking-tighter uppercase text-slate-900">Post-Trip Audit</h1>
        </div>
      </header>
      <main className="flex-1 p-4 space-y-6 overflow-y-auto pb-32">
        <div className="bg-brand/5 border border-brand/10 p-4 rounded-2xl flex gap-3">
          <ClipboardCheck className="text-brand shrink-0" size={20} />
          <p className="text-[10px] font-bold text-brand uppercase leading-relaxed">Final reconciliation of cash and returns. Accuracy is mandatory for shift closure.</p>
        </div>

        <div className="space-y-6">
           <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">COD Cash Collected (USD)</p>
              <input 
                type="number" 
                value={isNaN(reconData.codCollected) ? '' : reconData.codCollected}
                onChange={(e) => setReconData(prev => ({ ...prev, codCollected: parseFloat(e.target.value) || 0 }))}
                className="w-full text-4xl font-black text-slate-900 outline-none tracking-tighter"
                placeholder="0.00"
              />
           </div>

           <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Returned Items Count</p>
              <div className="flex items-center justify-between">
                 <button onClick={() => setReconData(prev => ({ ...prev, returnedItemsCount: Math.max(0, prev.returnedItemsCount - 1) }))} className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">-</button>
                 <span className="text-4xl font-black text-slate-900">{reconData.returnedItemsCount}</span>
                 <button onClick={() => setReconData(prev => ({ ...prev, returnedItemsCount: prev.returnedItemsCount + 1 }))} className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">+</button>
              </div>
           </div>
        </div>

        <div className="p-6 bg-slate-900 text-white rounded-[2rem] space-y-4">
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Successful Drops</span>
              <span className="text-sm font-black">12</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Exceptions Logged</span>
              <span className="text-sm font-black text-red-400">1</span>
           </div>
           <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest">Total Reconciled</span>
              <span className="text-xl font-black text-emerald-400">${reconData.codCollected.toLocaleString()}</span>
           </div>
        </div>

        <button 
          onClick={handleReconcile}
          disabled={isSubmitting}
          className="w-full py-5 bg-brand text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <><FileCheck size={20} /> Finalize Reconciliation</>}
        </button>
      </main>
    </div>
  );

  if (step === 'SUCCESS') return (
    <div className="h-screen flex flex-col items-center justify-center p-12 text-center bg-white animate-in fade-in duration-700">
      <div className="h-24 w-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-8 shadow-2xl scale-110">
        <ShieldCheck size={48} strokeWidth={3} />
      </div>
      <h2 className="text-3xl font-black mb-2 tracking-tighter uppercase text-slate-900">Run Complete</h2>
      <p className="text-slate-400 font-bold mb-12 uppercase text-[10px] tracking-[0.25em]">Audit Synchronized.</p>
      <button 
        onClick={() => { 
          setStep('LIST'); 
          setCurrentDn(null); 
          setPickedItems({}); 
          setOdoStart(''); 
          setOdoEnd(''); 
          setSelectedExceptionItems({});
        }} 
        className="w-full max-w-xs bg-brand text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 shadow-lg"
      >
        Dismiss Terminal
      </button>
    </div>
  );

  if (step === 'NOTIFICATIONS') return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="px-6 py-6 border-b border-slate-200 flex justify-between items-center sticky top-0 z-30 bg-white/80 backdrop-blur-xl pt-12">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep('LIST')} className="p-2 bg-slate-50 rounded-xl text-slate-400">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black tracking-tighter uppercase text-slate-900">Alerts</h1>
        </div>
      </header>
      <main className="flex-1 p-4 space-y-3 overflow-y-auto pb-32">
        {useAppStore.getState().notifications.length === 0 ? (
          <div className="py-40 text-center px-10 opacity-20">
            <AlertCircle size={60} strokeWidth={1} className="mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">No Active Alerts</p>
          </div>
        ) : (
          useAppStore.getState().notifications.map(n => (
            <div key={n.id} className={`p-4 rounded-2xl border bg-white shadow-sm flex gap-4 ${!n.read ? 'border-l-4 border-l-brand' : 'border-slate-100'}`}>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'error' ? 'bg-red-50 text-red-500' : n.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                {n.type === 'error' ? <AlertCircle size={20} /> : n.type === 'success' ? <Check size={20} /> : <Info size={20} />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight mb-1">{n.message}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase">{new Date(n.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          ))
        )}
      </main>
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-8 pb-10 pt-4 z-40 flex justify-between items-center">
         <button onClick={() => setStep('LIST')} className="flex flex-col items-center gap-1.5 text-slate-300">
            <Truck size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Manifest</span>
         </button>
         <button onClick={() => setStep('NOTIFICATIONS')} className="flex flex-col items-center gap-1.5 text-brand">
            <AlertCircle size={20} strokeWidth={3} />
            <span className="text-[8px] font-black uppercase tracking-widest">Alerts</span>
         </button>
         <button onClick={() => setShowMenu(true)} className="flex flex-col items-center gap-1.5 text-slate-300">
            <Menu size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Menu</span>
         </button>
      </div>
    </div>
  );

  if (step === 'INSPECTION') return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="px-6 py-6 border-b border-slate-200 flex justify-between items-center sticky top-0 z-30 bg-white/80 backdrop-blur-xl pt-12">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep('LIST')} className="p-2 bg-slate-50 rounded-xl text-slate-400">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black tracking-tighter uppercase text-slate-900">Safety Check</h1>
        </div>
      </header>
      <main className="flex-1 p-4 space-y-6 overflow-y-auto pb-32">
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
          <AlertCircle className="text-amber-500 shrink-0" size={20} />
          <p className="text-[10px] font-bold text-amber-700 uppercase leading-relaxed">Mandatory daily inspection. Mark each item and provide photo evidence for any failures.</p>
        </div>

        <div className="space-y-3">
          {inspectionItems.map(item => {
            const data = inspectionData[item.id];
            return (
              <div key={item.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-4 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-tight text-slate-900">{item.label}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleInspectionStatus(item.id, 'PASS')}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${data?.status === 'PASS' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                    >
                      Pass
                    </button>
                    <button 
                      onClick={() => handleInspectionStatus(item.id, 'FAIL')}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${data?.status === 'FAIL' ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                    >
                      Fail
                    </button>
                  </div>
                </div>
                {data?.status === 'FAIL' && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-50 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {data.photo ? (
                          <div className="h-12 w-16 rounded-lg overflow-hidden border border-slate-200">
                            <img src={data.photo} className="h-full w-full object-cover" alt="Evidence" />
                          </div>
                        ) : (
                          <div className="h-12 w-16 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                            <CameraOff size={20} />
                          </div>
                        )}
                        <button onClick={() => handleInspectionPhoto(item.id)} className="text-[9px] font-black text-brand uppercase flex items-center gap-1">
                          <CameraIcon size={14} /> {data.photo ? 'Retake' : 'Capture Photo'}
                        </button>
                      </div>
                      {data.photo && <Check className="text-emerald-500" size={20} />}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button 
          onClick={submitInspection}
          disabled={isSubmitting}
          className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> Finalize Safety Report</>}
        </button>
      </main>
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-8 pb-10 pt-4 z-40 flex justify-between items-center">
         <button onClick={() => setStep('LIST')} className="flex flex-col items-center gap-1.5 text-slate-300">
            <Truck size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Manifest</span>
         </button>
         <button onClick={() => setStep('INSPECTION')} className="flex flex-col items-center gap-1.5 text-brand">
            <ShieldCheck size={20} strokeWidth={3} />
            <span className="text-[8px] font-black uppercase tracking-widest">Safety</span>
         </button>
         <button onClick={() => setShowMenu(true)} className="flex flex-col items-center gap-1.5 text-slate-300">
            <Menu size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Menu</span>
         </button>
      </div>
    </div>
  );

  if (step === 'LIST') return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="px-6 py-6 border-b border-slate-200 flex justify-between items-center sticky top-0 z-30 bg-white/80 backdrop-blur-xl pt-12">
        <div>
          <p className="text-[8px] font-black text-brand-accent uppercase tracking-widest mb-1">Field Terminal</p>
          <h1 className="text-xl font-black tracking-tighter uppercase text-slate-900">Mission Control</h1>
        </div>
        <div className="flex gap-2">
          {isOffline && (
            <div className="flex items-center gap-1 px-3 bg-amber-50 rounded-xl border border-amber-100">
              <Wifi size={12} className="text-amber-500" />
              <span className="text-[8px] font-black text-amber-600 uppercase">Offline</span>
            </div>
          )}
          <button 
            onClick={handleSOS}
            className="h-12 px-4 rounded-xl bg-red-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-200 active:scale-95 flex items-center gap-2"
          >
            <Zap size={16} fill="currentColor" /> SOS
          </button>
          <div className="flex flex-col items-end justify-center mr-2">
            <div className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span className="text-[10px] font-black text-slate-900">{safetyScore}%</span>
            </div>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Safety Aura</p>
          </div>
          <button onClick={() => setStep('NOTIFICATIONS')} className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center active:scale-90 shadow-sm relative">
            <AlertCircle size={20} />
            {useAppStore.getState().notifications.some(n => !n.read) && (
              <span className="absolute top-3 right-3 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
          <button onClick={() => setShowMenu(true)} className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center active:scale-90 shadow-sm">
            <Menu size={20} />
          </button>
        </div>
      </header>
      <main className="flex-1 p-3 space-y-2 pb-32 overflow-y-auto">
        {/* ISO 39001: Fatigue & Eco Dashboard */}
        <div className="grid grid-cols-2 gap-3 mb-4">
           <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                 <Clock size={14} className="text-brand" />
                 <span className="text-[10px] font-black text-slate-900">{Math.floor(driveTime / 3600)}h {Math.floor((driveTime % 3600) / 60)}m</span>
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Duty Time</p>
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-brand transition-all duration-1000" style={{ width: `${(driveTime / 32400) * 100}%` }} />
              </div>
           </div>
           <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                 <Activity size={14} className="text-emerald-500" />
                 <span className="text-[10px] font-black text-slate-900">{ecoScore}%</span>
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Eco Efficiency</p>
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${ecoScore}%` }} />
              </div>
           </div>
        </div>

        {loading ? [1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse bg-white border border-slate-100" />) : 
          dns.length === 0 ? (
            <div className="py-20 text-center px-10">
               <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} />
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">All deliveries completed</p>
               <button 
                 onClick={() => setStep('RECONCILIATION')}
                 className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                  <ClipboardCheck size={20} /> Reconcile & End Shift
               </button>
            </div>
          ) :
          dns.map(dn => (
            <button key={dn.id} onClick={() => { setCurrentDn(dn); setStep('EXECUTION'); setOdoStart(dn.odometerStart?.toString() || ''); setIsPanelExpanded(true); }} 
              className="w-full p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all text-left relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 px-2 py-0.5 text-[6px] font-black uppercase tracking-widest ${dn.type === LogisticsType.INBOUND ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {dn.type}
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${dn.status === DNStatus.IN_TRANSIT ? 'bg-brand text-white border-brand' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                {dn.status === DNStatus.IN_TRANSIT ? <Navigation size={22} className="animate-pulse" /> : 
                  dn.type === LogisticsType.INBOUND ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[7px] font-black text-brand-accent uppercase tracking-widest mb-0.5">{dn.externalId}</p>
                <h4 className="font-black text-xs tracking-tight text-slate-900 uppercase truncate mb-0.5">{dn.clientName}</h4>
                <p className="text-[9px] font-bold uppercase truncate text-slate-400 tracking-tight">{dn.address}</p>
              </div>
              <ChevronRight size={16} className="text-slate-200" />
            </button>
          ))
        }
      </main>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-6 pb-10 pt-4 z-40 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
         <button onClick={() => setStep('LIST')} className="flex flex-col items-center gap-1.5 text-brand">
            <Truck size={20} strokeWidth={3} />
            <span className="text-[8px] font-black uppercase tracking-widest">Manifest</span>
         </button>
         <button onClick={() => setStep('INSPECTION')} className="flex flex-col items-center gap-1.5 text-slate-300 hover:text-slate-600 transition-colors">
            <ShieldCheck size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Safety</span>
         </button>
         <button onClick={() => setStep('NOTIFICATIONS')} className="flex flex-col items-center gap-1.5 text-slate-300 hover:text-slate-600 transition-colors relative">
            <AlertCircle size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Alerts</span>
            {useAppStore.getState().notifications.some(n => !n.read) && (
              <span className="absolute top-0 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
            )}
         </button>
         <button onClick={() => navigate('/driver/hub')} className="flex flex-col items-center gap-1.5 text-slate-300 hover:text-slate-600 transition-colors">
            <Activity size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Hub</span>
         </button>
         <button onClick={() => setShowMenu(true)} className="flex flex-col items-center gap-1.5 text-slate-300 hover:text-slate-600 transition-colors">
            <Menu size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Menu</span>
         </button>
      </div>

      <div className="fixed bottom-2 left-0 right-0 flex justify-center pointer-events-none z-[45]">
         <div className="px-3 py-1 bg-slate-900/10 backdrop-blur-sm rounded-full border border-slate-900/5 flex items-center gap-2">
            <ShieldCheck size={8} className="text-emerald-500" />
            <span className="text-[6px] font-black text-slate-400 uppercase tracking-[0.2em]">ISO 39001 • ISO 9001 • ISO 28000 Compliant Architecture</span>
         </div>
      </div>

      {/* Driver Hub Menu Overlay */}
      {quickActionOpen && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 animate-in slide-in-from-bottom-10 duration-500">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Tactical Actions</h3>
                 <button onClick={() => setQuickActionOpen(false)} className="p-2 bg-slate-100 rounded-xl text-slate-400"><X size={20}/></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={() => { setQuickActionOpen(false); setStep('EXCEPTION'); }}
                   className="p-6 bg-red-50 border border-red-100 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all"
                 >
                    <div className="h-12 w-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                       <AlertTriangle size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Report Issue</span>
                 </button>
                 <button 
                   onClick={() => { setQuickActionOpen(false); addNotification('Fuel logging coming soon', 'info'); }}
                   className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all"
                 >
                    <div className="h-12 w-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                       <Activity size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Log Fuel</span>
                 </button>
                 <button 
                   onClick={() => { setQuickActionOpen(false); setStep('INSPECTION'); }}
                   className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all"
                 >
                    <div className="h-12 w-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                       <ShieldCheck size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Safety Check</span>
                 </button>
                 <button 
                   onClick={() => { setQuickActionOpen(false); addNotification('Connecting to Dispatch...', 'info'); }}
                   className="p-6 bg-brand/5 border border-brand/10 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all"
                 >
                    <div className="h-12 w-12 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                       <Phone size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand">Quick Support</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Floating Quick Action Button */}
      {step === 'LIST' && !quickActionOpen && (
        <button 
          onClick={() => setQuickActionOpen(true)}
          className="fixed bottom-28 right-6 h-14 w-14 bg-brand text-white rounded-2xl shadow-2xl flex items-center justify-center z-[100] active:scale-90 transition-all border-4 border-white animate-bounce"
        >
           <Zap size={24} fill="currentColor" />
        </button>
      )}

      {/* Driver Hub Menu Overlay */}
      {/* Safety Alert Overlay */}
      {showSafetyAlert && (
        <div className="fixed top-24 left-4 right-4 z-[100] animate-in slide-in-from-top-8 duration-300">
           <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20">
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
                 <AlertTriangle size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Safety Alert</p>
                 <p className="text-sm font-black uppercase tracking-tight">{safetyAlertMsg}</p>
              </div>
           </div>
        </div>
      )}

      {showMenu && (
        <div className="fixed inset-0 z-[5000] bg-brand/60 backdrop-blur-xl flex flex-col p-6 animate-in fade-in duration-300">
           <header className="flex justify-between items-center mb-12 pt-8">
              <div className="flex items-center gap-4">
                 <div className="h-14 w-14 rounded-2xl bg-white text-brand flex items-center justify-center text-xl font-black shadow-2xl">
                    {user?.name.charAt(0)}
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-1">{user?.name}</h2>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Pilot ID: {user?.id.split('-')[1] || '772'}</p>
                 </div>
              </div>
              <button onClick={() => setShowMenu(false)} className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-white active:scale-90 transition-all">
                 <X size={24} />
              </button>
           </header>

            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pb-10">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-6">Operations Hub</p>
              
              <button 
                onClick={() => { setShowMenu(false); setStep('LIST'); }}
                className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-6 group active:bg-white/10 transition-all"
              >
                 <div className="h-12 w-12 rounded-xl bg-brand text-white flex items-center justify-center shadow-lg"><Truck size={24} /></div>
                 <div className="text-left">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Active Manifest</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase">View current delivery queue</p>
                 </div>
                 <ChevronRight size={20} className="ml-auto text-white/20" />
              </button>

              <button 
                onClick={() => { setShowMenu(false); setStep('SAFETY_PASSPORT'); }}
                className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-6 group active:bg-white/10 transition-all"
              >
                 <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg"><ShieldCheck size={24} /></div>
                 <div className="text-left">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Safety Passport</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase">ISO 39001 Compliance Profile</p>
                 </div>
                 <ChevronRight size={20} className="ml-auto text-white/20" />
              </button>

              <button 
                onClick={() => { setShowMenu(false); setStep('INSPECTION'); }}
                className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-6 group active:bg-white/10 transition-all"
              >
                 <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg"><ShieldCheck size={24} /></div>
                 <div className="text-left">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Vehicle Inspection</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase">Daily safety checklist</p>
                 </div>
                 <ChevronRight size={20} className="ml-auto text-white/20" />
              </button>

              <button 
                onClick={() => { setShowMenu(false); setStep('NOTIFICATIONS'); }}
                className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-6 group active:bg-white/10 transition-all"
              >
                 <div className="h-12 w-12 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg"><AlertCircle size={24} /></div>
                 <div className="text-left">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Notifications</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase">Urgent alerts & messages</p>
                 </div>
                 <ChevronRight size={20} className="ml-auto text-white/20" />
              </button>

              <button 
                onClick={() => navigate('/driver/hub')}
                className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-6 group active:bg-white/10 transition-all"
              >
                 <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg"><Activity size={24} /></div>
                 <div className="text-left">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Driver Hub</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase">Performance & Safety Tools</p>
                 </div>
                 <ChevronRight size={20} className="ml-auto text-white/20" />
              </button>

              <button 
                onClick={() => { setStep('FLEET_MAP'); setShowMenu(false); }}
                 className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-6 group active:bg-white/10 transition-all"
               >
                  <div className="h-12 w-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg"><Navigation2 size={24} /></div>
                  <div className="text-left">
                     <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Fleet Map</h4>
                     <p className="text-[9px] font-bold text-white/40 uppercase">Real-time network visibility</p>
                  </div>
                  <ChevronRight size={20} className="ml-auto text-white/20" />
               </button>

               <button 
                 onClick={() => navigate('/profile')}
                className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-6 group active:bg-white/10 transition-all"
              >
                 <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg"><UserIcon size={24} /></div>
                 <div className="text-left">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Identity Terminal</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase">Manage profile & security</p>
                 </div>
                 <ChevronRight size={20} className="ml-auto text-white/20" />
              </button>

              <button 
                onClick={() => navigate('/settings')}
                className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-6 group active:bg-white/10 transition-all"
              >
                 <div className="h-12 w-12 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-lg"><Settings size={24} /></div>
                 <div className="text-left">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Config</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase">App preferences</p>
                 </div>
                 <ChevronRight size={20} className="ml-auto text-white/20" />
              </button>
           </div>

           <div className="pt-6 border-t border-white/10 space-y-4">
              <button 
                onClick={handleClockOut}
                className="w-full py-6 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase text-xs tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                 <LogOut size={20} /> End Shift & Clock Out
              </button>
              <button 
                onClick={async () => { 
                  try { await api.logout(); } catch (e) {}
                  logout(); 
                  navigate('/login'); 
                }}
                className="w-full py-4 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-white transition-colors"
              >
                 Terminate Active Session
              </button>
           </div>
        </div>
      )}
    </div>
  );

  if (step === 'SAFETY_PASSPORT') return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col p-6 pt-16">
      <header className="flex justify-between items-center mb-12">
        <button onClick={() => setStep('LIST')} className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-white">
          <ChevronLeft size={24} />
        </button>
        <div className="text-right">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Safety Passport</h2>
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">ISO 39001 Certified</p>
        </div>
      </header>

      <main className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-32">
        <div className="relative p-8 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2.5rem] text-white shadow-2xl overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck size={120} />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">Global Safety Score</p>
              <h3 className="text-6xl font-black tracking-tighter mb-6">{safetyScore}%</h3>
              <div className="flex gap-4">
                 <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Rank</p>
                    <p className="text-xs font-black uppercase">Elite Pilot</p>
                 </div>
                 <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">ISO Status</p>
                    <p className="text-xs font-black uppercase text-emerald-300">Compliant</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem]">
              <Activity size={24} className="text-emerald-500 mb-4" />
              <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Eco Efficiency</p>
              <h4 className="text-2xl font-black text-white">{ecoScore}%</h4>
           </div>
           <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem]">
              <Clock size={24} className="text-amber-500 mb-4" />
              <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Rest Compliance</p>
              <h4 className="text-2xl font-black text-white">100%</h4>
           </div>
        </div>

        <div className="space-y-4">
           <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Recent Safety Events</h3>
           {safetyEvents.length === 0 ? (
             <div className="p-8 bg-white/5 border border-white/5 rounded-[2rem] text-center">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">No incidents recorded</p>
             </div>
           ) : (
             safetyEvents.map((e, i) => (
               <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                        <AlertTriangle size={20} />
                     </div>
                     <div>
                        <p className="text-xs font-black text-white uppercase tracking-tight">{e.type}</p>
                        <p className="text-[9px] font-bold text-white/40 uppercase">{e.time}</p>
                     </div>
                  </div>
                  <Badge variant="exception" className="bg-red-500/20 text-red-500 border-red-500/20">-1%</Badge>
               </div>
             ))
           )}
        </div>
      </main>
    </div>
  );

  if (step === 'FLEET_MAP') return (
    <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col">
       <div className="p-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-4">
             <button onClick={() => setStep('LIST')} className="p-2 text-white/40 hover:text-white transition-colors"><ChevronLeft size={24}/></button>
             <div>
                <h2 className="text-sm font-black text-white uppercase tracking-tight">Fleet Network</h2>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Active Pilot Locations</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
             <span className="text-[10px] font-black text-white uppercase tracking-widest">Network Pulse Active</span>
          </div>
       </div>
       
       <div className="flex-1 relative">
          <MapEngine 
            dns={allActiveDns} 
            facilities={facilities} 
            className="h-full w-full"
            followDriver={false}
          />
          
          <div className="absolute bottom-10 left-6 right-6 pointer-events-none">
             <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 pointer-events-auto shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Active Pilots</h3>
                   <Badge variant="transit">{allActiveDns.length} Online</Badge>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                   {allActiveDns.map(dn => (
                      <div key={dn.id} className="shrink-0 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                         <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-white">
                            {dn.driverId?.substring(0, 2).toUpperCase()}
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-white uppercase">{dn.clientName.split(' ')[0]}</p>
                            <p className="text-[8px] font-bold text-white/40 uppercase">{dn.externalId}</p>
                         </div>
                      </div>
                   ))}
                   {allActiveDns.length === 0 && (
                      <p className="text-[10px] font-bold text-white/20 uppercase py-4">No other pilots currently active</p>
                   )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  if (step === 'EXECUTION' && currentDn) {
    const isPreStart = [DNStatus.RECEIVED, DNStatus.DISPATCHED, DNStatus.LOADED].includes(currentDn.status);
    const isEnRoute = currentDn.status === DNStatus.IN_TRANSIT;
    const isAtSite = currentDn.status === DNStatus.DELIVERED;

    return (
      <div className="h-screen flex flex-col font-sans bg-slate-100 overflow-hidden relative">
        <div className="flex-1 relative">
           <MapEngine 
            dns={liveDn ? [liveDn as any] : []} 
            facilities={facilities} 
            focusedDnId={currentDn.id} 
            followDriver={true} 
            className="w-full h-full" 
           />
           
           <div className="absolute top-14 left-4 right-4 z-[2000] flex flex-col gap-2 pointer-events-none">
              <div className="bg-brand text-white p-5 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl flex-1 max-w-[280px] pointer-events-auto">
                 <p className="text-[7px] font-black text-white/40 uppercase tracking-widest mb-1.5">
                   {currentDn.type === LogisticsType.INBOUND ? 'Warehouse Consignee' : 'End Customer'}
                 </p>
                 <h4 className="text-xs font-black truncate uppercase leading-none tracking-tight">{currentDn.address}</h4>
                 <div className="flex items-center justify-between mt-1">
                   <p className="text-[8px] font-bold text-white/60 uppercase truncate">{currentDn.clientName}</p>
                   <button 
                     onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentDn.address)}`, '_blank')}
                     className="h-6 px-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-black uppercase text-[7px] flex items-center gap-1 transition-colors pointer-events-auto"
                   >
                     <Navigation size={10} /> Navigate
                   </button>
                 </div>
              </div>
              {currentDn.originName && (
                <div className="bg-white/90 text-slate-900 p-4 rounded-2xl shadow-xl border border-slate-200 backdrop-blur-xl flex-1 max-w-[280px] pointer-events-auto">
                   <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                     {currentDn.type === LogisticsType.INBOUND ? 'Supplier Origin' : 'Warehouse Origin'}
                   </p>
                   <h4 className="text-[10px] font-black truncate uppercase leading-none tracking-tight">{currentDn.originName}</h4>
                   <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 truncate">{currentDn.originAddress}</p>
                </div>
              )}
           </div>
           <div className="absolute top-14 right-4 z-[2000] flex flex-col gap-2 pointer-events-auto">
              <button onClick={() => setStep('LIST')} className="h-12 w-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-300 active:scale-90 border border-slate-200"><X size={22} /></button>
              <button onClick={() => setStep('EXCEPTION')} className="h-12 w-12 bg-red-50 text-red-500 rounded-xl shadow-lg flex items-center justify-center active:scale-90 border border-red-100"><AlertTriangle size={22} /></button>
              <button onClick={() => addNotification("ISO 9001: SOP - Ensure vehicle is locked during delivery.", "info")} className="h-12 w-12 bg-blue-50 text-blue-500 rounded-xl shadow-lg flex items-center justify-center active:scale-90 border border-blue-100"><Info size={22} /></button>
           </div>
           
           {isEnRoute && (
             <div className="absolute bottom-[280px] right-4 z-[2000] animate-in slide-in-from-right-4">
                <div className="bg-brand text-white px-5 py-4 rounded-2xl shadow-2xl flex flex-col items-center border border-white/10">
                   <p className="text-[7px] font-black text-white/40 uppercase mb-1.5 tracking-widest">ETA Check</p>
                   <p className="text-2xl font-black tracking-tighter leading-none">{distanceToTarget ? `${distanceToTarget.toFixed(1)}km` : '--'}</p>
                </div>
             </div>
           )}
        </div>

        {/* Tactile Execution Drawer */}
        <div className={`absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 rounded-t-[2.5rem] shadow-[0_-10px_50px_rgba(0,0,0,0.1)] z-[2500] transition-all duration-500 ease-out flex flex-col ${isPanelExpanded ? 'max-h-[65vh]' : 'max-h-[120px]'}`}>
           <button onClick={() => setIsPanelExpanded(!isPanelExpanded)} className="w-full py-3 flex items-center justify-center text-slate-200 group">
              <div className="h-1 w-10 bg-slate-200 rounded-full group-hover:bg-slate-300 transition-colors" />
           </button>

           <div className={`px-6 overflow-y-auto no-scrollbar pb-8 space-y-6 transition-opacity duration-300 ${isPanelExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              
              {/* Step 1: Pre-Departure */}
              {isPreStart && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                   <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-1">
                        {currentDn.type === LogisticsType.INBOUND ? 'Supplier Pickup Protocol' : 'Warehouse Dispatch Protocol'}
                      </h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {currentDn.type === LogisticsType.INBOUND ? 'Verify Supplier Goods & Log Meter' : 'Verify Customer Order & Log Meter'}
                      </p>
                   </div>
                   
                   {currentDn.notes && (
                     <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                        <div>
                           <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1">Special Notes</p>
                           <p className="text-[10px] font-bold text-amber-700">{currentDn.notes}</p>
                        </div>
                     </div>
                   )}

                   <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo Verification</p>
                      <div className="space-y-2">
                        {currentDn.items.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between">
                              <button onClick={() => setPickedItems(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-black uppercase transition-all flex items-center gap-2 ${pickedItems[idx] ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-400'}`}
                              >
                                <div className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center ${pickedItems[idx] ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200'}`}>
                                    {pickedItems[idx] && <Check size={8} strokeWidth={4} className="text-white" />}
                                </div>
                                <span className="truncate">{item.qty} {item.unit} {item.name}</span>
                              </button>
                              {item.isHazardous && (
                                <div className="ml-2 px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg flex items-center gap-1 animate-pulse">
                                  <AlertTriangle size={10} />
                                  <span className="text-[8px] font-black uppercase">Hazmat</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4 px-1">
                              {item.sku && (
                                <div className="flex flex-col">
                                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">SKU</span>
                                  <span className="text-[9px] font-bold text-slate-600 uppercase">{item.sku}</span>
                                </div>
                              )}
                              {item.dimensions && (
                                <div className="flex flex-col">
                                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Dimensions</span>
                                  <span className="text-[9px] font-bold text-slate-600 uppercase">
                                    {item.dimensions.length}x{item.dimensions.width}x{item.dimensions.height} {item.dimensions.unit}
                                  </span>
                                </div>
                              )}
                              {item.isHazardous && item.hazardClass && (
                                <div className="flex flex-col">
                                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Class</span>
                                  <span className="text-[9px] font-bold text-red-600 uppercase">{item.hazardClass}</span>
                                </div>
                              )}
                            </div>

                            {item.exceptionType && (
                              <div className="mt-1 p-2 bg-amber-50 border border-amber-100 rounded-xl flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <AlertCircle size={10} className="text-amber-600" />
                                    <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest">Exception: {item.exceptionType}</span>
                                  </div>
                                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                                    item.exceptionStatus === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                                    item.exceptionStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-200 text-amber-800'
                                  }`}>
                                    {item.exceptionStatus || 'PENDING'}
                                  </span>
                                </div>
                                {item.exceptionNotes && (
                                  <p className="text-[9px] font-medium text-amber-800 italic">"{item.exceptionNotes}"</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Security & Compliance</p>
                      <button 
                        onClick={() => setSealVerified(!sealVerified)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${sealVerified ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-100 text-slate-400'}`}
                      >
                         <div className="flex items-center gap-3">
                            <ShieldCheck size={20} />
                            <span className="text-[11px] font-black uppercase tracking-tight">ISO 28000: Seal Verified</span>
                         </div>
                         {sealVerified && <CheckCircle size={20} />}
                      </button>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Loading Confirmation</p>
                      <button 
                        onClick={() => setLoadingConfirmed(!loadingConfirmed)}
                        className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${loadingConfirmed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-400'}`}
                      >
                        <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center ${loadingConfirmed ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200'}`}>
                           {loadingConfirmed && <Check size={14} strokeWidth={4} className="text-white" />}
                        </div>
                        <div className="text-left">
                           <p className="text-[10px] font-black uppercase tracking-tight">Manifest Signed & Secured</p>
                           <p className="text-[8px] font-bold uppercase opacity-60">I confirm items are arranged by stop sequence</p>
                        </div>
                      </button>
                   </div>

                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group focus-within:border-brand transition-colors">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Odometer Reading (KM)</label>
                      <input 
                        type="number" 
                        value={odoStart} 
                        onChange={(e) => setOdoStart(e.target.value)} 
                        placeholder="0.0" 
                        className="w-full bg-transparent text-3xl font-black text-slate-900 outline-none tracking-tighter placeholder:text-slate-200" 
                      />
                   </div>

                   <button onClick={handleStartTrip} disabled={!odoStart || isSubmitting}
                     className="w-full py-5 bg-brand text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-20"
                   >
                     {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <><Play size={16} fill="currentColor" /> Begin Mission</>}
                   </button>
                </div>
              )}

              {/* Step 2: In-Transit */}
              {isEnRoute && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                   <div className="flex justify-between items-start">
                      <div>
                         <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-1">In-Transit Cockpit</h3>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ISO 39001: Safety Monitoring Active</p>
                      </div>
                      <div className="flex flex-col items-end">
                         <div className={`h-2 w-2 rounded-full animate-ping ${fatigueLevel > 70 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                         <span className="text-[7px] font-black text-slate-400 uppercase mt-1">Telemetry Live</span>
                      </div>
                   </div>

                   {/* ISO 39001: Fatigue & Eco Feedback */}
                   <div className="grid grid-cols-2 gap-3">
                      <div className={`p-4 rounded-[2rem] border transition-all ${fatigueLevel > 70 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                         <div className="flex justify-between items-center mb-2">
                            <Clock size={14} className={fatigueLevel > 70 ? 'text-red-500' : 'text-slate-400'} />
                            <span className={`text-[10px] font-black ${fatigueLevel > 70 ? 'text-red-600' : 'text-slate-900'}`}>{fatigueLevel}%</span>
                         </div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fatigue Index</p>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-[2rem]">
                         <div className="flex justify-between items-center mb-2">
                            <Activity size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-slate-900">{ecoScore}%</span>
                         </div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Eco Bonus</p>
                      </div>
                   </div>

                   {fatigueLevel > 80 && (
                     <div className="p-4 bg-red-600 text-white rounded-2xl flex gap-3 animate-pulse">
                        <AlertTriangle size={20} className="shrink-0" />
                        <p className="text-[10px] font-black uppercase tracking-tight">ISO 39001: Mandatory Rest Required. Pull over safely.</p>
                     </div>
                   )}

                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group focus-within:border-brand transition-colors">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Arrival Odometer (KM)</label>
                      <input 
                        type="number" 
                        value={odoEnd} 
                        onChange={(e) => setOdoEnd(e.target.value)} 
                        placeholder="0.0" 
                        className="w-full bg-transparent text-3xl font-black text-slate-900 outline-none tracking-tighter placeholder:text-slate-200" 
                      />
                   </div>

                   <button onClick={handleArrival} disabled={!odoEnd || isSubmitting}
                     className="w-full py-5 bg-brand text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-20"
                   >
                     {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <><Target size={16} /> Mark Arrival</>}
                   </button>
                </div>
              )}

              {/* Step 3: At Site (POD) */}
              {isAtSite && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                   <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-1">
                        {currentDn.type === LogisticsType.INBOUND ? 'Warehouse Receiving Protocol' : 'Customer Delivery Protocol'}
                      </h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mandatory Evidence Capture</p>
                   </div>

                   {currentDn.isPerishable && (
                     <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                           <Thermometer className="text-indigo-600" size={20} />
                           <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Cold Chain Verification</p>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                           <div className="flex-1">
                              <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">Current Temp (°C)</label>
                              <input 
                                type="number" 
                                value={tempLog}
                                onChange={(e) => setTempLog(e.target.value)}
                                placeholder="0.0"
                                className="w-full bg-transparent text-3xl font-black text-indigo-900 outline-none tracking-tighter placeholder:text-indigo-200"
                              />
                           </div>
                           <button 
                             onClick={() => setIsTempVerified(!isTempVerified)}
                             className={`h-14 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${isTempVerified ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-400 border border-indigo-200'}`}
                           >
                              {isTempVerified ? 'Verified' : 'Verify'}
                           </button>
                        </div>
                        {currentDn.tempRequirement && (
                          <p className="text-[9px] font-bold text-indigo-600/60 uppercase tracking-tight">
                            Target Range: {currentDn.tempRequirement.min}°C to {currentDn.tempRequirement.max}°C
                          </p>
                        )}
                     </div>
                   )}

                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setPodPhoto(`https://picsum.photos/seed/pod-${Date.now()}/400/300`)}
                        className={`aspect-square border border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all overflow-hidden relative ${podPhoto ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
                      >
                        {podPhoto ? (
                          <>
                            <img src={podPhoto} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="POD" />
                            <CheckCircle size={32} className="text-emerald-500 relative z-10" />
                            <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest relative z-10">Photo Captured</span>
                          </>
                        ) : (
                          <>
                            <div className="h-10 w-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-400 group-hover:text-brand transition-colors"><CameraIcon size={20} /></div>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Capture POD</span>
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => setShowSignaturePad(true)}
                        className={`aspect-square border border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all overflow-hidden relative ${podSignature ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
                      >
                        {podSignature ? (
                          <>
                            <img src={podSignature} className="absolute inset-0 w-full h-full object-contain p-4 opacity-40" alt="Signature" />
                            <CheckCircle size={32} className="text-emerald-500 relative z-10" />
                            <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest relative z-10">Signed Off</span>
                          </>
                        ) : (
                          <>
                            <div className="h-10 w-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-400 group-hover:text-brand transition-colors"><FileText size={20} /></div>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sign-off</span>
                          </>
                        )}
                      </button>
                   </div>

                   {showSignaturePad && (
                     <div className="fixed inset-0 z-[6000] bg-slate-900/90 backdrop-blur-xl flex flex-col p-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                           <h3 className="text-xl font-black text-white uppercase tracking-tighter">Customer Signature</h3>
                           <button onClick={() => setShowSignaturePad(false)} className="text-white/40 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="flex-1 bg-white rounded-3xl relative overflow-hidden flex items-center justify-center border-4 border-white/10">
                           <p className="text-slate-200 font-black uppercase tracking-[0.5em] rotate-[-15deg] select-none">Sign Here</p>
                           {/* In a real app, this would be a canvas signature pad */}
                           <div className="absolute inset-0 cursor-crosshair" onClick={() => {
                             setPodSignature('https://upload.wikimedia.org/wikipedia/commons/7/7d/Signature_of_John_Hancock.png');
                             setShowSignaturePad(false);
                             addNotification("Signature captured.", "success");
                           }} />
                        </div>
                        <div className="mt-8 flex gap-4">
                           <button onClick={() => setShowSignaturePad(false)} className="flex-1 py-5 bg-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                           <button className="flex-1 py-5 bg-brand text-white rounded-2xl font-black uppercase text-xs tracking-widest">Confirm</button>
                        </div>
                     </div>
                   )}

                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Financial Clearance</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => {
                            setPaymentAmount(currentDn.rate || 0);
                            setCustomerPhone(currentDn.phone || '');
                            setIsPaymentModalOpen(true);
                          }}
                          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${currentDn.paymentStatus === 'PAID' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}
                        >
                          <CreditCard size={20} />
                          <span className="text-[9px] font-black uppercase tracking-tight">
                            {currentDn.paymentStatus === 'PAID' ? 'Paid via M-Pesa' : 'M-Pesa Payment'}
                          </span>
                        </button>
                        <button 
                          onClick={handleGenerateEtims}
                          disabled={isGeneratingEtims || !!eTimsInvoice}
                          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${eTimsInvoice ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
                        >
                          {isGeneratingEtims ? <RefreshCw size={20} className="animate-spin" /> : <Receipt size={20} />}
                          <span className="text-[9px] font-black uppercase tracking-tight">
                            {eTimsInvoice ? 'eTIMS Generated' : 'KRA eTIMS'}
                          </span>
                        </button>
                      </div>
                      {eTimsInvoice && (
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                          <p className="text-[7px] font-black text-blue-400 uppercase tracking-widest mb-1">eTIMS Invoice Number</p>
                          <p className="text-[10px] font-bold text-blue-700">{eTimsInvoice.invoiceNumber}</p>
                        </div>
                      )}
                    </div>

                   <button onClick={handleComplete} disabled={isSubmitting || (currentDn.isPerishable && !isTempVerified)}
                     className="w-full py-5 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-20"
                   >
                     {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <><ShieldCheck size={16} /> Finalize Directive</>}
                   </button>
                </div>
              )}
           </div>

           {/* HUD (Minimized Mode) */}
           {!isPanelExpanded && (
             <div className="px-6 pb-8 flex items-center justify-between animate-in fade-in duration-300">
                <div className="flex items-center gap-4">
                   <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${isEnRoute ? 'bg-brand text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                      {isPreStart ? <Package size={20} /> : isEnRoute ? <Navigation size={20} /> : <ShieldCheck size={20} />}
                   </div>
                   <div>
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Mission Status</p>
                      <p className="text-xs font-black uppercase text-slate-900 tracking-tight">{isPreStart ? 'Hub Clearance' : isEnRoute ? 'En-Route' : 'Handover'}</p>
                   </div>
                </div>
                <button onClick={() => setIsPanelExpanded(true)} className="h-10 px-5 bg-slate-900 text-white border border-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Controls</button>
             </div>
           )}
        </div>

        {isPaymentModalOpen && currentDn && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            dnId={currentDn.id}
            amount={paymentAmount}
            customerPhone={customerPhone}
            onSuccess={() => {
              addNotification("Payment confirmed via M-Pesa.", "success");
              // Refresh DN to show paid status
              setDns(prev => prev.map(dn => dn.id === currentDn.id ? { ...dn, paymentStatus: 'PAID' } : dn));
              setCurrentDn(prev => prev ? { ...prev, paymentStatus: 'PAID' } : null);
            }}
          />
        )}
      </div>
    );
  }

  return null;
};

export default DriverPortal;
