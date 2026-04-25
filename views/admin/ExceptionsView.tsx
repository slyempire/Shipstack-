
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { DeliveryNote, DNStatus, ExceptionStatus, ExceptionType } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import { useAuthStore, useAppStore } from '../../store';
import {
  AlertTriangle,
  Search,
  Clock,
  ChevronRight,
  Filter,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Truck,
  Activity,
  History,
  ShieldAlert,
  X,
  RefreshCw,
  Send,
  Flag,
  BrainCircuit,
  Zap,
  Sparkles,
  TimerOff
} from 'lucide-react';
import { formatDistanceToNow, isPast, addHours, parseISO } from 'date-fns';

// SLA hours by priority — configurable per tenant in production
const SLA_HOURS: Record<string, number> = {
  HIGH: 4,
  MEDIUM: 12,
  LOW: 24,
};

function getSlaDeadline(dn: DeliveryNote): Date {
  if (dn.plannedDeliveryDate) return new Date(dn.plannedDeliveryDate);
  const hours = SLA_HOURS[dn.priority] ?? SLA_HOURS.MEDIUM;
  return addHours(new Date(dn.createdAt), hours);
}

function isSlaBreached(dn: DeliveryNote): boolean {
  if (dn.status === DNStatus.DELIVERED || dn.status === DNStatus.COMPLETED) return false;
  return isPast(getSlaDeadline(dn));
}

function getSlaStatus(dn: DeliveryNote): 'breached' | 'at-risk' | 'ok' {
  const deadline = getSlaDeadline(dn);
  const now = new Date();
  if (isPast(deadline)) return 'breached';
  const msUntil = deadline.getTime() - now.getTime();
  if (msUntil < 60 * 60 * 1000) return 'at-risk'; // < 1 hour
  return 'ok';
}

