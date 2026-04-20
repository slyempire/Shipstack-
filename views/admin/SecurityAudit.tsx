
import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useAuditStore } from '../../store';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  Activity,
  Calendar,
  User,
  ExternalLink,
  Lock,
  RefreshCw,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import RoleGuard from '../../components/RoleGuard';

const SecurityAudit: React.FC = () => {
  const { auditLog } = useAuditStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'info' | 'warning' | 'critical'>('ALL');

  const filteredLogs = auditLog.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 text-red-600 border-red-100';
      case 'warning': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ShieldAlert size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      default: return <Info size={14} />;
    }
  };

  return (
    <RoleGuard permissions={['security:view']} showFullPageError>
      <Layout 
        title="Security Audit Terminal" 
        subtitle="Unalterable operational ledger & access logs"
      >
        <div className="space-y-8 pb-20">
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
               { label: 'Total Logs', value: auditLog.length, icon: Activity, color: 'text-slate-900' },
               { label: 'Critical Errors', value: auditLog.filter(l => l.severity === 'critical').length, icon: ShieldAlert, color: 'text-red-600' },
               { label: 'Security Breaches', value: 0, icon: Lock, color: 'text-emerald-600' },
               { label: 'Active Sessions', value: 12, icon: User, color: 'text-blue-600' }
             ].map((stat, i) => (
               <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                     <p className={`text-2xl font-black ${stat.color} leading-none`}>{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center ${stat.color}`}>
                     <stat.icon size={20} />
                  </div>
               </div>
             ))}
          </div>

          {/* Filtering Header */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-6">
             <div className="relative flex-1 w-full">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Query action, resource, or operator email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl border border-transparent focus:border-brand/20 outline-none text-sm font-medium transition-all"
                />
             </div>
             <div className="flex items-center gap-2">
                {['ALL', 'info', 'warning', 'critical'].map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev as any)}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black capitalize transition-all ${severityFilter === sev ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
                  >
                    {sev}
                  </button>
                ))}
             </div>
             <button className="hidden lg:flex items-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
                <Download size={16} /> Export CSV
             </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
             <table className="w-full border-collapse text-left">
                <thead>
                   <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredLogs.map((log) => (
                      <motion.tr 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={log.id} 
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                         <td className="px-8 py-5 whitespace-nowrap">
                            <div className="flex flex-col">
                               <p className="text-xs font-bold text-slate-900">{format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}</p>
                               <span className="text-[10px] font-medium text-slate-400 uppercase">{format(new Date(log.timestamp), 'yyyy')}</span>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight bg-slate-100 px-3 py-1 rounded-lg">
                               {log.action.replace(/_/g, ' ')}
                            </span>
                         </td>
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                               <p className="text-xs font-bold text-slate-700">{log.resource}</p>
                               <span className="text-[9px] font-medium text-slate-400">#{log.resourceId?.slice(-6)}</span>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                               <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                                  <img src={`https://i.pravatar.cc/150?u=${log.userEmail}`} className="h-full w-full grayscale" />
                               </div>
                               <p className="text-[11px] font-bold text-slate-600">{log.userEmail}</p>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getSeverityStyles(log.severity)}`}>
                               {getSeverityIcon(log.severity)}
                               {log.severity}
                            </div>
                         </td>
                         <td className="px-8 py-5 text-right">
                            <button className="h-10 w-10 text-slate-400 hover:text-brand bg-transparent hover:bg-brand/10 rounded-xl transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                               <ExternalLink size={16} />
                            </button>
                         </td>
                      </motion.tr>
                   ))}
                   {filteredLogs.length === 0 && (
                      <tr>
                         <td colSpan={6} className="py-20 text-center">
                            <div className="flex flex-col items-center">
                               <History size={40} className="text-slate-200 mb-4" />
                               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching security logs found</p>
                            </div>
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>

          {/* Verification Banner */}
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
             <ShieldCheck size={180} className="absolute -right-10 -bottom-10 opacity-5" />
             <div className="space-y-2 relative z-10">
                <h4 className="text-xl font-black uppercase tracking-tighter leading-none">Immutable History Active</h4>
                <p className="text-[11px] font-medium text-white/50 max-w-lg leading-relaxed uppercase tracking-widest">
                  This ledger uses internal hash-chaining to ensure log integrity. Any attempt to modify audit records will trigger a critical infrastructure alarm.
                </p>
             </div>
             <button className="px-10 py-5 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 transform active:scale-95 transition-all">
                <RefreshCw size={16} /> Run Integrity Scan
             </button>
          </div>
        </div>
      </Layout>
    </RoleGuard>
  );
};

export default SecurityAudit;
