import React from 'react';
import { DeliveryNote, DNStatus } from '../../../types';
import { Activity, Award, AlertTriangle, Bell, Camera, Check, CheckCircle2, ChevronRight, ClipboardCheck, Clock, HelpCircle, LogOut, RefreshCw, ShieldCheck, Smartphone, TrendingUp, Circle } from 'lucide-react';

export type AuxTab = 'PERFORMANCE' | 'INSPECTION' | 'SUPPORT' | 'SETTINGS';

interface PerformancePanelProps {
  badges: Array<{ id: string; name: string; icon: React.ComponentType<any>; color: string; earned: boolean }>;
  carbonSaved: number;
  activeTrip: DeliveryNote | null;
  loadingTrip: boolean;
  actionConfig: { label: string; icon: React.ComponentType<any>; path: string };
  onActionClick: () => void;
}

interface InspectionPanelProps {
  inspectionItems: Array<{ id: string; label: string }>;
  inspectionData: Record<string, { status: 'PASS' | 'FAIL' | 'PENDING'; photoUrl?: string }>;
  onStatusChange: (id: string, status: 'PASS' | 'FAIL') => void;
  onPhotoUpload: (id: string) => void;
  onSubmit: () => void;
}

interface SupportPanelProps {
  onOpenGuide: () => void;
}

interface SettingsPanelProps {
  onLogout: () => void;
}

