
import React from 'react';
import { 
  ShoppingCart, 
  RefreshCw, 
  ExternalLink,
  Zap
} from 'lucide-react';
import { Badge } from '../../packages/ui/Badge';

export const EcommerceIntelligence: React.FC<{ data: any }> = ({ data }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-4">
         <div className="h-12 w-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
           <ShoppingCart size={24} />
         </div>
         <div>
           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Direct-to-Consumer Engine</h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-brand">Marketplace & Returns Hub</p>
         </div>
       </div>
       <div className="flex items-center gap-2">
          <Badge variant="delivered" className="bg-blue-50 text-blue-600 border-none flex items-center gap-2">
             <RefreshCw size={12} className="animate-spin" /> Jumia Synced
          </Badge>
          <Badge variant="delivered" className="bg-amber-50 text-amber-600 border-none flex items-center gap-2">
             <RefreshCw size={12} className="animate-spin" /> Kilimall Synced
          </Badge>
       </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
       <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <RefreshCw size={64} className="text-brand" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Return Requests</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900">12</span>
            <span className="text-[10px] font-bold text-brand uppercase">Processing</span>
          </div>
          <button className="mt-6 w-full py-3 bg-brand/5 text-brand rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all">
             Automate All Returns
          </button>
       </div>

       <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Marketplace Orders</p>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-black text-slate-900">{data?.marketplaces?.reduce((acc: number, curr: any) => acc + curr.orders, 0) || 242}</span>
            <span className="text-[10px] font-bold text-slate-400">TODAY</span>
          </div>
          <div className="space-y-3">
             {data?.marketplaces?.map((m: any, i: number) => (
               <div key={i} className="flex items-center justify-between text-[10px] font-medium">
                  <span className="text-slate-400 uppercase">{m.name}</span>
                  <span className="font-black text-slate-900">{m.orders}</span>
               </div>
             ))}
          </div>
       </div>

       <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink size={16} className="text-brand" />
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Merchant Tools</p>
            </div>
            <h4 className="text-lg font-black uppercase tracking-tight">Tracking Widget</h4>
          </div>
          <div className="mt-4">
            <button 
              onClick={() => {
                const code = `<!-- Shipstack Tracking Widget -->\n<script src="https://shipstack.africa/v1/widget.js" async></script>\n<shipstack-track tenant-id="${window.location.host.split('.')[0]}"></shipstack-track>`;
                navigator.clipboard.writeText(code);
                alert('Embed code copied to clipboard!');
              }}
              className="w-full py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-95 transition-all"
            >
               Copy Embed Code
            </button>
          </div>
       </div>

       <div className="bg-brand p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap size={100} fill="white" />
          </div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">AI Delivery Estimator</p>
          <h4 className="text-2xl font-black uppercase tracking-tight mb-2">Active</h4>
          <p className="text-[10px] font-bold text-white/60 uppercase leading-relaxed">Reducing "where is my order" support calls by 42%.</p>
       </div>
    </div>

    <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw size={16} className="text-emerald-600" />
              <p className="text-[10px] font-black text-emerald-600/40 uppercase tracking-widest">Efficiency</p>
            </div>
            <h4 className="text-lg font-black uppercase tracking-tight text-emerald-900">Returns Automation</h4>
          </div>
          <div className="mt-4">
             <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                <span className="text-emerald-900/40">Auto-Approval</span>
                <span className="text-emerald-600">88%</span>
             </div>
             <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[88%] rounded-full" />
             </div>
             <p className="mt-3 text-[9px] font-bold text-emerald-900/60 uppercase tracking-tight italic">AI resolving restocking logs instantly.</p>
          </div>
       </div>
  </div>
);
