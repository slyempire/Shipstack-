
import React from 'react';
import { 
  Stethoscope, 
  ShieldCheck, 
  Thermometer, 
  Package, 
  FileText, 
  Activity
} from 'lucide-react';
import { Badge } from '../../packages/ui/Badge';

export const HealthcareIntelligence: React.FC<{ data: any }> = ({ data }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-4">
         <div className="h-12 w-12 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
           <Stethoscope size={24} />
         </div>
         <div>
           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Medical Logistics Control</h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-blue-600">KEMSA & Pharmacy Integrity</p>
         </div>
       </div>
       <div className="flex items-center gap-3">
         <Badge variant="delivered" className="bg-blue-50 text-blue-600 border-blue-100">HIPAA Compliant</Badge>
         <Badge variant="delivered" className="bg-emerald-50 text-emerald-600 border-emerald-100">KEMSA API: CONNECTED</Badge>
       </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
             <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><ShieldCheck size={20} /></div>
             <span className="text-[10px] font-black text-blue-600">SECURE</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chain of Custody</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">100%</span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">VERIFIED</span>
          </div>
       </div>

       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
             <div className="h-10 w-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center"><Thermometer size={20} /></div>
             <span className="text-[10px] font-black text-red-600">COLD CHAIN</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Monitoring</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">42</span>
            <span className="text-[10px] font-bold text-slate-400">ACTIVE TRIPS</span>
          </div>
       </div>

       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md text-slate-900">
          <div className="flex items-center justify-between mb-4">
             <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><Package size={20} /></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KEMSA SYNC</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Supplies Synced</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">1,240</span>
            <span className="text-[10px] font-bold text-emerald-500 font-mono">OK</span>
          </div>
       </div>

       <div className="bg-blue-600 p-6 rounded-2xl shadow-xl flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-blue-200" />
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Compliance Engine</p>
            </div>
            <h4 className="text-sm font-black uppercase tracking-tight">Reg. Reporting</h4>
          </div>
          <div className="mt-4">
            <button className="w-full py-2 bg-white text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
               <FileText size={12} /> Sync Reports
            </button>
          </div>
       </div>
    </div>

    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-blue-50/30">
             <div className="flex items-center gap-3">
               <Activity className="text-blue-600" size={20} />
               <h4 className="text-sm font-black uppercase tracking-tight">Controlled Substances Chain of Custody</h4>
             </div>
             <Badge variant="failed" className="bg-red-50 text-red-600 border-red-100 uppercase tracking-widest text-[9px] animate-pulse">High Risk Alerts: 0</Badge>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medication / Batch</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Custodian</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Temperature</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Handover</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Verification</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {data?.medicalBatches?.map((batch: any, i: number) => (
                     <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                           <p className="text-sm font-black text-slate-900 uppercase leading-none mb-1">{batch.name}</p>
                           <p className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-tighter">BATCH-ID: {batch.id}</p>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-xs font-black">{batch.custodian.charAt(0)}</div>
                              <p className="text-xs font-black text-slate-600 uppercase tracking-tight">{batch.custodian}</p>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                             <Thermometer size={14} className={batch.temp > 8 ? 'text-red-500' : 'text-emerald-500'} />
                             <span className={`text-xs font-black ${batch.temp > 8 ? 'text-red-500' : 'text-slate-900'}`}>{batch.temp}°C</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{batch.nextHandover}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <Badge variant="delivered" className="bg-blue-50 text-blue-600 border-none px-3">Protocol Verified</Badge>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
  </div>
);
