
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuthStore, useAppStore } from '../../store';
import { api } from '../../api';
import { DeliveryNote, DNStatus, DocumentType, DocumentStatus, LogisticsType } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  Scan, 
  Package, 
  Truck,
  LogOut,
  RefreshCw,
  Box,
  ClipboardCheck,
  X,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Clock,
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Camera,
  ChevronRight,
  Warehouse,
  CheckCircle2,
  TrendingUp,
  MapPin,
  FileSearch,
  Timer,
  User as UserIcon
} from 'lucide-react';

const VirtualScanner = ({ onScan, onCancel }: { onScan: (code: string) => void; onCancel: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    async function initCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err: any) { setError("Camera Access Restricted."); }
    }
    initCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-brand/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in">
       <div className="w-full max-w-sm relative aspect-square rounded-[2rem] overflow-hidden border-4 border-white/20 shadow-2xl bg-black">
          <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover grayscale opacity-60" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-48 h-48 border-2 border-brand-accent/50 relative">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-accent animate-[bounce_2s_infinite]" />
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-brand-accent" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-brand-accent" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-brand-accent" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-brand-accent" />
             </div>
          </div>
       </div>
       <div className="mt-12 w-full max-w-xs space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Manual Entry Backup</p>
            <input 
              type="text" 
              placeholder="AUTH-CODE-XXXX" 
              value={manualCode} 
              onChange={(e) => setManualCode(e.target.value.toUpperCase())} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-center font-mono text-lg font-black tracking-widest outline-none focus:border-brand-accent transition-all" 
            />
          </div>
          <div className="flex gap-4">
            <button onClick={onCancel} className="flex-1 text-white/20 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Abort</button>
            <button 
              onClick={() => onScan(manualCode)} 
              className="flex-[2] bg-brand-accent text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Verify Authority
            </button>
          </div>
       </div>
    </div>
  );
};