export const DriverPerformancePanel: React.FC<PerformancePanelProps> = ({
  badges,
  carbonSaved,
  activeTrip,
  loadingTrip,
  actionConfig,
  onActionClick
}) => (
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

    <div className="card-tactical !p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="label-mono mb-1 flex items-center gap-2 text-slate-900 dark:text-white"><Activity size={12} className="text-brand-accent" /> Recent Activity</h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tight">Route performance summary</p>
        </div>
        <button onClick={onActionClick} className="py-3 px-4 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-slate-800">
          <actionConfig.icon size={16} className="inline-block mr-2" /> {actionConfig.label}
        </button>
      </div>

      <div className="space-y-4">
        {loadingTrip ? (
          <div className="rounded-3xl bg-slate-100 p-6 text-sm text-slate-500">Loading current route...</div>
        ) : activeTrip ? (
          <div className="rounded-3xl border border-slate-200 p-6 bg-slate-50 text-slate-900">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Active Route</p>
            <p className="text-2xl font-black uppercase tracking-tight mb-2">{activeTrip.clientName}</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{activeTrip.address}</p>
            <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-slate-500">
              <span>{activeTrip.status.replace('_', ' ')}</span>
              <span>{activeTrip.type}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-slate-100 p-6 text-sm text-slate-500">No active runs assigned. Use Manifest to claim a trip.</div>
        )}
      </div>
    </div>

    <div className="card-tactical !p-6">
      <h3 className="label-mono mb-5 flex items-center gap-2"><Award size={12} /> Driver Achievements</h3>
      <div className="grid grid-cols-4 gap-4">
        {badges.map((badge) => (
          <div key={badge.id} className="flex flex-col items-center gap-2">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${badge.earned ? 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-xl' : 'bg-slate-100 dark:bg-slate-900/50 opacity-20 grayscale'}`}>
              <badge.icon size={20} className={badge.earned ? badge.color : 'text-slate-900 dark:text-white'} />
            </div>
            <span className={`label-mono text-[7px] text-center ${badge.earned ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-white/20'}`}>{badge.name}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const DriverInspectionPanel: React.FC<InspectionPanelProps> = ({
  inspectionItems,
  inspectionData,
  onStatusChange,
  onPhotoUpload,
  onSubmit
}) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div>
      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">Safety Protocol</h3>
      <p className="label-mono">Daily Vehicle Health Check</p>
    </div>

    <div className="space-y-3">
      {inspectionItems.map((item) => {
        const data = inspectionData[item.id] || { status: 'PENDING' };
        return (
          <div key={item.id} className="card-tactical !p-0 overflow-hidden transition-colors">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${data.status === 'PASS' ? 'bg-emerald-500 text-white' : data.status === 'FAIL' ? 'bg-red-500 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-600 border border-slate-100 dark:border-transparent'}`}>
                  {data.status === 'PASS' ? <Check size={18} /> : data.status === 'FAIL' ? <AlertTriangle size={18} /> : <Circle size={18} />}
                </div>
                <span className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => onStatusChange(item.id, 'PASS')} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${data.status === 'PASS' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-transparent'}`}>Pass</button>
                <button onClick={() => onStatusChange(item.id, 'FAIL')} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${data.status === 'FAIL' ? 'bg-red-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-transparent'}`}>Fail</button>
              </div>
            </div>
            {data.status === 'FAIL' && (
              <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="label-mono !text-red-500 dark:!text-red-400 mb-1.5">Evidence Required</p>
                    {data.photoUrl ? (
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-14 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                          <img src={data.photoUrl} className="h-full w-full object-cover" alt="Evidence" />
                        </div>
                        <button onClick={() => onPhotoUpload(item.id)} className="label-mono !text-slate-500 hover:!text-slate-900 dark:hover:!text-white flex items-center gap-1 transition-colors"><RefreshCw size={8} /> Retake</button>
                      </div>
                    ) : (
                      <button onClick={() => onPhotoUpload(item.id)} className="flex items-center gap-1.5 text-brand-accent hover:text-blue-400 transition-colors">
                        <Camera size={14} />
                        <span className="label-mono !text-brand-accent">Capture Photo</span>
                      </button>
                    )}
                  </div>
                  {data.photoUrl && <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center"><Check size={14} strokeWidth={3} /></div>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
    <button onClick={onSubmit} className="btn-tactical w-full py-6 bg-brand text-white shadow-2xl flex items-center justify-center gap-2">
      <ClipboardCheck size={18} /> Submit Safety Report
    </button>
  </div>
);

export const DriverSupportPanel: React.FC<SupportPanelProps> = ({ onOpenGuide }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div>
      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">Operations Support</h3>
      <p className="label-mono">24/7 Field Assistance</p>
    </div>
    <div className="grid grid-cols-1 gap-3">
      <button className="card-tactical !p-6 flex items-center gap-5 group active:bg-slate-100 dark:active:bg-slate-700 transition-all text-left">
        <div className="h-12 w-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all"><AlertTriangle size={24} /></div>
        <div className="flex-1">
          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">Emergency SOS</h4>
          <p className="text-[8px] font-bold text-slate-500 dark:text-slate-500 uppercase">Accident or Breakdown</p>
        </div>
        <ChevronRight size={18} className="text-slate-500 dark:text-slate-600" />
      </button>
      <button className="card-tactical !p-6 flex items-center gap-5 group active:bg-slate-100 dark:active:bg-slate-700 transition-all text-left">
        <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all"><HelpCircle size={24} /></div>
        <div className="flex-1">
          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">Help Center</h4>
          <p className="text-[8px] font-bold text-slate-500 dark:text-slate-500 uppercase">App Guides & FAQs</p>
        </div>
        <ChevronRight size={18} className="text-slate-500 dark:text-slate-600" />
      </button>
      <button onClick={onOpenGuide} className="card-tactical !p-6 bg-brand/10 dark:bg-brand/40 border-brand/20 flex items-center gap-5 group active:bg-brand/20 dark:active:bg-brand/60 transition-all text-left">
        <div className="h-12 w-12 rounded-xl bg-brand-accent text-white flex items-center justify-center shadow-lg"><ShieldCheck size={24} /></div>
        <div className="flex-1">
          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">Platform Pillars</h4>
          <p className="text-[8px] font-bold text-brand-accent/60 dark:text-white/40 uppercase">Learn how Shipstack works</p>
        </div>
        <ChevronRight size={18} className="text-brand-accent/40 dark:text-white/20" />
      </button>
    </div>
    <div className="card-tactical text-center">
      <p className="label-mono mb-3">Direct Dispatch Line</p>
      <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">+254 700 000 000</p>
      <button className="btn-tactical w-full bg-brand text-white shadow-lg">Call Dispatch Now</button>
    </div>
  </div>
);

export const DriverSettingsPanel: React.FC<SettingsPanelProps> = ({ onLogout }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div>
      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">Terminal Config</h3>
      <p className="label-mono">Personalize your experience</p>
    </div>
    <div className="space-y-3">
      <div className="p-5 bg-eggshell border border-line rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white border border-line flex items-center justify-center text-slate-500"><Bell size={18} /></div>
          <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Push Notifications</span>
        </div>
        <div className="h-5 w-10 bg-brand rounded-full relative p-1"><div className="h-3 w-3 bg-white rounded-full ml-auto" /></div>
      </div>
      <div className="p-5 bg-eggshell border border-line rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white border border-line flex items-center justify-center text-slate-500"><Smartphone size={18} /></div>
          <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Offline Maps Cache</span>
        </div>
        <button className="label-mono !text-brand-accent">Manage</button>
      </div>
    </div>
    <button onClick={onLogout} className="btn-tactical w-full py-6 bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center gap-2">
      <LogOut size={18} /> Terminate Session
    </button>
  </div>
);
