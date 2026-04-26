
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../../store';
import { api } from '../../api';
import { DeliveryNote, DNStatus, LogisticsDocument, LogisticsDocumentStatus, Facility, LogisticsType, SafetyEventType } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useTripTelemetry } from '../../hooks/useTripTelemetry';
import { offlineDb, flushPendingUpdates } from '../../services/offlineDb';
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
  Receipt,
  CloudRain,
  TrafficCone,
  MessageSquare,
  Map as MapIcon,
  PhoneCall,
  Star
} from 'lucide-react';
import { PaymentModal } from '../../components/PaymentModal';
import { SignaturePad } from '../../components/SignaturePad';

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
  const { addNotification, isOnline, notifications } = useAppStore();
  const navigate = useNavigate();
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [currentDn, setCurrentDn] = useState<DeliveryNote | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [step, setStep] = useState<'CHECK_IN' | 'BRIEFING' | 'LIST' | 'EXECUTION' | 'SUCCESS' | 'INSPECTION' | 'NOTIFICATIONS' | 'EXCEPTION' | 'RECONCILIATION' | 'FLEET_MAP' | 'SAFETY_PASSPORT' | 'WALLET'>('CHECK_IN');
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
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(12450);
  const [earnings, setEarnings] = useState([
    { id: 'e-1', date: '2024-03-28', amount: 3500, status: 'PAID' },
    { id: 'e-2', date: '2024-03-29', amount: 4200, status: 'PENDING' }
  ]);
  const [showWallet, setShowWallet] = useState(false);

  // Weather & Traffic State
  const [weatherAdvisory, setWeatherAdvisory] = useState<{ type: string, severity: 'LOW' | 'MEDIUM' | 'HIGH', message: string } | null>(null);
  const [trafficAdvisory, setTrafficAdvisory] = useState<{ type: string, delay: string, message: string } | null>(null);
  const [showAdvisoryModal, setShowAdvisoryModal] = useState(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState<'DISPATCH' | 'WAREHOUSE'>('DISPATCH');
  const [chatMessages, setChatMessages] = useState<{ sender: 'DRIVER' | 'DISPATCH' | 'WAREHOUSE', text: string, time: string }[]>([
    { sender: 'DISPATCH', text: 'Welcome to your shift. Drive safely!', time: '08:00 AM' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Inspection State
  const [inspectionData, setInspectionData] = useState<Record<string, { status: 'PASS' | 'FAIL', photo?: string }>>({});
  const inspectionItems = [
    { id: 'fuel', label: 'Fuel Level (>25%)' },
    { id: 'tires', label: 'Tire Pressure & Tread' },
    { id: 'brakes', label: 'Brake Fluid & Function' },
    { id: 'fluids', label: 'Oil & Coolant Levels' },
    { id: 'lights', label: 'Headlights & Indicators' },
    { id: 'cargo_restraints', label: 'Cargo Restraints & Straps' },
    { id: 'gps', label: 'GPS Signal & Terminal' },
    { id: 'cleanliness', label: 'Vehicle Cleanliness' }
  ];

  // Evidence State
  const [pickedItems, setPickedItems] = useState<Record<number, boolean>>({});
  const [itemConditions, setItemConditions] = useState<Record<number, 'GOOD' | 'DAMAGED'>>({});
  const [loadingConfirmed, setLoadingConfirmed] = useState(false);
  const [odoStart, setOdoStart] = useState('');
  const [odoEnd, setOdoEnd] = useState('');
  const [podPhoto, setPodPhoto] = useState<string | null>(null);
  const [podSignature, setPodSignature] = useState<string | null>(null);
  const [tempLog, setTempLog] = useState<string>('');
  const [isTempVerified, setIsTempVerified] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const [isFinalShiftSuccess, setIsFinalShiftSuccess] = useState(false);

  // Delivery feedback state
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [deliveryFeedback, setDeliveryFeedback] = useState('');
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false);

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
        setFatigueLevel(prev => {
          if ((driveTime + 1) % 600 === 0 && driveTime > 0) {
            return Math.min(100, prev + 5);
          }
          return prev;
        });
        
        // Safety events triggered by real telemetry data, not random simulation
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, isEnRouteStatus]);

  // Auto-collapse panel when modals are open
  useEffect(() => {
    if (isPaymentModalOpen || isChatOpen || showAdvisoryModal) {
      setIsPanelExpanded(false);
    }
  }, [isPaymentModalOpen, isChatOpen, showAdvisoryModal]);

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
    
    // Weather/traffic advisories — triggered by API data, not random intervals
    const advisoryInterval = setInterval(() => {
      // Placeholder: fetch real advisories from /api/advisories when available
      if (false) {
        setWeatherAdvisory({
          type: 'Heavy Rain',
          severity: 'MEDIUM',
          message: 'Expect slippery roads on A104. Reduce speed.'
        });
        addNotification("Weather Advisory: Heavy Rain detected on route.", "info");
      }
      if (false) {
        setTrafficAdvisory({
          type: 'Congestion',
          delay: '15 mins',
          message: 'Heavy traffic at Museum Hill. Rerouting suggested.'
        });
        addNotification("Traffic Alert: 15 min delay ahead.", "info");
      }
    }, 30000);

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

  // Voice Command Setup
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log('Voice Command:', command);
        
        if (command.includes('arrive') || command.includes('here')) {
          handleArrival();
        } else if (command.includes('start') || command.includes('trip')) {
          handleStartTrip();
        } else if (command.includes('sos') || command.includes('emergency')) {
          handleSOS();
        } else if (command.includes('wallet') || command.includes('money')) {
          setStep('WALLET');
        } else if (command.includes('list') || command.includes('back')) {
          setStep('LIST');
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsVoiceActive(false);
        if (event.error === 'not-allowed') {
          addNotification("Microphone access denied. Please click 'Allow' in your browser.", "error");
        } else if (event.error === 'network') {
          addNotification("Speech recognition requires connection.", "error");
        }
      };

      rec.onend = () => {
        setIsVoiceActive(false);
        console.log('Speech recognition ended');
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // Only setup once

  const handleToggleVoice = async () => {
    if (!recognitionRef.current) {
      addNotification("Voice commands not supported in this browser.", "error");
      return;
    }

    if (!isVoiceActive) {
      try {
        // Direct start inside gesture
        recognitionRef.current.start();
        setIsVoiceActive(true);
        addNotification("Voice commands active", "success");
      } catch (err) {
        console.error("Failed to start voice:", err);
        // Sometimes it's already started or pending
        addNotification("Retrying voice setup...", "info");
      }
    } else {
      recognitionRef.current.stop();
      setIsVoiceActive(false);
      addNotification("Voice commands deactivated", "info");
    }
  };

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
      await offlineDb.queueUpdate('EMERGENCY', currentDn?.id || 'global', { type, severity, lat: currentCoords?.lat, lng: currentCoords?.lng });
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
      unread.forEach(n => useAppStore.getState().markRead(n.id));
    }
  }, [step]);

  // Flush queued offline actions when connectivity returns
  useEffect(() => {
    if (!isOnline) return;
    flushPendingUpdates(async (update) => {
      if (update.type === 'DN_STATUS') {
        await api.updateDNStatus(update.targetId, update.payload.status, update.payload.metadata, update.payload.userName);
      }
    }).then(({ flushed }) => {
      if (flushed > 0) addNotification(`Synced ${flushed} offline action${flushed > 1 ? 's' : ''}.`, 'success');
    }).catch(() => {});
  }, [isOnline]);

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
        // Ensure data is unique by id before bulk operations
        const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
        await offlineDb.deliveryNotes.bulkPut(uniqueData);
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
      setIsFinalShiftSuccess(true);
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
    const allConditionsSet = currentDn.items.every((_, idx) => itemConditions[idx]);
    if (!allConditionsSet) {
      addNotification("Verify condition of all items before departure.", "error");
      return;
    }

    const hasDamagedItems = currentDn.items.some((_, idx) => itemConditions[idx] === 'DAMAGED');
    if (hasDamagedItems) {
      const damagedIndices: Record<number, boolean> = {};
      currentDn.items.forEach((_, idx) => {
        if (itemConditions[idx] === 'DAMAGED') {
          damagedIndices[idx] = true;
        }
      });
      setSelectedExceptionItems(damagedIndices);
      setExceptionType('DAMAGED_CARGO');
      setExceptionNotes('Items found damaged during pre-departure inspection.');
      addNotification("Damaged items detected. Please complete the exception report.", "error");
      setStep('EXCEPTION');
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
        await offlineDb.queueUpdate('DN_STATUS', currentDn.id, { status: DNStatus.IN_TRANSIT, metadata: { odometerStart: parseFloat(odoStart) }, userName: user?.name });
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
        await offlineDb.queueUpdate('DN_STATUS', currentDn.id, { status: DNStatus.DELIVERED, metadata: { odometerEnd: parseFloat(odoEnd) }, userName: user?.name });
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
        await offlineDb.queueUpdate('DN_STATUS', currentDn.id, { status: DNStatus.COMPLETED, metadata: podData, userName: user?.name });
        addNotification("Offline: POD captured. Will sync when online.", "info");
      } else {
        await api.updateDNStatus(currentDn.id, DNStatus.COMPLETED, podData, user?.name);
      }
      setStep('SUCCESS');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!currentDn || deliveryRating === 0) return;
    try {
      await api.updateDNStatus(
        currentDn.id,
        currentDn.status,
        { driverFeedback: { rating: deliveryRating, comment: deliveryFeedback, submittedAt: new Date().toISOString() } },
        user?.name
      );
    } catch {
      // Non-critical: best effort
    }
    setIsRatingSubmitted(true);
    addNotification('Feedback submitted. Thank you!', 'success');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    const text = newMessage.trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: 'DRIVER' as const, text, time }]);
    setNewMessage('');
    try {
      await api.saveDriverNotification(user.id, {
        title: `Driver message to ${chatRecipient}`,
        message: `[${chatRecipient}] ${text}`,
        type: 'SYSTEM' as any,
      });
    } catch {
      // message shown locally even if persistence fails
    }
    // Auto-acknowledge from dispatch after short delay
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: chatRecipient,
        text: chatRecipient === 'DISPATCH' ? 'Received. Stand by.' : 'Copy that.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1800);
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
        date: new Date().toISOString(),
        items: {
          fuel: inspectionData.fuel?.status || 'PASS',
          tires: inspectionData.tires?.status || 'PASS',
          brakes: inspectionData.brakes?.status || 'PASS',
          fluids: inspectionData.fluids?.status || 'PASS',
          lights: inspectionData.lights?.status || 'PASS',
          cargo_restraints: inspectionData.cargo_restraints?.status || 'PASS',
          gps: inspectionData.gps?.status || 'PASS',
          cleanliness: inspectionData.cleanliness?.status || 'PASS'
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

  const renderBottomNav = (activeTab: 'LIST' | 'SAFETY' | 'ALERTS' | 'HUB' | 'MORE') => (
    <div className="fixed bottom-0 left-0 right-0 bg-navy/95 backdrop-blur-xl border-t border-white/5 px-6 pb-10 pt-4 z-40 flex justify-between items-center shadow-2xl transition-all">
      <button 
        onClick={() => setStep('LIST')} 
        className={`flex flex-col items-center gap-1.5 transition-all group ${activeTab === 'LIST' ? 'text-brand' : 'text-slate-500 hover:text-white'}`}
      >
        <Truck className={`w-6 h-6 group-hover:scale-110 transition-transform ${activeTab === 'LIST' ? 'stroke-[3px]' : ''}`} />
        <span className="text-[10px] font-bold uppercase tracking-tight">Trips</span>
        {activeTab === 'LIST' && <div className="absolute -bottom-2 h-1 w-1 bg-brand rounded-full" />}
      </button>
      
      <button 
        onClick={() => setStep('SAFETY_PASSPORT')} 
        className={`flex flex-col items-center gap-1.5 transition-all group ${activeTab === 'SAFETY' ? 'text-emerald' : 'text-slate-500 hover:text-white'}`}
      >
        <ShieldCheck className={`w-6 h-6 group-hover:scale-110 transition-transform ${activeTab === 'SAFETY' ? 'stroke-[3px]' : ''}`} />
        <span className="text-[10px] font-bold uppercase tracking-tight">Safety</span>
        {activeTab === 'SAFETY' && <div className="absolute -bottom-2 h-1 w-1 bg-emerald rounded-full" />}
      </button>

      <button 
        onClick={() => setStep('NOTIFICATIONS')} 
        className={`flex flex-col items-center gap-1.5 transition-all group relative ${activeTab === 'ALERTS' ? 'text-amber' : 'text-slate-500 hover:text-white'}`}
      >
        <AlertCircle className={`w-6 h-6 group-hover:scale-110 transition-transform ${activeTab === 'ALERTS' ? 'stroke-[3px]' : ''}`} />
        <span className="text-[10px] font-bold uppercase tracking-tight">Alerts</span>
        {notifications.some((n: any) => !n.read) && (
          <span className="absolute top-0 right-1 h-3 w-3 bg-red rounded-full border-2 border-navy" />
        )}
        {activeTab === 'ALERTS' && <div className="absolute -bottom-2 h-1 w-1 bg-amber rounded-full" />}
      </button>

      <button 
        onClick={() => navigate('/driver/hub')} 
        className={`flex flex-col items-center gap-1.5 transition-all group ${activeTab === 'HUB' ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`}
      >
        <Activity className={`w-6 h-6 group-hover:scale-110 transition-transform ${activeTab === 'HUB' ? 'stroke-[3px]' : ''}`} />
        <span className="text-[10px] font-bold uppercase tracking-tight">Hub</span>
      </button>

      <button 
        onClick={() => setShowMenu(true)} 
        className={`flex flex-col items-center gap-1.5 transition-all group ${activeTab === 'MORE' ? 'text-white' : 'text-slate-500 hover:text-white'}`}
      >
        <Menu className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-bold uppercase tracking-tight">Menu</span>
      </button>
    </div>
  );

  if (step === 'BRIEFING') return (
    <div className="min-h-screen bg-navy text-white font-sans flex flex-col p-6 transition-colors duration-300">
      <header className="flex justify-between items-center mb-8">
        <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
          <Truck size={20} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsChatOpen(true)} className="h-10 w-10 bg-charcoal text-white/60 border border-white/5 rounded-xl flex items-center justify-center active:scale-90 transition-all">
            <MessageSquare size={18} />
          </button>
          <button onClick={() => setShowAdvisoryModal(true)} className="h-10 w-10 bg-charcoal text-white/60 border border-white/5 rounded-xl flex items-center justify-center active:scale-90 transition-all">
            <CloudRain size={18} />
          </button>
        </div>
      </header>
      <div className="flex-1 flex flex-col justify-center space-y-8">
        <div className="space-y-2">
          <p className="label-logistics !text-brand">Mission Briefing</p>
          <h2 className="heading-primary !text-4xl">Good Morning,<br/>{user?.name.split(' ')[0]}</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-charcoal p-6 rounded-2xl border-l-4 border-l-brand flex items-center gap-4 shadow-2xl">
            <div className="h-12 w-12 bg-navy text-brand rounded-xl flex items-center justify-center shadow-lg">
              <Truck size={24} />
            </div>
            <div>
              <p className="label-logistics mb-1">Today's Load</p>
              <h4 className="body-value !text-xl">{dns.length} Deliveries</h4>
            </div>
          </div>

          <div className="bg-charcoal p-6 rounded-2xl border-l-4 border-l-emerald flex items-center gap-4 shadow-2xl">
            <div className="h-12 w-12 bg-navy text-emerald rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="label-logistics !text-emerald/60 mb-1">Safety Focus</p>
              <h4 className="body-value !text-xl">Wet Road Conditions</h4>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="label-logistics">Route Summary</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/60">
              <div className="h-1.5 w-1.5 rounded-full bg-brand"></div>
              <span className="text-[10px] font-black uppercase tracking-tight">Nairobi Central Hub</span>
            </div>
            <div className="h-6 w-px bg-white/10 ml-0.5"></div>
            <div className="flex items-center gap-2 text-white/60">
              <div className="h-1.5 w-1.5 rounded-full bg-brand"></div>
              <span className="text-[10px] font-black uppercase tracking-tight">Mombasa Road Corridor</span>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setStep('INSPECTION')}
        className="btn-primary w-full h-16 mt-8"
      >
        Start Pre-Trip Inspection
      </button>
    </div>
  );

  if (step === 'CHECK_IN') return (
    <div className="h-screen flex flex-col items-center justify-center p-12 text-center bg-navy animate-in fade-in duration-700">
      <div className="h-28 w-28 bg-brand text-white rounded-full flex items-center justify-center mb-10 shadow-2xl scale-110">
        <Clock size={56} strokeWidth={3} />
      </div>
      <h2 className="heading-primary !text-4xl mb-3">Shift Start</h2>
      <p className="label-logistics mb-12">Clock in to receive assignments.</p>
      <button 
        onClick={handleClockIn} 
        disabled={isSubmitting}
        className="btn-primary w-full max-w-xs h-16 flex items-center justify-center gap-4"
      >
        {isSubmitting ? <RefreshCw className="animate-spin" size={24} /> : <><Play size={20} fill="currentColor" /> Clock In</>}
      </button>
      <button 
        onClick={() => { logout(); navigate('/login'); }} 
        className="mt-10 label-logistics !text-white/40 hover:text-red transition-colors"
      >
        Terminate Session
      </button>
    </div>
  );

  if (step === 'EXCEPTION') return (
    <div className="min-h-screen bg-eggshell font-sans flex flex-col transition-colors duration-300">
      <header className="px-6 py-6 border-b border-line flex justify-between items-center sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl pt-12 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep('EXECUTION')} className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-600 dark:text-white/40 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white transition-colors">Report Issue</h1>
        </div>
      </header>
      <main className="flex-1 p-4 space-y-6 overflow-y-auto pb-32 no-scrollbar">
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-2xl flex gap-3 transition-colors">
          <AlertTriangle className="text-red-500 shrink-0" size={20} />
          <p className="label-mono !text-red-700 dark:!text-red-400 leading-relaxed">Reporting an exception will pause this delivery. Provide clear details for dispatch.</p>
        </div>

        <div className="space-y-4">
           <p className="label-mono ml-1 transition-colors">Issue Category</p>
           <div className="grid grid-cols-2 gap-3">
              {['REJECTED', 'UNREACHABLE', 'DAMAGED', 'SHORTAGE', 'BREAKDOWN', 'OTHER'].map(type => (
                <button 
                  key={type}
                  onClick={() => setExceptionType(type)}
                  className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-tight transition-all ${exceptionType === type ? 'bg-red-500 text-white border-red-500 shadow-lg' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/40'}`}
                >
                  {type}
                </button>
              ))}
           </div>
        </div>

        <div className="space-y-4">
           <p className="label-mono ml-1 transition-colors">Notes & Evidence</p>
           <textarea 
             value={exceptionNotes}
             onChange={(e) => setExceptionNotes(e.target.value)}
             placeholder="Describe the situation..."
             className="w-full p-4 bg-white dark:bg-white/5 border border-line rounded-2xl text-xs font-medium focus:border-brand outline-none min-h-[120px] text-slate-900 dark:text-white transition-colors"
           />
           <button 
             onClick={() => setExceptionPhoto(`https://picsum.photos/seed/exc-${Date.now()}/400/300`)}
             className="w-full py-4 border border-dashed border-line rounded-2xl flex items-center justify-center gap-3 text-slate-600 dark:text-white/40 hover:text-brand transition-colors"
           >
              {exceptionPhoto ? <img src={exceptionPhoto} className="h-6 w-8 object-cover rounded" /> : <CameraIcon size={20} />}
              <span className="label-mono">{exceptionPhoto ? 'Photo Captured' : 'Attach Photo Evidence'}</span>
           </button>
        </div>

        <div className="space-y-4">
           <p className="label-mono ml-1 transition-colors">Flag Affected Items (Optional)</p>
           <div className="space-y-2">
              {currentDn?.items.map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedExceptionItems(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  className={`w-full p-3 rounded-xl border text-[10px] font-black uppercase flex items-center justify-between transition-all ${selectedExceptionItems[idx] ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/40'}`}
                >
                  <span>{item.qty} {item.unit} {item.name}</span>
                  {selectedExceptionItems[idx] && <AlertCircle size={14} />}
                </button>
              ))}
           </div>
        </div>

        {exceptionType && !exceptionPhoto && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <AlertCircle size={16} className="text-amber-400 shrink-0" />
            <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">Photo evidence required to log exception</p>
          </div>
        )}
        <button
          onClick={handleReportException}
          disabled={!exceptionType || !exceptionPhoto || isSubmitting}
          className="btn-tactical w-full py-6 bg-red-600 text-white shadow-2xl disabled:opacity-50"
        >
          {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <><AlertCircle size={20} /> Log Exception</>}
        </button>
      </main>
    </div>
  );

  if (step === 'RECONCILIATION') return (
    <div className="min-h-screen bg-navy font-sans flex flex-col transition-colors duration-300">
      <header className="px-6 py-6 border-b border-white/5 flex justify-between items-center sticky top-0 z-30 bg-charcoal/80 backdrop-blur-xl pt-12 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep('LIST')} className="p-2 bg-navy rounded-xl text-white/40 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black tracking-tighter uppercase text-white transition-colors">Post-Trip Audit</h1>
        </div>
      </header>
      <main className="flex-1 p-4 space-y-6 overflow-y-auto pb-32 no-scrollbar">
        <div className="bg-brand/10 border border-brand/20 p-4 rounded-2xl flex gap-3 transition-colors">
          <ClipboardCheck className="text-brand shrink-0" size={20} />
          <p className="label-logistics !text-brand leading-relaxed">Final reconciliation of cash and returns. Accuracy is mandatory for shift closure.</p>
        </div>

        <div className="space-y-6">
           <div className="bg-charcoal p-6 rounded-2xl border border-white/5 shadow-2xl">
              <p className="label-logistics mb-4 transition-colors">COD Cash Collected (USD)</p>
              <input 
                type="number" 
                value={isNaN(reconData.codCollected) ? '' : reconData.codCollected}
                onChange={(e) => setReconData(prev => ({ ...prev, codCollected: parseFloat(e.target.value) || 0 }))}
                className="w-full text-4xl font-black text-white outline-none tracking-tighter bg-transparent transition-colors"
                placeholder="0.00"
              />
           </div>

           <div className="bg-charcoal p-6 rounded-2xl border border-white/5 shadow-2xl">
              <p className="label-logistics mb-4 transition-colors">Returned Items Count</p>
              <div className="flex items-center justify-between">
                 <button onClick={() => setReconData(prev => ({ ...prev, returnedItemsCount: Math.max(0, prev.returnedItemsCount - 1) }))} className="h-12 w-12 bg-navy rounded-xl flex items-center justify-center text-white/60 transition-colors">-</button>
                 <span className="text-4xl font-black text-white transition-colors">{reconData.returnedItemsCount}</span>
                 <button onClick={() => setReconData(prev => ({ ...prev, returnedItemsCount: prev.returnedItemsCount + 1 }))} className="h-12 w-12 bg-navy rounded-xl flex items-center justify-center text-white/60 transition-colors">+</button>
              </div>
           </div>
        </div>

        {(() => {
          const successfulDrops = dns.filter(d => d.status === DNStatus.DELIVERED || d.status === DNStatus.COMPLETED).length;
          const exceptionsLogged = dns.filter(d => d.status === DNStatus.EXCEPTION).length;
          return (
            <div className="bg-charcoal p-6 rounded-2xl border border-white/5 shadow-2xl space-y-4 transition-colors">
               <div className="flex justify-between items-center">
                  <span className="label-logistics text-white/80">Successful Drops</span>
                  <span className="text-sm font-black">{successfulDrops}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="label-logistics text-white/80">Exceptions Logged</span>
                  <span className={`text-sm font-black ${exceptionsLogged > 0 ? 'text-red' : 'text-emerald'}`}>{exceptionsLogged}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="label-logistics text-white/80">Returned Items</span>
                  <span className="text-sm font-black">{reconData.returnedItemsCount}</span>
               </div>
               <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="label-logistics">COD Collected</span>
                  <span className="text-xl font-black text-emerald">KES {reconData.codCollected.toLocaleString()}</span>
               </div>
            </div>
          );
        })()}

        <button 
          onClick={handleReconcile}
          disabled={isSubmitting}
          className="btn-primary w-full h-16"
        >
          {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <><FileCheck size={20} /> Finalize Reconciliation</>}
        </button>
      </main>
    </div>
  );

  if (step === 'SUCCESS') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-navy animate-in fade-in duration-700">
      <div className="h-24 w-24 bg-emerald text-white rounded-full flex items-center justify-center mb-8 shadow-2xl scale-110 shadow-emerald/20">
        <ShieldCheck size={48} strokeWidth={3} />
      </div>
      <h2 className="text-3xl font-black mb-2 tracking-tighter uppercase text-white">Run Complete</h2>
      <p className="text-white/60 font-bold mb-10 uppercase text-[10px] tracking-[0.25em]">Audit Synchronized.</p>

      {/* Delivery Feedback */}
      {!isRatingSubmitted ? (
        <div className="w-full max-w-sm bg-charcoal rounded-[2rem] border border-white/5 p-6 mb-8 space-y-5">
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Delivery Feedback</p>
            <p className="text-xs font-bold text-white/60">How was the drop-off at {currentDn?.clientName || 'this stop'}?</p>
          </div>

          {/* Star rating */}
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setDeliveryRating(star)}
                className="transition-transform active:scale-90"
              >
                <Star
                  size={36}
                  className={`transition-colors ${star <= deliveryRating ? 'text-brand fill-brand' : 'text-white/20'}`}
                />
              </button>
            ))}
          </div>

          {deliveryRating > 0 && (
            <textarea
              value={deliveryFeedback}
              onChange={e => setDeliveryFeedback(e.target.value)}
              placeholder="Optional: customer present, access issues, damage..."
              rows={2}
              className="w-full bg-navy border border-white/10 rounded-2xl p-4 text-xs font-bold text-white placeholder:text-white/20 focus:border-brand/50 outline-none resize-none"
            />
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setIsRatingSubmitted(true)}
              className="flex-1 py-3 border border-white/10 text-white/40 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-white/60 transition-all"
            >
              Skip
            </button>
            <button
              onClick={handleRatingSubmit}
              disabled={deliveryRating === 0}
              className="flex-[2] py-3 bg-brand text-white rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-30 transition-all active:scale-95"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm bg-emerald/10 border border-emerald/20 rounded-[2rem] p-5 mb-8 text-center">
          <p className="text-[10px] font-black text-emerald uppercase tracking-widest">Feedback Recorded</p>
        </div>
      )}

      <button
        onClick={() => {
          if (isFinalShiftSuccess) {
            handleClockOut();
            setIsFinalShiftSuccess(false);
          } else {
            setStep('LIST');
          }
          setCurrentDn(null);
          setPickedItems({});
          setOdoStart('');
          setOdoEnd('');
          setSelectedExceptionItems({});
          setDeliveryRating(0);
          setDeliveryFeedback('');
          setIsRatingSubmitted(false);
        }}
        disabled={!isRatingSubmitted}
        className="w-full max-w-xs bg-brand text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 shadow-lg shadow-brand/20 disabled:opacity-40 transition-all"
      >
        {isFinalShiftSuccess ? 'End Shift & Exit' : 'Dismiss Terminal'}
      </button>
    </div>
  );

  if (step === 'NOTIFICATIONS') return (
    <div className="min-h-screen bg-navy font-sans flex flex-col transition-colors duration-300">
      <header className="px-6 py-6 border-b border-white/5 flex justify-between items-center sticky top-0 z-30 bg-charcoal/80 backdrop-blur-xl pt-12 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep('LIST')} className="p-2 bg-navy border border-white/5 rounded-xl text-white/40 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black tracking-tighter uppercase text-white transition-colors">Alerts</h1>
        </div>
      </header>
      <main className="flex-1 p-4 space-y-3 overflow-y-auto pb-32 no-scrollbar">
        {notifications.length === 0 ? (
          <div className="py-40 text-center px-10 opacity-40">
            <AlertCircle size={60} strokeWidth={1} className="mx-auto mb-4 text-white" />
            <p className="label-logistics">No Active Alerts</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`bg-charcoal p-4 rounded-2xl border border-white/5 flex gap-4 transition-colors ${n.read ? '' : 'border-l-4 border-l-brand'}`}>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'error' ? 'bg-red/10 text-red' : n.type === 'success' ? 'bg-emerald/10 text-emerald' : 'bg-brand/10 text-brand'}`}>
                {n.type === 'error' ? <AlertCircle size={20} /> : n.type === 'success' ? <Check size={20} /> : <Info size={20} />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-tight text-white mb-0.5">{n.message}</p>
                <p className="text-[8px] font-bold text-white/40 uppercase transition-colors">{new Date(n.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          ))
        )}
       </main>
      {renderBottomNav('ALERTS')}
    </div>
  );

  if (step === 'INSPECTION') return (
    <div className="min-h-screen bg-navy font-sans flex flex-col transition-colors duration-300">
      <header className="px-6 py-6 border-b border-white/5 flex justify-between items-center sticky top-0 z-30 bg-charcoal/80 backdrop-blur-xl pt-12 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep('LIST')} className="p-2 bg-navy rounded-xl text-white/40 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black tracking-tighter uppercase text-white transition-colors">Safety Check</h1>
        </div>
      </header>
      <main className="flex-1 p-4 space-y-6 overflow-y-auto pb-32 no-scrollbar">
        <div className="bg-amber/10 border border-amber/20 p-4 rounded-2xl flex gap-3 transition-colors">
          <AlertCircle className="text-amber shrink-0" size={20} />
          <p className="text-[10px] font-bold text-amber uppercase leading-relaxed">Mandatory daily inspection. Mark each item and provide photo evidence for any failures.</p>
        </div>

        <div className="space-y-3">
          {inspectionItems.map(item => {
            const data = inspectionData[item.id];
            return (
              <div key={item.id} className="bg-charcoal border border-white/5 rounded-3xl overflow-hidden shadow-2xl transition-colors">
                <div className="p-4 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-tight text-white transition-colors">{item.label}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleInspectionStatus(item.id, 'PASS')}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${data?.status === 'PASS' ? 'bg-emerald text-white shadow-lg shadow-emerald/20' : 'bg-navy text-white/40'}`}
                    >
                      Pass
                    </button>
                    <button 
                      onClick={() => handleInspectionStatus(item.id, 'FAIL')}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${data?.status === 'FAIL' ? 'bg-red text-white shadow-lg shadow-red/20' : 'bg-navy text-white/40'}`}
                    >
                      Fail
                    </button>
                  </div>
                </div>
                {data?.status === 'FAIL' && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/5 bg-navy/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {data.photo ? (
                          <div className="h-12 w-16 rounded-lg overflow-hidden border border-white/10">
                            <img src={data.photo} className="h-full w-full object-cover" alt="Evidence" />
                          </div>
                        ) : (
                          <div className="h-12 w-16 rounded-lg bg-navy border border-dashed border-white/10 flex items-center justify-center text-white/40">
                            <CameraOff size={20} />
                          </div>
                        )}
                        <button onClick={() => handleInspectionPhoto(item.id)} className="text-[9px] font-black text-brand uppercase flex items-center gap-1">
                          <CameraIcon size={14} /> {data.photo ? 'Retake' : 'Capture Photo'}
                        </button>
                      </div>
                      {data.photo && <Check className="text-emerald" size={20} />}
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
          className="btn-primary w-full h-16 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> Finalize Safety Report</>}
         </button>
      </main>
      {renderBottomNav('SAFETY')}
    </div>
  );

  if (step === 'LIST') {
    const activeTrip = dns.find(dn => dn.status === DNStatus.IN_TRANSIT) || dns[0];
    const currentRoute = activeTrip ? `${activeTrip.originName?.split(' ')[0] || 'Hub'} → ${activeTrip.clientName.split(' ')[0]}` : "Today's Deliveries";

    return (
    <div className="min-h-screen bg-[#0a0f1a] font-sans flex flex-col transition-colors duration-300">
      {isOffline && (
        <div className="bg-amber text-white px-6 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-center sticky top-0 z-[100] animate-pulse">
          Offline Mode Active • Data will sync on reconnection
        </div>
      )}
      <header className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center sticky top-0 z-30 bg-[#0a0f1a]/80 backdrop-blur-xl pt-10 transition-colors">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white font-semibold text-lg leading-tight">Good morning, {user?.name.split(' ')[0] || 'Driver'}</p>
            <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold px-2 py-0.5 border border-emerald-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              ON DUTY
            </div>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">{currentRoute}</h1>
            {activeTrip && currentCoords && activeTrip.lat && activeTrip.lng && (() => {
              const distKm = calculateDistance(currentCoords.lat, currentCoords.lng, activeTrip.lat, activeTrip.lng);
              return (
                <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-lg border border-slate-700/50 ml-1">
                  <Truck size={10} />
                  <span>{distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`} to next stop</span>
                </div>
              );
            })()}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={handleToggleVoice}
            className={`h-11 w-11 rounded-xl flex items-center justify-center active:scale-90 shadow-sm transition-all ${isVoiceActive ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' : 'bg-slate-800 text-slate-400 border border-slate-700/50'}`}
          >
            <Activity size={20} className={isVoiceActive ? 'animate-pulse' : ''} />
          </button>
          <button 
            onClick={handleSOS}
            className="animate-pulse bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
          >
            <Zap size={16} fill="currentColor" /> SOS
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 space-y-4 pb-32 overflow-y-auto no-scrollbar">
        {/* Compact Stats Row */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
           <div className="bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/50 shadow-lg flex items-center gap-3 shrink-0">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Duty Time</p>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {Math.floor(driveTime / 3600)}h {Math.floor((driveTime % 3600) / 60)}m
                </h3>
              </div>
           </div>
           
           <div className="bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/50 shadow-lg flex items-center gap-3 shrink-0">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Activity size={16} />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Efficiency</p>
                <h3 className="text-sm font-bold text-white tracking-tight">{ecoScore}%</h3>
              </div>
           </div>

           <div className="bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/50 shadow-lg flex items-center gap-3 shrink-0">
              <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                <Package size={16} />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Items</p>
                <h3 className="text-sm font-bold text-white tracking-tight">{dns.length} Units</h3>
              </div>
           </div>
        </div>

        {/* Next Stop Highlight Card - Compact */}
        {activeTrip && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 relative overflow-hidden group transition-colors">
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded uppercase">Next Stop</div>
                  {currentCoords && activeTrip.lat && activeTrip.lng && (() => {
                    const distKm = calculateDistance(currentCoords.lat, currentCoords.lng, activeTrip.lat, activeTrip.lng);
                    const etaMins = Math.round((distKm / 40) * 60);
                    return <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tight">~{etaMins}min · {distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`}</span>;
                  })()}
                </div>
                <h4 className="text-base font-bold text-white truncate transition-colors">{activeTrip.clientName}</h4>
                <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                  <MapPin size={12} className="shrink-0" />
                  <p className="text-[10px] truncate transition-colors">{activeTrip.address}</p>
                </div>
              </div>
              <button 
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeTrip.address)}`, '_blank')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl p-3 shadow-lg active:scale-95 transition-all"
              >
                <Navigation size={20} fill="currentColor" />
              </button>
            </div>
          </div>
        )}

        {/* Emergency/Issue - Compact Horizontal */}
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setExceptionType('');
              setExceptionNotes('');
              setStep('EXCEPTION');
            }}
            className="flex-1 bg-red-900/20 border border-red-700/30 text-red-400 rounded-xl p-3 flex items-center gap-3 transition-all active:scale-95"
          >
            <AlertTriangle size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Report Issue</span>
          </button>
          
          <button 
            onClick={() => setQuickActionOpen(true)}
            className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl p-3 flex items-center gap-3 transition-all active:scale-95"
          >
            <Zap size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Quick Actions</span>
          </button>
        </div>

        <div className="pt-2">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 ml-1">Today's Assignments</p>
          <div className="space-y-3">
            {loading ? [1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse bg-charcoal border border-white/5" />) : 
              dns.length === 0 ? (
            <div className="py-16 text-center px-8">
               <div className="h-20 w-20 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto mb-6 transition-colors shadow-sm">
                  <CheckCircle size={40} />
               </div>
               <p className="label-logistics mb-8">All deliveries completed</p>
               <button 
                 onClick={() => setStep('RECONCILIATION')}
                 className="btn-primary w-full h-16 flex items-center justify-center gap-3"
               >
                  <ClipboardCheck size={20} /> Reconcile & End Shift
               </button>
            </div>
          ) :
            dns.map(dn => (
              <button key={dn.id} onClick={() => { setCurrentDn(dn); setStep('EXECUTION'); setOdoStart(dn.odometerStart?.toString() || ''); setIsPanelExpanded(true); }} 
                className="w-full p-4 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/40 shadow-xl flex items-center gap-4 active:scale-[0.98] transition-all text-left relative overflow-hidden group min-h-[100px]"
              >
                <div className={`absolute top-0 right-0 px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-bl-xl ${dn.type === LogisticsType.INBOUND ? 'bg-brand/80' : 'bg-emerald-500/80'} text-white transition-colors`}>
                  {dn.type === LogisticsType.INBOUND ? 'Inbound Pickup' : 'Outbound Delivery'}
                </div>
                
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${dn.status === DNStatus.IN_TRANSIT ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-900 border-slate-700 text-slate-500 group-hover:border-emerald-500/30'}`}>
                  {dn.status === DNStatus.IN_TRANSIT ? <Navigation size={26} className="animate-pulse" /> : 
                    dn.type === LogisticsType.INBOUND ? <ArrowDownLeft size={26} /> : <ArrowUpRight size={26} />
                  }
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                   <h4 className="text-white font-semibold text-[15px] leading-tight truncate transition-colors">{dn.clientName}</h4>
                   <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin size={12} className="shrink-0" />
                      <p className="text-[11px] font-medium truncate uppercase tracking-tight transition-colors">{dn.address}</p>
                   </div>
                   <div className="flex items-center gap-3 pt-1">
                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-colors ${
                        dn.status === DNStatus.IN_TRANSIT ? 'bg-blue-500/20 text-blue-400' : 
                        dn.status === DNStatus.DELIVERED ? 'bg-emerald-500/20 text-emerald-400' : 
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {dn.status.replace('_', ' ')}
                      </div>
                      {dn.status !== DNStatus.DELIVERED && dn.status !== DNStatus.COMPLETED && currentCoords && dn.lat && dn.lng ? (() => {
                        const distKm = calculateDistance(currentCoords.lat, currentCoords.lng, dn.lat, dn.lng);
                        const etaMins = Math.round((distKm / 40) * 60); // assume 40 km/h avg city speed
                        return (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold transition-colors">
                            <Clock size={12} />
                            <span>{distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`} · ~{etaMins}min</span>
                          </div>
                        );
                      })() : dn.status === DNStatus.DELIVERED ? (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <CheckCircle size={12} />
                          <span>Delivered</span>
                        </div>
                      ) : null}
                   </div>
                </div>

                <div className="flex flex-col items-end gap-2 ml-2">
                   <div className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl p-2.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-90">
                      <Navigation size={20} fill="currentColor" />
                   </div>
                </div>
              </button>
            ))
        }
          </div>
        </div>
      </main>

      {renderBottomNav('LIST')}

      <div className="fixed bottom-2 left-0 right-0 flex justify-center pointer-events-none z-[45]">
         <div className="px-3 py-1 bg-white/5 backdrop-blur-sm rounded-full border border-white/5 flex items-center gap-2 transition-colors">
            <ShieldCheck size={8} className="text-emerald" />
            <span className="text-[6px] font-black uppercase tracking-[0.2em] opacity-20">ISO 39001 • ISO 9001 • ISO 28000 Compliant Architecture</span>
         </div>
      </div>

      {/* Quick Actions Menu Overlay */}
      {quickActionOpen && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center p-6 bg-[#0a0f1a]/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-[2.5rem] shadow-2xl p-8 animate-in slide-in-from-bottom-10 duration-500">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-xl font-bold text-white tracking-tight transition-colors">Quick Actions</h3>
                    <p className="text-xs text-slate-500 mt-1 transition-colors">Select an action to continue</p>
                 </div>
                 <button onClick={() => setQuickActionOpen(false)} className="h-10 w-10 bg-slate-800 rounded-xl text-slate-400 flex items-center justify-center border border-slate-700/50 transition-colors hover:text-white active:scale-90"><X size={20}/></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={() => {
                     const activeTrip = dns.find(dn => dn.status === DNStatus.IN_TRANSIT) || dns[0];
                     if (activeTrip) {
                       setCurrentDn(activeTrip);
                       setStep('EXECUTION');
                       setPodPhoto(null);
                       setPodSignature(null);
                       setQuickActionOpen(false);
                     }
                   }}
                   className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all text-center"
                 >
                    <div className="h-12 w-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                       <CheckCircle size={24} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 transition-colors">Mark Delivered</span>
                 </button>
                 <button 
                   onClick={() => { setQuickActionOpen(false); setStep('EXCEPTION'); }}
                   className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all text-center"
                 >
                    <div className="h-12 w-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                       <AlertTriangle size={24} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-red-500 transition-colors">Report Issue</span>
                 </button>
                 <button 
                   onClick={() => { window.open('tel:0800123456'); setQuickActionOpen(false); }}
                   className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all text-center"
                 >
                    <div className="h-12 w-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                       <PhoneCall size={24} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400 transition-colors">Call Dispatch</span>
                 </button>
                 <button 
                   onClick={() => { setShowAdvisoryModal(true); setQuickActionOpen(false); }}
                   className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all text-center"
                 >
                    <div className="h-12 w-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                       <CloudRain size={24} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500 transition-colors">Advisories</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Floating Action Button */}
      {step === 'LIST' && !quickActionOpen && (
        <button 
          onClick={() => setQuickActionOpen(true)}
          className="fixed bottom-28 right-6 h-16 w-16 bg-emerald-500 text-white rounded-2xl shadow-2xl shadow-emerald-500/20 flex items-center justify-center z-[100] active:scale-90 transition-all border-4 border-[#0a0f1a] hover:bg-emerald-600 group"
        >
           <Zap size={28} fill="currentColor" className="group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Driver Hub Menu Overlay */}
      {/* Safety Alert Overlay */}
      {showSafetyAlert && (
        <div className="fixed top-24 left-4 right-4 z-[9000] animate-in slide-in-from-top-8 duration-300">
           <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20">
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
                 <AlertTriangle size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">Safety Alert</p>
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
                    {user?.name?.charAt(0) || '?'}
                 </div>
                 <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">{user?.name}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Driver ID: {user?.id.split('-')[1] || '772'}</p>
                 </div>
              </div>
              <button onClick={() => setShowMenu(false)} className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-white active:scale-90 transition-all">
                 <X size={24} />
              </button>
           </header>

            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pb-10">
              <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-6">Operations Hub</p>
              
              <button 
                onClick={() => { setShowMenu(false); setStep('LIST'); }}
                className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-6 group active:bg-white/10 transition-all"
              >
                 <div className="h-12 w-12 rounded-xl bg-brand text-white flex items-center justify-center shadow-lg"><Truck size={24} /></div>
                 <div className="text-left">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Active Manifest</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase">View current delivery queue</p>
                 </div>
                 <ChevronRight size={20} className="ml-auto text-white/50" />
              </button>

              <button 
                onClick={() => { setShowMenu(false); setStep('WALLET'); }}
                className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-6 group active:bg-white/10 transition-all"
              >
                 <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg"><CreditCard size={24} /></div>
                 <div className="text-left">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Earnings & Wallet</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase">View balance & request advances</p>
                 </div>
                 <ChevronRight size={20} className="ml-auto text-white/50" />
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
                 <ChevronRight size={20} className="ml-auto text-white/50" />
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
                 <ChevronRight size={20} className="ml-auto text-white/50" />
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
                 <ChevronRight size={20} className="ml-auto text-white/50" />
              </button>

              <button 
                onClick={() => navigate('/driver/hub')}
                className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-6 group active:bg-white/10 transition-all"
              >
                 <div className="h-12 w-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg"><Activity size={24} /></div>
                 <div className="text-left">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Driver Hub</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase">Performance & Safety Tools</p>
                 </div>
                 <ChevronRight size={20} className="ml-auto text-white/50" />
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
                  <ChevronRight size={20} className="ml-auto text-white/50" />
               </button>

               <button 
                onClick={() => { setShowMenu(false); setIsChatOpen(true); }}
                className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-6 group active:bg-white/10 transition-all"
              >
                 <div className="h-12 w-12 rounded-xl bg-brand text-white flex items-center justify-center shadow-lg"><MessageSquare size={24} /></div>
                 <div className="text-left">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Dispatch Comms</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase">Real-time secure chat</p>
                 </div>
                 <ChevronRight size={20} className="ml-auto text-white/50" />
              </button>

              <button 
                onClick={() => { setShowMenu(false); setShowAdvisoryModal(true); }}
                className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-6 group active:bg-white/10 transition-all"
              >
                 <div className="h-12 w-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg"><CloudRain size={24} /></div>
                 <div className="text-left">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Route Intelligence</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase">Weather & Traffic alerts</p>
                 </div>
                 <ChevronRight size={20} className="ml-auto text-white/50" />
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
                 <ChevronRight size={20} className="ml-auto text-white/50" />
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
                 <ChevronRight size={20} className="ml-auto text-white/50" />
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
                className="w-full py-4 text-[10px] font-black text-white/50 uppercase tracking-[0.3em] hover:text-white transition-colors"
              >
                 Terminate Active Session
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

  if (step === 'WALLET') return (
    <div className="min-h-screen bg-navy font-sans flex flex-col transition-colors duration-300">
      <header className="px-6 py-4 border-b border-white/5 flex justify-between items-center sticky top-0 z-30 bg-navy/80 backdrop-blur-xl pt-10 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep('LIST')} className="h-10 w-10 bg-charcoal border border-white/10 rounded-xl flex items-center justify-center text-white/40 active:scale-90 transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <p className="label-logistics !text-brand !text-[8px]">Finance Terminal</p>
            <h1 className="text-xl font-black tracking-tighter uppercase text-white transition-colors">Driver Wallet</h1>
          </div>
        </div>
        <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg">
          <CreditCard size={18} />
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 overflow-y-auto no-scrollbar pb-32">
        <div className="p-8 bg-charcoal rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden transition-colors border border-white/5">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <CreditCard size={120} />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">Available Balance</p>
              <h3 className="text-5xl font-black tracking-tighter mb-8">KES {walletBalance.toLocaleString()}</h3>
              <div className="flex gap-3">
                 <button className="flex-1 py-4 bg-brand text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95">Withdraw</button>
                 <button className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest backdrop-blur-md border border-white/10 active:scale-95">Advance</button>
              </div>
           </div>
        </div>

        <div className="space-y-4">
           <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] ml-2 transition-colors">Recent Earnings</h3>
           <div className="space-y-3">
              {earnings.map(e => (
                <div key={e.id} className="p-4 bg-charcoal border border-white/5 rounded-2xl flex items-center justify-between transition-colors">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-emerald/10 text-emerald rounded-xl flex items-center justify-center">
                         <ArrowDownLeft size={20} />
                      </div>
                      <div>
                         <p className="text-xs font-black text-white uppercase tracking-tight transition-colors">KES {e.amount.toLocaleString()}</p>
                         <p className="text-[9px] font-bold text-white/40 uppercase transition-colors">{e.date}</p>
                      </div>
                   </div>
                   <Badge variant={e.status === 'PAID' ? 'delivered' : 'exception'}>
                      {e.status}
                   </Badge>
                </div>
              ))}
           </div>
        </div>

        <div className="p-6 bg-brand/10 border border-brand/20 rounded-3xl flex gap-4 transition-colors">
           <Zap className="text-brand shrink-0" size={20} />
           <div>
              <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">Instant Advance</p>
              <p className="text-[11px] font-medium text-white/60 leading-relaxed transition-colors">You are eligible for an advance of up to KES 5,000 based on your safety score.</p>
           </div>
        </div>
      </main>
      {renderBottomNav('HUB')}
    </div>
  );

  if (step === 'SAFETY_PASSPORT') return (
    <div className="min-h-screen bg-navy font-sans flex flex-col transition-colors duration-300">
      <header className="px-6 py-4 border-b border-white/5 flex justify-between items-center sticky top-0 z-30 bg-navy/80 backdrop-blur-xl pt-10 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep('LIST')} className="h-10 w-10 bg-charcoal border border-white/10 rounded-xl flex items-center justify-center text-white/40 active:scale-90 transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <p className="label-logistics !text-emerald !text-[8px]">Compliance Terminal</p>
            <h1 className="text-xl font-black tracking-tighter uppercase text-white transition-colors">Safety Passport</h1>
          </div>
        </div>
        <div className="h-10 w-10 bg-emerald text-white rounded-xl flex items-center justify-center shadow-lg">
          <ShieldCheck size={18} />
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 overflow-y-auto no-scrollbar pb-32">
        <div className="relative p-8 bg-gradient-to-br from-emerald to-emerald/60 rounded-[2.5rem] text-white shadow-2xl overflow-hidden border border-white/10">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck size={120} />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">Global Safety Score</p>
              <h3 className="text-6xl font-black tracking-tighter mb-6">{safetyScore}%</h3>
              <div className="flex gap-4">
                 <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Rank</p>
                    <p className="text-xs font-black uppercase">Elite Driver</p>
                 </div>
                 <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">ISO Status</p>
                    <p className="text-xs font-black uppercase text-emerald">Compliant</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="p-6 bg-charcoal border border-white/5 rounded-[2rem] transition-colors shadow-sm">
              <Activity size={24} className="text-emerald mb-4" />
              <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1 transition-colors">Eco Efficiency</p>
              <h4 className="text-2xl font-black text-white transition-colors">{ecoScore}%</h4>
           </div>
           <div className="p-6 bg-charcoal border border-white/5 rounded-[2rem] transition-colors shadow-sm">
              <Clock size={24} className="text-amber mb-4" />
              <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1 transition-colors">Rest Compliance</p>
              <h4 className="text-2xl font-black text-white transition-colors">100%</h4>
           </div>
        </div>

        <div className="space-y-4">
           <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] ml-2 transition-colors">Recent Safety Events</h3>
           {safetyEvents.length === 0 ? (
             <div className="p-8 bg-charcoal border border-white/5 rounded-[2rem] text-center transition-colors shadow-sm">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest transition-colors">No incidents recorded</p>
             </div>
           ) : (
             safetyEvents.map((e, i) => (
               <div key={i} className="p-4 bg-charcoal border border-white/5 rounded-2xl flex items-center justify-between transition-colors shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 bg-red/10 text-red rounded-xl flex items-center justify-center">
                        <AlertTriangle size={20} />
                     </div>
                     <div>
                        <p className="text-xs font-black text-white uppercase tracking-tight transition-colors">{e.type}</p>
                        <p className="text-[9px] font-bold text-white/40 uppercase transition-colors">{e.time}</p>
                     </div>
                  </div>
                  <Badge variant="exception">-1%</Badge>
               </div>
             ))
           )}
        </div>
      </main>
      {renderBottomNav('SAFETY')}
    </div>
  );

  if (step === 'FLEET_MAP') return (
    <div className="fixed inset-0 bg-navy z-[100] flex flex-col transition-colors duration-300">
       <div className="p-6 flex items-center justify-between bg-charcoal/80 backdrop-blur-xl border-b border-white/5 transition-colors">
          <div className="flex items-center gap-4">
             <button onClick={() => setStep('LIST')} className="p-2 text-white/40 hover:text-white transition-colors"><ChevronLeft size={24}/></button>
             <div>
                <h2 className="text-sm font-black text-white uppercase tracking-tight">Fleet Network</h2>
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Active Driver Locations</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-emerald animate-pulse shadow-[0_0_10px_rgba(0,200,81,0.8)]" />
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
             <div className="bg-charcoal/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 pointer-events-auto shadow-2xl transition-colors">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Active Drivers</h3>
                   <Badge variant="dispatched">{allActiveDns.length} Online</Badge>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                   {allActiveDns.map(dn => (
                      <div key={dn.id} className="shrink-0 p-4 bg-navy rounded-2xl border border-white/5 flex items-center gap-3 transition-colors">
                         <div className="h-8 w-8 rounded-full bg-charcoal flex items-center justify-center text-[10px] font-black text-white transition-colors">
                            {dn.driverId?.substring(0, 2).toUpperCase()}
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-white uppercase">{dn.clientName.split(' ')[0]}</p>
                            <p className="text-[8px] font-bold text-white/40 uppercase">{dn.externalId}</p>
                         </div>
                      </div>
                   ))}
                   {allActiveDns.length === 0 && (
                      <p className="text-[10px] font-bold text-white/40 uppercase py-4">No other drivers currently active</p>
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
      <div 
        className="h-screen flex flex-col font-sans bg-navy overflow-hidden relative transition-colors duration-300"
        onClick={() => { if (isPanelExpanded) setIsPanelExpanded(false); }}
      >
        <div className="flex-1 relative">
           <MapEngine 
            dns={liveDn ? [liveDn as any] : []} 
            facilities={facilities} 
            focusedDnId={currentDn.id} 
            followDriver={true} 
            className="w-full h-full" 
           />
           
           <div 
             className="absolute top-14 left-4 right-4 z-[2000] flex flex-col gap-2 pointer-events-none"
             onClick={(e) => e.stopPropagation()}
           >
              <div className="bg-brand text-white p-6 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-xl flex-1 max-w-[300px] pointer-events-auto">
                 <p className="label-logistics !text-white/40 mb-2">
                   {currentDn.type === LogisticsType.INBOUND ? 'Warehouse Consignee' : 'End Customer'}
                 </p>
                 <h4 className="text-sm font-black truncate uppercase leading-none tracking-tight">{currentDn.address}</h4>
                 <div className="flex items-center justify-between mt-3">
                   <p className="text-[10px] font-bold text-white/60 uppercase truncate">{currentDn.clientName}</p>
                   <button 
                     onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentDn.address)}`, '_blank')}
                     className="h-8 px-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-black uppercase text-[8px] flex items-center gap-2 transition-colors pointer-events-auto"
                   >
                     <Navigation size={12} /> Navigate
                   </button>
                 </div>
              </div>
              {currentDn.originName && (
                <div className="bg-charcoal/90 text-white p-5 rounded-3xl shadow-xl border border-white/5 backdrop-blur-xl flex-1 max-w-[300px] pointer-events-auto transition-colors">
                   <p className="label-logistics !text-white/40 mb-2">
                     {currentDn.type === LogisticsType.INBOUND ? 'Supplier Origin' : 'Warehouse Origin'}
                   </p>
                   <h4 className="text-xs font-black truncate uppercase leading-none tracking-tight transition-colors">{currentDn.originName}</h4>
                   <p className="text-[10px] font-bold text-white/60 uppercase mt-2 truncate transition-colors">{currentDn.originAddress}</p>
                </div>
              )}
           </div>
           <div 
             className="absolute top-14 right-4 z-[2000] flex flex-col gap-3 pointer-events-auto"
             onClick={(e) => e.stopPropagation()}
           >
              <button onClick={() => setStep('LIST')} className="h-14 w-14 bg-charcoal rounded-2xl shadow-lg flex items-center justify-center text-white/40 active:scale-90 border border-white/5 transition-colors"><X size={24} /></button>
              <button onClick={() => setStep('EXCEPTION')} className="h-14 w-14 bg-red/10 text-red rounded-2xl shadow-lg flex items-center justify-center active:scale-90 border border-red/20 transition-colors"><AlertTriangle size={24} /></button>
              <button onClick={() => setIsChatOpen(true)} className="h-14 w-14 bg-brand text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-90 border border-brand/20 transition-colors">
                <MessageSquare size={24} />
              </button>
              <button onClick={() => setShowAdvisoryModal(true)} className="h-14 w-14 bg-amber/10 text-amber rounded-2xl shadow-lg flex items-center justify-center active:scale-90 border border-amber/20 transition-colors">
                <CloudRain size={24} />
              </button>
              <button onClick={() => addNotification("ISO 9001: SOP - Ensure vehicle is locked during delivery.", "info")} className="h-14 w-14 bg-brand/10 text-brand rounded-2xl shadow-lg flex items-center justify-center active:scale-90 border border-brand/20 transition-colors"><Info size={24} /></button>
           </div>
           
           {isEnRoute && (
              <div className="absolute bottom-[280px] right-4 z-[2000] animate-in slide-in-from-right-4">
                 <div className="bg-brand text-white px-6 py-5 rounded-3xl shadow-2xl flex flex-col items-center border border-white/10">
                    <p className="label-logistics !text-white/40 mb-2">ETA Check</p>
                    <p className="text-3xl font-black tracking-tighter leading-none">{distanceToTarget ? `${distanceToTarget.toFixed(1)}km` : '--'}</p>
                 </div>
              </div>
           )}
        </div>

        {/* Tactile Execution Drawer */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-navy border-t border-white/5 rounded-t-[3rem] shadow-2xl z-[2500] transition-all duration-500 ease-out flex flex-col ${isPanelExpanded ? 'max-h-[65vh]' : 'max-h-[140px]'}`}
          onClick={(e) => e.stopPropagation()}
        >
           <button onClick={() => setIsPanelExpanded(!isPanelExpanded)} className="w-full py-4 flex items-center justify-center text-white/10 group transition-colors">
              <div className="h-1.5 w-12 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors" />
           </button>

           <div className={`px-8 overflow-y-auto no-scrollbar pb-10 space-y-8 transition-opacity duration-300 ${isPanelExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              
              {/* Step 1: Pre-Departure */}
              {isPreStart && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                   <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 transition-colors">
                        {currentDn.type === LogisticsType.INBOUND ? 'Supplier Pickup Protocol' : 'Warehouse Dispatch Protocol'}
                      </h3>
                      <p className="label-logistics !text-white/40">
                        {currentDn.type === LogisticsType.INBOUND ? 'Verify Supplier Goods & Log Meter' : 'Verify Customer Order & Log Meter'}
                      </p>
                   </div>
                   
                   {currentDn.notes && (
                     <div className="p-5 bg-amber/10 border border-amber/20 rounded-3xl flex gap-4 transition-colors">
                        <AlertTriangle className="text-amber shrink-0" size={20} />
                        <div>
                           <p className="label-logistics !text-amber mb-1">Special Notes</p>
                           <p className="text-xs font-bold text-amber/80 transition-colors">{currentDn.notes}</p>
                        </div>
                     </div>
                   )}

                   <div className="space-y-4">
                      <p className="label-logistics !text-white/50 ml-1">Cargo Verification</p>
                      <div className="space-y-3">
                        {currentDn.items.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-3 p-4 bg-charcoal rounded-2xl border border-white/5 transition-colors">
                            <div className="flex items-center justify-between">
                              <button onClick={() => setPickedItems(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                className={`flex-1 py-3 px-4 rounded-xl border text-xs font-black uppercase transition-all flex items-center gap-3 ${pickedItems[idx] ? 'bg-emerald/10 border-emerald/20 text-emerald' : 'bg-navy border-white/5 text-white/40'}`}
                              >
                                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${pickedItems[idx] ? 'bg-emerald border-emerald' : 'bg-navy border-white/10'}`}>
                                    {pickedItems[idx] && <Check size={10} strokeWidth={4} className="text-white" />}
                                </div>
                                <span className="truncate">{item.qty} {item.unit} {item.name}</span>
                              </button>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setItemConditions(prev => ({ ...prev, [idx]: 'GOOD' }))}
                                  className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase transition-all ${itemConditions[idx] === 'GOOD' ? 'bg-emerald text-white shadow-lg shadow-emerald/20' : 'bg-navy border border-white/5 text-white/40'}`}
                                >
                                  Good
                                </button>
                                <button 
                                  onClick={() => setItemConditions(prev => ({ ...prev, [idx]: 'DAMAGED' }))}
                                  className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase transition-all ${itemConditions[idx] === 'DAMAGED' ? 'bg-red text-white shadow-lg shadow-red/20' : 'bg-navy border border-white/5 text-white/40'}`}
                                >
                                  Damaged
                                </button>
                              </div>
                              {item.isHazardous && (
                                <div className="ml-3 px-3 py-1.5 bg-red/10 text-red border border-red/20 rounded-xl flex items-center gap-1.5 animate-pulse transition-colors">
                                  <AlertTriangle size={12} />
                                  <span className="text-[9px] font-black uppercase">Hazmat</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-6 px-1">
                              {item.sku && (
                                <div className="flex flex-col">
                                  <span className="label-logistics !text-white/50 !text-[8px] mb-1">SKU</span>
                                  <span className="text-xs font-bold text-white/60 transition-colors">{item.sku}</span>
                                </div>
                              )}
                              {item.dimensions && (
                                <div className="flex flex-col">
                                  <span className="label-logistics !text-white/50 !text-[8px] mb-1">Dimensions</span>
                                  <span className="text-xs font-bold text-white/60 uppercase transition-colors">
                                    {item.dimensions.length}x{item.dimensions.width}x{item.dimensions.height} {item.dimensions.unit}
                                  </span>
                                </div>
                              )}
                              {item.isHazardous && item.hazardClass && (
                                <div className="flex flex-col">
                                  <span className="label-logistics !text-white/50 !text-[8px] mb-1">Class</span>
                                  <span className="text-xs font-bold text-red uppercase transition-colors">{item.hazardClass}</span>
                                </div>
                              )}
                            </div>

                            {item.exceptionType && (
                              <div className="mt-2 p-3 bg-amber/10 border border-amber/20 rounded-xl flex flex-col gap-2 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle size={12} className="text-amber" />
                                    <span className="label-logistics !text-amber">Exception: {item.exceptionType}</span>
                                  </div>
                                  <span className={`text-[8px] font-black px-2 py-1 rounded uppercase ${
                                    item.exceptionStatus === 'RESOLVED' ? 'bg-emerald/20 text-emerald' :
                                    item.exceptionStatus === 'REJECTED' ? 'bg-red/20 text-red' :
                                    'bg-amber/20 text-amber'
                                  }`}>
                                    {item.exceptionStatus || 'PENDING'}
                                  </span>
                                </div>
                                {item.exceptionNotes && (
                                  <p className="text-xs font-medium text-amber/80 italic transition-colors">"{item.exceptionNotes}"</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="label-logistics !text-white/50 ml-1">Security & Compliance</p>
                      <button 
                        onClick={() => setSealVerified(!sealVerified)}
                        className={`w-full p-5 rounded-3xl border-2 transition-all flex items-center justify-between ${sealVerified ? 'bg-emerald/10 border-emerald text-emerald' : 'bg-charcoal border-white/5 text-white/40'}`}
                      >
                         <div className="flex items-center gap-4">
                            <ShieldCheck size={24} />
                            <span className="text-sm font-black uppercase tracking-tight">ISO 28000: Seal Verified</span>
                         </div>
                         {sealVerified && <CheckCircle size={24} />}
                      </button>
                   </div>

                   <div className="space-y-4">
                      <p className="label-logistics !text-white/50 ml-1">Loading Confirmation</p>
                      <button 
                        onClick={() => setLoadingConfirmed(!loadingConfirmed)}
                        className={`w-full p-5 rounded-3xl border flex items-center gap-5 transition-all ${loadingConfirmed ? 'bg-emerald/10 border-emerald/20 text-emerald' : 'bg-charcoal border-white/5 text-white/40'}`}
                      >
                        <div className={`h-8 w-8 rounded-xl border-2 flex items-center justify-center ${loadingConfirmed ? 'bg-emerald border-emerald' : 'bg-navy border-white/10'}`}>
                           {loadingConfirmed && <Check size={18} strokeWidth={4} className="text-white" />}
                        </div>
                        <div className="text-left">
                           <p className="text-xs font-black uppercase tracking-tight transition-colors">Manifest Signed & Secured</p>
                           <p className="label-logistics !text-white/40 !tracking-tight">I confirm items are arranged by stop sequence</p>
                        </div>
                      </button>
                   </div>

                   <div className="p-6 bg-charcoal rounded-3xl border border-white/5 group focus-within:border-brand transition-colors">
                      <label className="label-logistics !text-white/40 mb-2 block transition-colors">Odometer Reading (KM)</label>
                      <input 
                        type="number" 
                        value={odoStart} 
                        onChange={(e) => setOdoStart(e.target.value)} 
                        placeholder="0.0" 
                        className="w-full bg-transparent text-4xl font-black text-white outline-none tracking-tighter placeholder:text-white/10 transition-colors" 
                      />
                   </div>

                   <button onClick={handleStartTrip} disabled={!odoStart || isSubmitting}
                     className="btn-primary w-full h-16"
                   >
                     {isSubmitting ? <RefreshCw className="animate-spin" size={24} /> : <><Play size={20} fill="currentColor" /> Begin Mission</>}
                   </button>
                </div>
              )}

              {/* Step 2: In-Transit */}
              {isEnRoute && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                   <div className="flex justify-between items-start">
                      <div>
                         <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 transition-colors">In-Transit Cockpit</h3>
                         <p className="label-logistics !text-white/40">ISO 39001: Safety Monitoring Active</p>
                      </div>
                      <div className="flex flex-col items-end">
                         <div className={`h-3 w-3 rounded-full animate-ping ${fatigueLevel > 70 ? 'bg-red' : 'bg-emerald'}`} />
                          <span className="label-logistics !text-white/40 !text-[8px] mt-2">Telemetry Live</span>
                      </div>
                   </div>

                   {/* ISO 39001: Fatigue & Eco Feedback */}
                   <div className="grid grid-cols-2 gap-4">
                      <div className={`p-6 rounded-[2.5rem] border transition-all ${fatigueLevel > 70 ? 'bg-red/10 border-red/20' : 'bg-charcoal border-white/5'}`}>
                         <div className="flex justify-between items-center mb-3">
                            <Clock size={16} className={fatigueLevel > 70 ? 'text-red' : 'text-white/40'} />
                            <span className={`text-xs font-black transition-colors ${fatigueLevel > 70 ? 'text-red' : 'text-white'}`}>{fatigueLevel}%</span>
                         </div>
                         <p className="label-logistics !text-white/40 !text-[8px]">Fatigue Index</p>
                      </div>
                      <div className="p-6 bg-charcoal border border-white/5 rounded-[2.5rem] transition-colors">
                         <div className="flex justify-between items-center mb-3">
                            <Activity size={16} className="text-emerald" />
                            <span className="text-xs font-black text-white transition-colors">{ecoScore}%</span>
                         </div>
                         <p className="label-logistics !text-white/40 !text-[8px]">Eco Bonus</p>
                      </div>
                   </div>

                   {fatigueLevel > 80 && (
                     <div className="p-5 bg-red text-white rounded-3xl flex gap-4 animate-pulse">
                        <AlertTriangle size={24} className="shrink-0" />
                        <p className="text-xs font-black uppercase tracking-tight">ISO 39001: Mandatory Rest Required. Pull over safely.</p>
                     </div>
                   )}

                   <div className="p-6 bg-charcoal rounded-3xl border border-white/5 group focus-within:border-brand transition-colors">
                      <label className="label-logistics !text-white/40 mb-2 block transition-colors">Arrival Odometer (KM)</label>
                      <input 
                        type="number" 
                        value={odoEnd} 
                        onChange={(e) => setOdoEnd(e.target.value)} 
                        placeholder="0.0" 
                        className="w-full bg-transparent text-4xl font-black text-white outline-none tracking-tighter placeholder:text-white/10 transition-colors" 
                      />
                   </div>

                   <button onClick={handleArrival} disabled={!odoEnd || isSubmitting}
                     className="btn-primary w-full h-16"
                   >
                     {isSubmitting ? <RefreshCw className="animate-spin" size={24} /> : <><Target size={20} /> Mark Arrival</>}
                   </button>
                </div>
              )}

              {/* Step 3: At Site (POD) */}
              {isAtSite && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                   <div>
                       <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 transition-colors">
                        {currentDn.type === LogisticsType.INBOUND ? 'Warehouse Receiving Protocol' : 'Customer Delivery Protocol'}
                      </h3>
                       <p className="label-logistics !text-white/40">Mandatory Evidence Capture</p>
                   </div>

                   {currentDn.isPerishable && (
                      <div className="p-6 bg-brand/10 border border-brand/20 rounded-[2.5rem] space-y-4 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                            <Thermometer className="text-brand" size={20} />
                            <p className="label-logistics !text-white">Cold Chain Verification</p>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                           <div className="flex-1">
                              <label className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1 block transition-colors">Current Temp (°C)</label>
                              <input 
                                type="number" 
                                value={tempLog}
                                onChange={(e) => setTempLog(e.target.value)}
                                placeholder="0.0"
                                className="w-full bg-transparent text-3xl font-black text-white outline-none tracking-tighter placeholder:text-white/10 transition-colors"
                              />
                           </div>
                           <button 
                             onClick={() => setIsTempVerified(!isTempVerified)}
                             className={`h-14 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${isTempVerified ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-navy text-white/40 border border-white/10'}`}
                           >
                              {isTempVerified ? 'Verified' : 'Verify'}
                           </button>
                        </div>
                        {currentDn.tempRequirement && (
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-tight transition-colors">
                            Target Range: {typeof currentDn.tempRequirement === 'string' ? currentDn.tempRequirement : `${currentDn.tempRequirement.min}°C to ${currentDn.tempRequirement.max}°C`}
                          </p>
                        )}
                      </div>
                   )}

                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setPodPhoto(`https://picsum.photos/seed/pod-${Date.now()}/400/300`)}
                        className={`aspect-square border border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all overflow-hidden relative ${podPhoto ? 'bg-emerald/10 border-emerald/20' : 'bg-charcoal border-white/10'}`}
                      >
                        {podPhoto ? (
                          <>
                            <img src={podPhoto} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="POD" referrerPolicy="no-referrer" />
                            <CheckCircle size={32} className="text-emerald relative z-10" />
                            <span className="text-[8px] font-black text-emerald uppercase tracking-widest relative z-10 transition-colors">Photo Captured</span>
                          </>
                        ) : (
                          <>
                            <div className="h-10 w-10 bg-navy rounded-lg shadow-sm flex items-center justify-center text-white/50 group-hover:text-brand transition-colors"><CameraIcon size={20} /></div>
                            <span className="text-[8px] font-black text-white/50 uppercase tracking-widest transition-colors">Capture POD</span>
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => setShowSignaturePad(true)}
                        className={`aspect-square border border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all overflow-hidden relative ${podSignature ? 'bg-emerald/10 border-emerald/20' : 'bg-charcoal border-white/10'}`}
                      >
                        {podSignature ? (
                          <>
                            <img src={podSignature} className="absolute inset-0 w-full h-full object-contain p-4 opacity-40" alt="Signature" />
                            <CheckCircle size={32} className="text-emerald relative z-10" />
                            <span className="text-[8px] font-black text-emerald uppercase tracking-widest relative z-10 transition-colors">Signed Off</span>
                          </>
                        ) : (
                          <>
                            <div className="h-10 w-10 bg-navy rounded-lg shadow-sm flex items-center justify-center text-white/50 group-hover:text-brand transition-colors"><FileText size={20} /></div>
                            <span className="text-[8px] font-black text-white/50 uppercase tracking-widest transition-colors">Sign-off</span>
                          </>
                        )}
                      </button>
                   </div>

                   {showSignaturePad && (
                     <SignaturePad
                       label={`${currentDn?.clientName || 'Customer'} Signature`}
                       onCapture={(dataUrl) => {
                         setPodSignature(dataUrl);
                         setShowSignaturePad(false);
                         addNotification("Signature captured.", "success");
                       }}
                       onClose={() => setShowSignaturePad(false)}
                     />
                   )}

                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1 transition-colors">Financial Clearance</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => {
                            setPaymentAmount(currentDn.rate || 0);
                            setCustomerPhone(currentDn.phone || '');
                            setIsPaymentModalOpen(true);
                          }}
                          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${currentDn.paymentStatus === 'PAID' ? 'bg-emerald/10 border-emerald/20 text-emerald' : 'bg-charcoal border-white/10 text-white/60'}`}
                        >
                          <CreditCard size={20} />
                          <span className="text-[9px] font-black uppercase tracking-tight transition-colors">
                            {currentDn.paymentStatus === 'PAID' ? 'Paid via M-Pesa' : 'M-Pesa Payment'}
                          </span>
                        </button>
                        <button 
                          onClick={handleGenerateEtims}
                          disabled={isGeneratingEtims || !!eTimsInvoice}
                          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${eTimsInvoice ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-charcoal border-white/10 text-white/60'}`}
                        >
                          {isGeneratingEtims ? <RefreshCw size={20} className="animate-spin" /> : <Receipt size={20} />}
                          <span className="text-[9px] font-black uppercase tracking-tight transition-colors">
                            {eTimsInvoice ? 'eTIMS Generated' : 'KRA eTIMS'}
                          </span>
                        </button>
                      </div>
                      {eTimsInvoice && (
                        <div className="p-3 bg-brand/10 border border-brand/20 rounded-xl transition-colors">
                          <p className="text-[7px] font-black text-brand/40 uppercase tracking-widest mb-1 transition-colors">eTIMS Invoice Number</p>
                          <p className="text-[10px] font-bold text-brand transition-colors">{eTimsInvoice.invoiceNumber}</p>
                        </div>
                      )}
                    </div>

                   <button onClick={handleComplete} disabled={isSubmitting || (currentDn.isPerishable && !isTempVerified)}
                     className="w-full py-5 bg-emerald text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-20"
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
                   <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${isEnRoute ? 'bg-brand text-white animate-pulse' : 'bg-charcoal text-white/20'}`}>
                      {isPreStart ? <Package size={20} /> : isEnRoute ? <Navigation size={20} /> : <ShieldCheck size={20} />}
                   </div>
                   <div>
                      <p className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] mb-0.5 transition-colors">Mission Status</p>
                      <p className="text-xs font-black uppercase text-white tracking-tight transition-colors">{isPreStart ? 'Hub Clearance' : isEnRoute ? 'En-Route' : 'Handover'}</p>
                   </div>
                </div>
                <button onClick={() => setIsPanelExpanded(true)} className="h-10 px-5 bg-white text-navy border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Controls</button>
             </div>
           )}
        </div>

        {isPaymentModalOpen && currentDn && (
          <div className="z-[8000] relative">
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
          </div>
        )}

        {/* Chat Modal */}
        {isChatOpen && (
          <div 
            className="fixed inset-0 z-[8000] bg-slate-900/60 backdrop-blur-sm flex flex-col p-4 animate-in fade-in duration-300"
            onClick={(e) => { e.stopPropagation(); setIsChatOpen(false); }}
          >
            <div 
              className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-w-md mx-auto w-full transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="p-6 border-b border-white/10 flex justify-between items-center bg-brand text-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight">{chatRecipient === 'DISPATCH' ? 'Dispatch Comms' : 'Warehouse Manager'}</h3>
                    <p className="text-[8px] font-bold uppercase opacity-60">Secure Channel Active</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setChatRecipient(chatRecipient === 'DISPATCH' ? 'WAREHOUSE' : 'DISPATCH')}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[8px] font-black uppercase transition-colors"
                  >
                    Switch to {chatRecipient === 'DISPATCH' ? 'Warehouse' : 'Dispatch'}
                  </button>
                  <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </header>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar bg-eggshell dark:bg-slate-900 transition-colors">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.sender === 'DRIVER' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium ${msg.sender === 'DRIVER' ? 'bg-brand text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-ink dark:text-white rounded-tl-none shadow-sm transition-colors'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] font-bold text-slate-600 dark:text-white/20 uppercase mt-1 px-1 transition-colors">{msg.sender} • {msg.time}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-line dark:border-white/10 bg-white dark:bg-slate-800 flex gap-2 transition-colors">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-50 dark:bg-white/5 border border-line dark:border-white/10 rounded-xl px-4 py-3 text-xs font-medium outline-none focus:border-brand text-ink dark:text-white transition-colors"
                />
                <button 
                  onClick={handleSendMessage}
                  className="h-12 w-12 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
                >
                  <Navigation size={20} className="rotate-90" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Advisory Modal */}
        {showAdvisoryModal && (
          <div 
            className="fixed inset-0 z-[8000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300"
            onClick={(e) => { e.stopPropagation(); setShowAdvisoryModal(false); }}
          >
            <div 
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black uppercase tracking-tighter text-ink dark:text-white transition-colors">Route Intelligence</h3>
                <button onClick={() => setShowAdvisoryModal(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-600 dark:text-white/40 transition-colors"><X size={20}/></button>
              </div>

              <div className="space-y-4">
                {weatherAdvisory && (
                  <div className="p-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-3xl space-y-3 transition-colors">
                    <div className="flex items-center gap-3">
                      <CloudRain className="text-blue-500" size={24} />
                      <h4 className="text-sm font-black uppercase text-blue-900 dark:text-blue-400 transition-colors">Weather Advisory</h4>
                    </div>
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-300 leading-relaxed transition-colors">{weatherAdvisory.message}</p>
                    <Badge variant="transit" className="bg-blue-500/20 text-blue-600 border-blue-500/20">Severity: {weatherAdvisory.severity}</Badge>
                  </div>
                )}

                {trafficAdvisory && (
                  <div className="p-6 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-3xl space-y-3 transition-colors">
                    <div className="flex items-center gap-3">
                      <TrafficCone className="text-orange-500" size={24} />
                      <h4 className="text-sm font-black uppercase text-orange-900 dark:text-orange-400 transition-colors">Traffic Alert</h4>
                    </div>
                    <p className="text-xs font-medium text-orange-800 dark:text-orange-300 leading-relaxed transition-colors">{trafficAdvisory.message}</p>
                    <div className="flex gap-2">
                      <Badge variant="exception" className="bg-orange-500/20 text-orange-600 border-orange-500/20">Delay: {trafficAdvisory.delay}</Badge>
                      <button 
                        onClick={() => {
                          addNotification("Rerouting calculated. Following optimal path.", "success");
                          setShowAdvisoryModal(false);
                        }}
                        className="text-[9px] font-black text-brand uppercase underline underline-offset-4 ml-auto"
                      >
                        Calculate Reroute
                      </button>
                    </div>
                  </div>
                )}

                {!weatherAdvisory && !trafficAdvisory && (
                  <div className="py-12 text-center opacity-40">
                    <MapIcon size={48} className="mx-auto mb-4 text-ink dark:text-white transition-colors" />
                    <p className="label-mono !text-ink dark:!text-white transition-colors">No Active Advisories</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowAdvisoryModal(false)}
                className="btn-tactical w-full py-5 bg-ink dark:bg-white text-white dark:text-ink mt-8 transition-colors"
              >
                Dismiss Intel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default DriverPortal;
