
import React from 'react';
import { 
  ShoppingCart, 
  Store,
  RefreshCw,
  Box,
  Truck
} from 'lucide-react';
import { Badge } from '../../packages/ui/Badge';

export const RetailIntelligence: React.FC<{ data: any }> = ({ data }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-4">
         <div className="h-12 w-12 bg-amber-600/10 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
           <Store size={24} />
         </div>
         <div>
           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Retail Replenishment Network</h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-amber-600">Omnichannel & Store Operations</p>
         </div>
       </div>
       <Badge variant="delivered" className="bg-amber-50 text-amber-600 border-amber-100 uppercase tracking-widest text-[9px]">Hyper-local Active</Badge>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
             <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Box size={20} /></div>
             <span className="text-[10px] font-black text-amber-600">88%</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Store Replenishment</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">14</span>
            <span className="text-[10px] font-bold text-slate-400">STORES PENDING</span>
          </div>
       </div>

       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
             <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Truck size={20} /></div>
             <span className="text-[10px] font-black text-blue-600">LIVE</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last-Mile Boda Fleet</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">54</span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">ON-DUTY</span>
          </div>
       </div>

       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md text-slate-900">
          <div className="flex items-center justify-between mb-4">
             <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><ShoppingCart size={20} /></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ECOMM SYNC</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cross-Channel Orders</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">242</span>
            <span className="text-[10px] font-bold text-emerald-500 font-mono">OK</span>
          </div>
       </div>

       <div className="bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw size={16} className="text-amber-400" />
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Inventory Engine</p>
            </div>
            <h4 className="text-sm font-black uppercase tracking-tight">Stock Rebalancing</h4>
          </div>
          <div className="mt-4">
            <button className="w-full py-2 bg-amber-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
               Optimize Transfers
            </button>
          </div>
       </div>
    </div>
  </div>
);