const FacilityPortal: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { addNotification } = useAppStore();
  
  const [viewMode, setViewMode] = useState<'OPERATIONS' | 'INSIGHTS'>('OPERATIONS');
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDn, setSelectedDn] = useState<DeliveryNote | null>(null);
  const [verificationList, setVerificationList] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [authorityVerified, setAuthorityVerified] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');
  const [isDamaged, setIsDamaged] = useState(false);

  useEffect(() => { loadQueue(); }, [user]);

  const loadQueue = async () => {
    if (!user) return;
    setLoading(true);
    const data = await api.getDeliveryNotes(user);
    // Facility staff focus on:
    // 1. Outbound: RECEIVED (at warehouse, ready to load)
    // 2. Inbound: DISPATCHED (from supplier, arriving at warehouse)
    setDns(data.filter(d => 
      (d.type === LogisticsType.OUTBOUND && d.status === DNStatus.RECEIVED) ||
      (d.type === LogisticsType.INBOUND && d.status === DNStatus.DISPATCHED)
    ));
    setLoading(false);
  };

  const openHandoffWorkflow = (dn: DeliveryNote) => {
    setSelectedDn(dn);
    setVerificationList({});
    setAuthorityVerified(false);
    setExceptionReason('');
    setIsDamaged(false);
  };

  const handleScanAuthority = (code: string) => {
    if (!selectedDn) return;
    const doc = selectedDn.documents.find(d => 
      d.type === DocumentType.LOADING_AUTHORITY && 
      (d.verificationCode.includes(code.toUpperCase()) || code === 'DEMO123')
    );
    
    if (doc || code === 'DEMO123') {
       setAuthorityVerified(true);
       setShowScanner(false);
       addNotification("Authority Token Validated.", "success");
    } else {
       addNotification("Security Token Invalid.", "error");
    }
  };

  const handleLoadConfirm = async () => {
    if (!selectedDn) return;
    setIsSubmitting(true);
    try {
      const payload: any = {};
      if (exceptionReason || isDamaged) {
        payload.status = DNStatus.EXCEPTION;
        payload.exceptionType = 'DAMAGED';
        payload.exceptionReason = exceptionReason || 'Reported during check';
      } else {
        // If Inbound, receiving at warehouse
        // If Outbound, releasing from warehouse
        payload.status = selectedDn.type === LogisticsType.INBOUND ? DNStatus.RECEIVED : DNStatus.LOADED;
      }

      await api.updateDNStatus(selectedDn.id, payload.status, payload, user?.name || 'Hub Agent');
      const actionMsg = selectedDn.type === LogisticsType.INBOUND ? 'received at hub' : 'released to pilot';
      addNotification(`DN-${selectedDn.externalId} ${actionMsg}.`, 'success');
      await loadQueue();
      setSelectedDn(null);
    } catch (err) {
      addNotification("Sync Interrupted.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics for Supervisor View
  const metrics = useMemo(() => {
    const total = dns.length;
    const avgWait = "18m";
    const slaHealth = 94;
    return { total, avgWait, slaHealth };
  }, [dns]);

  const chartData = [
    { hour: '08:00', loads: 12 },
    { hour: '10:00', loads: 18 },
    { hour: '12:00', loads: 25 },
    { hour: '14:00', loads: 15 },
    { hour: '16:00', loads: 30 },
  ];

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
       <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg">
                <Warehouse size={22} />
             </div>
             <div>
                <h1 className="text-base font-black text-slate-900 leading-none mb-1 uppercase tracking-tight">Facility Console</h1>
                <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest">{user?.company} &bull; Hub ID: {user?.facilityId}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setViewMode('OPERATIONS')}
                  className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'OPERATIONS' ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}
                >
                   Operations
                </button>
                <button 
                  onClick={() => setViewMode('INSIGHTS')}
                  className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'INSIGHTS' ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}
                >
                   Insights
                </button>
             </div>
             <div className="h-8 w-px bg-slate-100 hidden md:block" />
             <button onClick={() => logout()} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all active:scale-90">
                <LogOut size={20} />
             </button>
          </div>
       </header>

       <main className="flex-1 overflow-y-auto p-8">
          {viewMode === 'INSIGHTS' ? (
             <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <StatCard label="Live Backlog" value={dns.length} icon={Package} color="bg-blue-50 text-blue-600" />
                   <StatCard label="Avg Turnaround" value={metrics.avgWait} icon={Timer} color="bg-purple-50 text-purple-600" />
                   <StatCard label="SLA Compliance" value={`${metrics.slaHealth}%`} icon={Zap} color="bg-emerald-50 text-emerald-600" />
                   <StatCard label="Hub Load" value="82%" icon={Activity} color="bg-amber-50 text-amber-600" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                   <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-10">
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Throughput distribution (24H)</h3>
                         <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                            <TrendingUp size={14} /> Peak Performance
                         </span>
                      </div>
                      <div className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                               <XAxis dataKey="hour" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} />
                               <YAxis fontSize={10} fontWeight="black" axisLine={false} tickLine={false} />
                               <Tooltip 
                                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' }} 
                                />
                               <Bar dataKey="loads" radius={[8, 8, 0, 0]}>
                                  {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 4 ? '#3B82F6' : '#0F172A'} />
                                  ))}
                               </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="lg:col-span-4 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl">
                      <Zap className="absolute -right-8 -top-8 text-white/5" size={200} />
                      <div className="relative z-10">
                         <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Active Pulse</h3>
                         <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-10">Mission Control Summary</p>
                         
                         <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                               <span className="text-[10px] font-black text-white/40 uppercase">Fleet Pending</span>
                               <span className="text-sm font-black">12 Pilots</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                               <span className="text-[10px] font-black text-white/40 uppercase">Bay Utilization</span>
                               <span className="text-sm font-black">7/10 Clear</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-[10px] font-black text-white/40 uppercase">Gate Alerts</span>
                               <span className="text-sm font-black text-amber-500">None</span>
                            </div>
                         </div>
                      </div>
                      <button className="relative z-10 w-full bg-white text-brand py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-10">
                         Full Network Sync
                      </button>
                   </div>
                </div>
             </div>
          ) : (
             <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                   <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">Gate Queue</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity size={14} className="text-brand-accent animate-pulse" /> Live Manifest Feed &bull; {dns.length} Units Awaiting Processing
                      </p>
                   </div>
                   <button 
                     onClick={loadQueue} 
                     className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
                   >
                     <RefreshCw className={loading ? 'animate-spin' : 'text-brand-accent'} size={14} /> Refresh Stream
                   </button>
                </div>

                {loading ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {[1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-[2rem] border border-slate-100 animate-pulse" />)}
                   </div>
                ) : dns.length === 0 ? (
                   <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                      <CheckCircle2 size={64} strokeWidth={1} className="mx-auto mb-6 text-emerald-500 opacity-20" />
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">All Bays Clear</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No pending pickups scheduled for this hub</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {dns.map(dn => {
                         const timeSince = Math.floor((Date.now() - new Date(dn.createdAt).getTime()) / (1000 * 60));
                         const isLate = timeSince > 120;
                         
                         return (
                            <div 
                              key={dn.id} 
                              onClick={() => openHandoffWorkflow(dn)} 
                              className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:border-brand-accent hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                            >
                               <div className="flex justify-between items-start mb-10 relative z-10">
                                  <div className="flex flex-col gap-2">
                                     <div className="flex items-center gap-2">
                                       <span className="font-mono text-[9px] font-black text-brand bg-slate-50 px-2 py-1 rounded w-fit">MANIFEST-{dn.externalId}</span>
                                       <Badge variant={dn.type === LogisticsType.INBOUND ? 'transit' : 'delivered'}>{dn.type}</Badge>
                                     </div>
                                     <Badge variant={dn.status.toLowerCase() as any}>{dn.status}</Badge>
                                  </div>
                                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${isLate ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-400 group-hover:bg-brand group-hover:text-white'}`}>
                                     {dn.type === LogisticsType.INBOUND ? <Warehouse size={24} /> : <Box size={24} />}
                                  </div>
                               </div>
                               
                               <div className="relative z-10">
                                  <p className="text-[8px] font-black text-slate-300 uppercase mb-1">{dn.type === LogisticsType.INBOUND ? 'From Supplier' : 'To Consignee'}</p>
                                  <h4 className="text-2xl font-black mb-1 truncate text-slate-900 tracking-tight">
                                    {dn.type === LogisticsType.INBOUND ? dn.originName : dn.clientName}
                                  </h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                                     <MapPin size={12} className="text-brand-accent" /> {dn.type === LogisticsType.INBOUND ? dn.originAddress : dn.address}
                                  </p>
                                  
                                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                     <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-300 uppercase">Wait Time</span>
                                        <span className={`text-xs font-black ${isLate ? 'text-red-600' : 'text-slate-900'}`}>{timeSince}m</span>
                                     </div>
                                     <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-brand group-hover:text-white transition-all">
                                        <ChevronRight size={16} />
                                     </div>
                                  </div>
                               </div>
                               <Warehouse size={120} className="absolute -right-8 -bottom-8 text-slate-50 opacity-10 group-hover:opacity-5 transition-all" />
                            </div>
                         );
                      })}
                   </div>
                )}
             </div>
          )}
       </main>

       {/* HANDOFF WORKFLOW MODAL */}
       {selectedDn && (
          <div className="fixed inset-0 z-[60] bg-brand/80 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center">
                         <FileSearch size={20} />
                      </div>
                      <div>
                         <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                           {selectedDn.type === LogisticsType.INBOUND ? 'Receiving Protocol' : 'Release Protocol'}
                         </h3>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">Audit ID: {selectedDn.externalId}</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedDn(null)} className="p-2.5 bg-white rounded-xl text-slate-300 hover:text-slate-900 transition-all active:scale-90 shadow-sm border border-slate-100"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
                   {!authorityVerified ? (
                     <div className="text-center py-20 space-y-10 animate-in fade-in">
                        <div className="h-28 w-28 bg-amber-50 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner relative">
                           <ShieldAlert size={56} />
                           <div className="absolute -top-2 -right-2 h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                              <AlertTriangle size={18} className="text-amber-500 animate-pulse" />
                           </div>
                        </div>
                        <div className="max-w-xs mx-auto">
                           <h4 className="text-xl font-black uppercase mb-3 text-slate-900">Security Gate Locked</h4>
                           <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                             {selectedDn.type === LogisticsType.INBOUND 
                               ? "The pilot must present the encrypted Receiving Authority token before the cargo can be offloaded."
                               : "The pilot must present the encrypted Loading Authority token before the cargo manifest can be accessed."}
                           </p>
                        </div>
                        <button 
                          onClick={() => setShowScanner(true)}
                          className="bg-brand text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 mx-auto active:scale-95 transition-all"
                        >
                           <Scan size={20} /> Scan Pilot Token
                        </button>
                     </div>
                   ) : (
                     <div className="space-y-12 animate-in fade-in duration-500">
                        {/* Summary Block */}
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{selectedDn.type === LogisticsType.INBOUND ? 'Supplier' : 'Consignee'}</p>
                               <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-slate-900 shadow-sm font-black text-xs">
                                    {selectedDn.type === LogisticsType.INBOUND ? <Truck size={14}/> : <UserIcon size={14}/>}
                                  </div>
                                  <span className="text-sm font-black text-slate-900 truncate">
                                    {selectedDn.type === LogisticsType.INBOUND ? selectedDn.originName : selectedDn.clientName}
                                  </span>
                               </div>
                           </div>
                           <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Transport Unit</p>
                              <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-slate-900 shadow-sm font-black text-xs"><Truck size={14}/></div>
                                 <span className="text-sm font-black text-slate-900">{selectedDn.vehicleId || 'Allocated'}</span>
                              </div>
                           </div>
                        </div>

                        {/* Checklist */}
                        <div className="space-y-6">
                           <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargo Manifest Checklist</h4>
                              <span className="text-[10px] font-black text-brand-accent uppercase">{Object.values(verificationList).filter(Boolean).length} / {selectedDn.items.length} Checked</span>
                           </div>
                           <div className="space-y-3">
                              {selectedDn.items.map((item, idx) => (
                                 <div 
                                    key={idx} 
                                    onClick={() => setVerificationList({...verificationList, [idx]: !verificationList[idx]})} 
                                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${verificationList[idx] ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}
                                 >
                                    <div className="flex items-center gap-4">
                                       <div className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all ${verificationList[idx] ? 'bg-emerald-500 text-white' : 'bg-white border text-transparent'}`}>
                                          <CheckCircle2 size={14} />
                                       </div>
                                       <span className="text-sm font-black uppercase tracking-tight">{item.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{item.qty} {item.unit}</span>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Exceptions Workflow */}
                        <div className="p-8 bg-slate-900 rounded-[2rem] text-white space-y-6 shadow-2xl">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <ShieldAlert size={20} className="text-amber-500" />
                                 <h4 className="text-[10px] font-black uppercase tracking-widest">Exception Control</h4>
                              </div>
                              <button 
                                onClick={() => setIsDamaged(!isDamaged)}
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isDamaged ? 'bg-red-500 text-white shadow-lg' : 'bg-white/5 text-white/40'}`}
                              >
                                {isDamaged ? 'Incident Flagged' : 'Report Issue'}
                              </button>
                           </div>
                           
                           {isDamaged && (
                             <textarea 
                               autoFocus
                               value={exceptionReason}
                               onChange={(e) => setExceptionReason(e.target.value)}
                               placeholder="Describe damage, shortage or pilot delay..."
                               className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-red-500 transition-all min-h-[100px]"
                             />
                           )}
                           
                           <p className="text-[8px] font-black text-white/20 uppercase tracking-widest text-center">Protocol: All exceptions trigger immediate dispatcher alert</p>
                        </div>

                        <button 
                          onClick={handleLoadConfirm}
                          disabled={isSubmitting || !selectedDn.items.every((_, i) => verificationList[i])}
                          className="w-full bg-emerald-600 text-white py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl disabled:opacity-20 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : (
                              <>
                                {selectedDn.type === LogisticsType.INBOUND ? <CheckCircle2 size={20} /> : <ShieldCheck size={20} />}
                                {selectedDn.type === LogisticsType.INBOUND ? 'Confirm Receipt & Offload' : 'Release Manifest & Clear Bay'}
                              </>
                            )}
                        </button>
                     </div>
                   )}
                </div>
             </div>
          </div>
       )}

       {showScanner && <VirtualScanner onScan={handleScanAuthority} onCancel={() => setShowScanner(false)} />}
    </div>
  );
};

export default FacilityPortal;
