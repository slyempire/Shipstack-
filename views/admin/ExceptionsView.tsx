
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
  Flag
} from 'lucide-react';

const ExceptionsView: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useAppStore();
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ExceptionStatus | 'ALL'>(ExceptionStatus.OPEN);
  const [selectedException, setSelectedException] = useState<DeliveryNote | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group transition-all hover:border-brand-accent">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Alerts</p>
              <h3 className="text-3xl font-black text-slate-900">{dns.filter(d => d.exceptionStatus === ExceptionStatus.OPEN).length}</h3>
           </div>
           <div className="p-3 bg-red-50 text-red-500 rounded-xl group-hover:scale-110 transition-transform"><AlertTriangle size={20} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
           <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Mission Critical</p>
           <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black text-slate-900">{dns.filter(d => d.exceptionType === ExceptionType.LATE).length}</h3>
              <div className="p-3 bg-red-50 text-red-600 rounded-xl"><Clock size={20} /></div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Investigating</p>
           <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black text-slate-900">{dns.filter(d => d.exceptionStatus === ExceptionStatus.IN_PROGRESS).length}</h3>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Activity size={20} /></div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Resolved MTD</p>
           <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black text-slate-900">{dns.filter(d => d.exceptionStatus === ExceptionStatus.RESOLVED).length}</h3>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={20} /></div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
         <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
            <div className="flex items-center gap-2 p-1 bg-slate-200/50 rounded-xl">
               {[
                 { id: ExceptionStatus.OPEN, label: 'Open' },
                 { id: ExceptionStatus.IN_PROGRESS, label: 'Audit' },
                 { id: ExceptionStatus.RESOLVED, label: 'Archive' },
                 { id: 'ALL', label: 'History' }
               ].map(tab => (
                 <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-brand'}`}
                 >
                   {tab.label}
                 </button>
               ))}
            </div>
            <div className="relative w-full md:w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
               <input 
                 type="text"
                 placeholder="Filter incidents..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
               />
            </div>
         </div>

         <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Incident Root</th>
                     <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Entity Info</th>
                     <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Type / Impact</th>
                     <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol status</th>
                     <th className="px-8 py-4 text-right"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={5} className="p-20 text-center animate-pulse text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">Synchronizing Logs...</td></tr>
                  ) : filteredDns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center">
                         <ShieldAlert className="mx-auto text-slate-200 mb-4" size={48} />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No exceptions found in this context</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDns.map(dn => (
                      <tr key={dn.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedException(dn)}>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${dn.exceptionType === ExceptionType.LATE ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                                  {dn.exceptionType === ExceptionType.LATE ? <Clock size={20} /> : <AlertCircle size={20} />}
                               </div>
                               <div>
                                  <span className="font-mono text-[11px] font-black text-brand">REF-{dn.externalId}</span>
                                  <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Audit Trail Active</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <p className="text-sm font-black text-slate-900 leading-tight mb-1 truncate max-w-[200px]">{dn.clientName}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px] font-bold uppercase">{dn.address}</p>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex flex-col gap-1.5">
                               <Badge variant={dn.exceptionType === ExceptionType.LATE ? 'failed' : 'exception'} className="w-fit">{dn.exceptionType}</Badge>
                               <span className="text-[10px] font-bold text-slate-900 line-clamp-1">{dn.exceptionReason || 'Root cause analysis pending'}</span>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <Badge variant={dn.exceptionStatus === ExceptionStatus.RESOLVED ? 'delivered' : (dn.exceptionStatus === ExceptionStatus.OPEN ? 'failed' : 'exception')}>
                               {dn.exceptionStatus}
                            </Badge>
                         </td>
                         <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                               <button 
                                onClick={(e) => { e.stopPropagation(); handleEscalate(dn); }}
                                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-500 transition-all shadow-sm"
                                title="Escalate Protocol"
                               >
                                  <Flag size={16} />
                               </button>
                               <div className="h-10 w-px bg-slate-100 mx-1" />
                               <button className="p-2.5 bg-brand text-white rounded-xl shadow-lg transition-all active:scale-95">
                                  <ChevronRight size={16} />
                                </button>
                            </div>
                         </td>
                      </tr>
                    ))
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
