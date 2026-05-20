
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../../store';
import { api } from '../../api';
import {
  ChevronLeft,
  Activity,
  ShieldCheck,
  HelpCircle,
  ClipboardCheck,
  TrendingUp,
  Award,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Bell,
  Moon,
  Smartphone,
  Circle,
  Camera,
  Check,
  RefreshCw,
  Play,
  Navigation,
  List,
} from 'lucide-react';
import { DNStatus, DeliveryNote } from '../../types';

import { DriverBottomNav } from '../../components/driver/DriverBottomNav';
import FeatureGuide from '../../components/FeatureGuide';
import { DriverPerformancePanel, DriverInspectionPanel, DriverSupportPanel, DriverSettingsPanel } from '../../components/driver/portal/DriverAuxiliaryPanels';

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
      case DNStatus.PENDING:
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

  const renderPanel = () => {
    if (activeTab === 'PERFORMANCE') return (
      <DriverPerformancePanel
        badges={badges}
        carbonSaved={carbonSaved}
        activeTrip={activeTrip}
        loadingTrip={loadingTrip}
        actionConfig={{
          label: 'Live Trip',
          icon: Navigation,
          path: '/driver'
        }}
        onActionClick={() => navigate('/driver')}
      />
    );

    if (activeTab === 'INSPECTION') return (
      <DriverInspectionPanel
        inspectionItems={inspectionItems}
        inspectionData={inspectionData}
        onStatusChange={handleInspectionStatus}
        onPhotoUpload={handlePhotoUpload}
        onSubmit={submitInspection}
      />
    );

    if (activeTab === 'SUPPORT') return <DriverSupportPanel onOpenGuide={() => setGuideOpen(true)} />;

    return <DriverSettingsPanel onLogout={() => { logout(); navigate('/login'); }} />;
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white font-sans p-6 pb-40 transition-colors duration-300">
      <header className="flex items-center justify-between mb-8 pt-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white/5 border border-white/5 rounded-2xl text-white active:scale-90 transition-all shadow-sm">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-black uppercase tracking-widest text-[#FF8C42]">Driver Hub</h1>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-[#FF8C42] text-white flex items-center justify-center text-lg font-black shadow-lg">
          {user?.name?.charAt(0) || '?'}
        </div>
      </header>

      <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/10">
        {(['PERFORMANCE', 'INSPECTION', 'SUPPORT', 'SETTINGS'] as AuxTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === tab 
                ? 'bg-[#FF8C42] text-white shadow-lg' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            {tab === 'PERFORMANCE' ? 'Stats' : tab === 'INSPECTION' ? 'Safety' : tab === 'SUPPORT' ? 'Help' : 'Config'}
          </button>
        ))}
      </div>

      <main className="animate-in fade-in duration-500">
        {renderPanel()}
      </main>

      <DriverBottomNav 
        activeTab="HUB"
        onTabChange={(tab) => {
          if (tab === 'LIST') navigate('/driver');
          else if (tab === 'SAFETY') navigate('/driver'); // Or handle internally
          else if (tab === 'ALERTS') navigate('/driver');
          else if (tab === 'MORE') navigate('/driver');
        }}
      />

      <FeatureGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
};

export default DriverAuxiliary;