const ExceptionsView: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useAppStore();
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [allActive, setAllActive] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ExceptionStatus | 'ALL' | 'SLA_BREACH'>('ALL');
  const [selectedException, setSelectedException] = useState<DeliveryNote | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const notifiedBreachIds = useRef<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDeliveryNotes();
      const exceptions = data.filter(d => d.status === DNStatus.EXCEPTION);
      const active = data.filter(d => ![DNStatus.DELIVERED, DNStatus.COMPLETED, DNStatus.INVOICED].includes(d.status));
      setDns(exceptions);
      setAllActive(active);
    } catch (err) {
      console.error('Failed to load exceptions:', err);
      addNotification('Failed to sync exception data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fire notifications for newly detected SLA breaches
  useEffect(() => {
    const breached = allActive.filter(isSlaBreached);
    breached.forEach(dn => {
      if (!notifiedBreachIds.current.has(dn.id)) {
        notifiedBreachIds.current.add(dn.id);
        addNotification(`SLA Breach: ${dn.externalId} (${dn.clientName}) — deadline passed`, 'error');
      }
    });
  }, [allActive]);

  const handleEscalate = (dn: DeliveryNote) => {
    addNotification(`Incident REF-${dn.externalId} escalated to Senior Management.`, 'info');
    loadData();
  };

  const handleResolve = async () => {
    if (!selectedException || !resolutionNote) return;
    setIsResolving(true);
    try {
      await api.updateDNStatus(selectedException.id, DNStatus.COMPLETED, {
        exceptionStatus: ExceptionStatus.RESOLVED,
        notes: `RESOLVED: ${resolutionNote}`
      }, user?.name);
      addNotification("Exception cleared. Records updated.", "success");
      setSelectedException(null);
      setResolutionNote('');
      loadData();
    } catch (e) {
      addNotification("Sync error", "error");
    } finally {
      setIsResolving(false);
    }
  };

  const slaBreached = allActive.filter(isSlaBreached);
  const slaAtRisk = allActive.filter(dn => getSlaStatus(dn) === 'at-risk');

  const filteredDns = (() => {
    if (activeTab === 'SLA_BREACH') return slaBreached;
    return dns.filter(dn => {
      const matchesSearch = dn.externalId.toLowerCase().includes(search.toLowerCase()) ||
                           dn.clientName.toLowerCase().includes(search.toLowerCase());
      const matchesTab = activeTab === 'ALL' || dn.exceptionStatus === activeTab;
      return matchesSearch && matchesTab;
    });
  })();

  return (
    <Layout title="Exception Control Center">

      {/* SLA Breach Alert Banner */}
      {(slaBreached.length > 0 || slaAtRisk.length > 0) && (
        <div className={`mb-8 rounded-[2rem] border p-6 flex items-start gap-5 ${
          slaBreached.length > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
            slaBreached.length > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
          }`}>
            <TimerOff size={22} />
          </div>
          <div className="flex-1">
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
              slaBreached.length > 0 ? 'text-red-700' : 'text-amber-700'
            }`}>
              {slaBreached.length > 0 ? `${slaBreached.length} SLA Breach${slaBreached.length > 1 ? 'es' : ''} Active` : `${slaAtRisk.length} Shipment${slaAtRisk.length > 1 ? 's' : ''} At Risk`}
            </p>
            <div className="flex flex-wrap gap-2">
              {[...slaBreached.slice(0, 5), ...slaAtRisk.slice(0, 3)].map(dn => (
                <button
                  key={dn.id}
                  onClick={() => setSelectedException(dn)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    isSlaBreached(dn)
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  {dn.externalId} · {formatDistanceToNow(getSlaDeadline(dn), { addSuffix: true })}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('SLA_BREACH')}
            className="px-5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl bg-red-600 text-white shrink-0 hover:bg-red-700 transition-all"
          >
            View All
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
              <ShieldAlert size={80} />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">AI Risk Index</p>
              <h3 className="text-4xl font-black tracking-tighter mb-4">High</h3>
              <div className="flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-red-500">4 Critical Anomalies</span>
              </div>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <p className="label-logistics text-slate-400 mb-2">SLA Breached</p>
           <div className="flex items-center justify-between">
              <h3 className={`text-4xl font-black ${slaBreached.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>{slaBreached.length}</h3>
              <div className={`p-4 rounded-2xl ${slaBreached.length > 0 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}><TimerOff size={24} /></div>
           </div>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">{slaAtRisk.length} at risk</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <p className="label-logistics text-slate-400 mb-2">Resolution Rate</p>
           <div className="flex items-center justify-between">
              <h3 className="text-4xl font-black text-slate-900">84%</h3>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Zap size={24} /></div>
           </div>
           <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-4">+12% vs Last Week</p>
        </div>
        <div className="bg-brand p-8 rounded-[2.5rem] text-white shadow-2xl shadow-brand/20 flex flex-col justify-between">
           <div>
              <h3 className="text-lg font-black uppercase tracking-tighter mb-1">Smart Resolve</h3>
              <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">AI-Suggested Actions</p>
           </div>
           <button className="w-full py-3 bg-white text-brand rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              Execute Batch Fix
           </button>
        </div>
      </div>

      {/* FEATURE 3: AI Classification & Smart Resolution */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col mb-12 relative">
        {(!api.getTenantPlan() || api.getTenantPlan() === 'STARTER' || api.getTenantPlan() === 'GROWTH') && activeTab !== 'SLA_BREACH' && (
          <div className="absolute inset-0 z-50 bg-slate-50/60 backdrop-blur-[2px] flex items-center justify-center p-8 text-center">
            <div className="bg-white rounded-[2rem] p-8 max-w-md shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
              <div className="h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <BrainCircuit size={24} />
              </div>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Automate Exception Solving</h4>
              <p className="text-sm text-slate-500 font-medium mb-6">
                Cortex AI automatically classifies anomalies and suggests instant fixes based on historical integrity. Upgrade to SCALE to enable Smart Resolution.
              </p>
              <button
                onClick={() => navigate('/admin/subscription')}
                className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                View Scale Intelligence
              </button>
            </div>
          </div>
        )}
         <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
                  <Activity size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Intelligent Exception Log</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI-Categorized Operational Deviations</p>
               </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
               {/* Tab filters */}
               <div className="flex items-center gap-2">
                 {(['ALL', 'SLA_BREACH', ExceptionStatus.REPORTED, ExceptionStatus.RESOLVED] as const).map(tab => (
                   <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                       activeTab === tab
                         ? tab === 'SLA_BREACH' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
                         : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                     }`}
                   >
                     {tab === 'SLA_BREACH' ? `SLA Breaches${slaBreached.length > 0 ? ` (${slaBreached.length})` : ''}` : tab.replace('_', ' ')}
                   </button>
                 ))}
               </div>
               {activeTab !== 'SLA_BREACH' && (
                 <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type="text"
                      placeholder="Search anomalies..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand outline-none transition-all shadow-sm"
                    />
                 </div>
               )}
            </div>
         </div>

         <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-10 py-5 label-logistics">
                       {activeTab === 'SLA_BREACH' ? 'Shipment' : 'AI Classification'}
                     </th>
                     <th className="px-10 py-5 label-logistics">Incident Detail</th>
                     <th className="px-10 py-5 label-logistics">SLA Status</th>
                     <th className="px-10 py-5 label-logistics">
                       {activeTab === 'SLA_BREACH' ? 'Deadline' : 'Smart Resolution'}
                     </th>
                     <th className="px-10 py-5 text-right"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={5} className="p-20 text-center animate-pulse text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">Cortex AI Analyzing Logs...</td></tr>
                  ) : filteredDns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center">
                         <ShieldAlert className="mx-auto text-slate-200 mb-4" size={48} />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           {activeTab === 'SLA_BREACH' ? 'No SLA breaches detected' : 'No anomalies detected'}
                         </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDns.map(dn => {
                      const slaStatus = getSlaStatus(dn);
                      const deadline = getSlaDeadline(dn);
                      const aiCategory = dn.exceptionType === ExceptionType.LATE ? 'Logistics Delay' : 'Data Integrity';
                      const aiSuggestion = dn.exceptionType === ExceptionType.LATE ? 'Re-route via Loresho' : 'Manual Address Validation';
                      const confidence = 85 + Math.floor(Math.random() * 10);

                      return (
                        <tr
                          key={dn.id}
                          className={`hover:bg-slate-50 transition-colors group cursor-pointer ${slaStatus === 'breached' ? 'bg-red-50/40' : slaStatus === 'at-risk' ? 'bg-amber-50/30' : ''}`}
                          onClick={() => setSelectedException(dn)}
                        >
                           <td className="px-10 py-8">
                              <div className="flex items-center gap-4">
                                 <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                                   slaStatus === 'breached' ? 'bg-red-100 text-red-600' :
                                   slaStatus === 'at-risk' ? 'bg-amber-100 text-amber-600' :
                                   dn.exceptionType === ExceptionType.LATE ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'
                                 }`}>
                                    {slaStatus === 'breached' ? <TimerOff size={20} /> :
                                     dn.exceptionType === ExceptionType.LATE ? <Clock size={20} /> : <AlertCircle size={20} />}
                                 </div>
                                 <div>
                                    {activeTab !== 'SLA_BREACH' && (
                                      <Badge variant={dn.exceptionType === ExceptionType.LATE ? 'failed' : 'exception'} className="mb-1.5">{aiCategory}</Badge>
                                    )}
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">REF-{dn.externalId}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-8">
                              <p className="body-value truncate-name max-w-[250px] mb-1">{dn.clientName}</p>
                              <p className="text-[10px] font-bold text-slate-400 italic line-clamp-1">
                                {activeTab === 'SLA_BREACH'
                                  ? `Priority: ${dn.priority}`
                                  : `"${dn.exceptionReason || 'Root cause analysis pending'}"`}
                              </p>
                           </td>
                           <td className="px-10 py-8">
                              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                slaStatus === 'breached' ? 'bg-red-50 text-red-600 border-red-100' :
                                slaStatus === 'at-risk' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                              }`}>
                                {slaStatus === 'breached' ? <TimerOff size={11} /> : slaStatus === 'at-risk' ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                                {slaStatus === 'breached' ? 'Breached' : slaStatus === 'at-risk' ? 'At Risk' : 'On Track'}
                              </div>
                           </td>
                           <td className="px-10 py-8">
                              {activeTab === 'SLA_BREACH' ? (
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-red-700">{formatDistanceToNow(deadline, { addSuffix: true })}</span>
                                  <span className="text-[9px] font-bold text-slate-400">{deadline.toLocaleDateString()} {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 text-brand">
                                   <Sparkles size={14} />
                                   <span className="text-[10px] font-black uppercase tracking-widest">{aiSuggestion}</span>
                                </div>
                              )}
                           </td>
                           <td className="px-10 py-8 text-right">
                              <div className="flex justify-end gap-3">
                                 <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                                    Apply Fix
                                 </button>
                                 <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand transition-all shadow-sm">
                                    <ChevronRight size={16} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                      );
                    })
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Resolution Modal */}
      {selectedException && (
        <div className="fixed inset-0 z-[100] bg-brand/40 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-lg text-white ${
                      isSlaBreached(selectedException) ? 'bg-red-600' : 'bg-amber-500'
                    }`}>
                       <ShieldAlert size={20} />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Incident Resolution</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">REF-{selectedException.externalId}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedException(null)} className="text-slate-400 hover:text-brand"><X size={24} /></button>
              </div>

              <div className="p-10 space-y-6">
                 {/* SLA Status in modal */}
                 {getSlaStatus(selectedException) !== 'ok' && (
                   <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                     isSlaBreached(selectedException)
                       ? 'bg-red-50 border-red-200 text-red-700'
                       : 'bg-amber-50 border-amber-200 text-amber-700'
                   }`}>
                     <TimerOff size={16} className="shrink-0" />
                     <div>
                       <p className="text-[9px] font-black uppercase tracking-widest mb-0.5">
                         {isSlaBreached(selectedException) ? 'SLA Breached' : 'SLA At Risk'}
                       </p>
                       <p className="text-xs font-bold">
                         Deadline: {getSlaDeadline(selectedException).toLocaleString()} ({formatDistanceToNow(getSlaDeadline(selectedException), { addSuffix: true })})
                       </p>
                     </div>
                   </div>
                 )}

                 <div className="p-6 bg-red-50 border border-red-100 rounded-2xl">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Original Exception Flag</p>
                    <p className="text-xs font-bold text-slate-900 leading-relaxed italic">"{selectedException.exceptionReason || 'No reason recorded'}"</p>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Resolution Protocol Summary</label>
                    <textarea
                      autoFocus
                      required
                      value={resolutionNote}
                      onChange={e => setResolutionNote(e.target.value)}
                      placeholder="Detail the actions taken to clear this exception..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-brand outline-none min-h-[120px] transition-all"
                    />
                 </div>

                 <div className="flex gap-4">
                    <button
                      onClick={() => handleEscalate(selectedException)}
                      className="flex-1 py-4 border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-all"
                    >
                       Escalate Further
                    </button>
                    <button
                      onClick={handleResolve}
                      disabled={!resolutionNote || isResolving}
                      className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-2"
                    >
                       {isResolving ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                       Confirm Resolution
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default ExceptionsView;
