
import React from 'react';
import { 
  Sprout, 
  Thermometer, 
  Droplets, 
  TrendingUp, 
  Calendar, 
  ArrowRight,
  Package,
  Activity,
  BrainCircuit
} from 'lucide-react';
import { Badge } from '../../packages/ui/Badge';

export const AgricultureIntelligence: React.FC<{ data: any }> = ({ data }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-4">
         <div className="h-12 w-12 bg-emerald-600/10 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
           <Sprout size={24} />
         </div>
         <div>
           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Agricultural Intelligence</h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-emerald-600">Freshness Integrity System</p>
         </div>
       </div>
       <Badge variant="delivered" className="bg-emerald-50 text-emerald-600 border-emerald-100">Live Sensors: On</Badge>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group hover:border-emerald-600 transition-all">
          <div className="flex items-center justify-between mb-4">
             <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Thermometer size={20} /></div>
             <span className="text-[10px] font-black text-emerald-600">AVERAGE</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cold Chain Temp</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">3.8°C</span>
            <span className="text-[10px] font-bold text-emerald-500 font-mono">STABLE</span>
          </div>
       </div>
       
       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group hover:border-emerald-600 transition-all">
          <div className="flex items-center justify-between mb-4">
             <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Droplets size={20} /></div>
             <span className="text-[10px] font-black text-blue-600">OPTIMAL</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Humidity Control</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">85%</span>
            <span className="text-[10px] font-bold text-blue-500 font-mono">RH</span>
          </div>
       </div>

       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group hover:border-emerald-600 transition-all">
          <div className="flex items-center justify-between mb-4">
             <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><TrendingUp size={20} /></div>
             <span className="text-[10px] font-black text-orange-600">TEA / COFFEE</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Commodity Price Index</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">+4.2%</span>
            <span className="text-[10px] font-bold text-slate-400">WEEKLY</span>
          </div>
       </div>

       <div className="bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit size={16} className="text-emerald-400" />
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Cortex Prediction</p>
            </div>
            <h4 className="text-sm font-black uppercase tracking-tight">Produce Quality</h4>
          </div>
          <div className="mt-4">
            <Badge variant="delivered" className="bg-emerald-500 text-white border-none py-1">98.2% Freshness Likely</Badge>
          </div>
       </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-emerald-50/30">
             <div className="flex items-center gap-3">
               <Calendar className="text-emerald-600" size={20} />
               <h4 className="text-sm font-black uppercase tracking-tight">Seasonal Harvest Logistics</h4>
             </div>
             <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline flex items-center gap-2">
               Planner View <ArrowRight size={14} />
             </button>
          </div>
          <div className="p-8 space-y-4">
             {data?.harvestPlan?.map((plan: any, i: number) => (
               <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all group">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                       <Package size={20} />
                     </div>
                     <div>
                       <p className="text-xs font-black text-slate-900 uppercase">{plan.produce}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{plan.region} • {plan.peakDate}</p>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">{plan.volume} Tons</p>
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{plan.status}</p>
                  </div>
               </div>
             ))}
          </div>
       </div>

       <div className="bg-slate-900 rounded-[2rem] shadow-xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-3 text-white">
               <Activity className="text-red-500" size={20} />
               <h4 className="text-sm font-black uppercase tracking-tight">Live Cold Chain Integrity</h4>
             </div>
             <div className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Guard</span>
             </div>
          </div>
          <div className="p-8 space-y-4">
             {data?.sensorAlerts?.map((alert: any, i: number) => (
               <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-4">
                     <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${alert.type === 'WARNING' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                       <Thermometer size={18} />
                     </div>
                     <div>
                       <p className="text-xs font-black text-white uppercase">{alert.tripId}</p>
                       <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{alert.location}</p>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-white">{alert.temp}°C</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${alert.type === 'WARNING' ? 'text-amber-500' : 'text-emerald-500'}`}>{alert.status}</p>
                  </div>
               </div>
             ))}
             <button className="w-full py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/40 active:scale-95 transition-all mt-4">
                Generate Cold Chain Compliance Report
             </button>
          </div>
       </div>
    </div>
  </div>
);
