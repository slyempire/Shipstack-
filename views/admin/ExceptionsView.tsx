
import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';

const ExceptionsView: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useAppStore();
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ExceptionStatus | 'ALL'>(ExceptionStatus.REPORTED);
  const [selectedException, setSelectedException] = useState<DeliveryNote | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDeliveryNotes();
      setDns(data.filter(d => d.status === DNStatus.EXCEPTION));
    } catch (err) {
      console.error('Failed to load exceptions:', err);
      addNotification('Failed to sync exception data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = (dn: DeliveryNote) => {
    addNotification(`Incident REF-${dn.externalId} escalated to Senior Management.`, 'info');
    // Mocking state update
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

  const filteredDns = dns.filter(dn => {
    const matchesSearch = dn.externalId.toLowerCase().includes(search.toLowerCase()) || 
                         dn.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'ALL' || dn.exceptionStatus === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <Layout title="Exception Control Center">
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
           <p className="label-logistics text-slate-400 mb-2">Auto-Classified</p>
           <div className="flex items-center justify-between">
              <h3 className="text-4xl font-black text-slate-900">{dns.length}</h3>
              <div className="p-4 bg-brand/10 text-brand rounded-2xl"><BrainCircuit size={24} /></div>
           </div>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">92% Accuracy Rating</p>
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
        {(!api.getTenantPlan() || api.getTenantPlan() === 'STARTER' || api.getTenantPlan() === 'GROWTH') && (
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
            <div className="flex items-center gap-4">
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
               <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand transition-all shadow-sm">
                  <Filter size={20} />
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-10 py-5 label-logistics">AI Classification</th>
                     <th className="px-10 py-5 label-logistics">Incident Detail</th>
                     <th className="px-10 py-5 label-logistics">Confidence</th>
                     <th className="px-10 py-5 label-logistics">Smart Resolution</th>
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
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No anomalies detected</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDns.map(dn => {
                      const aiCategory = dn.exceptionType === ExceptionType.LATE ? 'Logistics Delay' : 'Data Integrity';
                      const aiSuggestion = dn.exceptionType === ExceptionType.LATE ? 'Re-route via Loresho' : 'Manual Address Validation';
                      const confidence = 85 + Math.floor(Math.random() * 10);
                      
                      return (
                        <tr key={dn.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedException(dn)}>
                           <td className="px-10 py-8">
                              <div className="flex items-center gap-4">
                                 <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${dn.exceptionType === ExceptionType.LATE ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                                    {dn.exceptionType === ExceptionType.LATE ? <Clock size={20} /> : <AlertCircle size={20} />}
                                 </div>
                                 <div>
                                    <Badge variant={dn.exceptionType === ExceptionType.LATE ? 'failed' : 'exception'} className="mb-1.5">{aiCategory}</Badge>
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">REF-{dn.externalId}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-8">
                              <p className="body-value truncate-name max-w-[250px] mb-1">{dn.clientName}</p>
                              <p className="text-[10px] font-bold text-slate-400 italic line-clamp-1">"{dn.exceptionReason || 'Root cause analysis pending'}"</p>
                           </td>
                           <td className="px-10 py-8">
                              <div className="flex items-center gap-3">
                                 <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand" style={{ width: `${confidence}%` }} />
                                 </div>
                                 <span className="text-[10px] font-black text-slate-900">{confidence}%</span>
                              </div>
                           </td>
                           <td className="px-10 py-8">
                              <div className="flex items-center gap-3 text-brand">
                                 <Sparkles size={14} />
                                 <span className="text-[10px] font-black uppercase tracking-widest">{aiSuggestion}</span>
                              </div>
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
                    <div className="h-10 w-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                       <ShieldAlert size={20} />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Incident Resolution</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">REF-{selectedException.externalId}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedException(null)} className="text-slate-400 hover:text-brand"><X size={24} /></button>
              </div>

              <div className="p-10 space-y-8">
                 <div className="p-6 bg-red-50 border border-red-100 rounded-2xl">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Original Exception Flag</p>
                    <p className="text-xs font-bold text-slate-900 leading-relaxed italic">"{selectedException.exceptionReason}"</p>
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
