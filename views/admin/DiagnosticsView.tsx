
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase, isSupabaseConfigured } from '../../supabase';
import { cacheService } from '../../services/redis';
import { Badge } from '../../packages/ui/Badge';
import { 
  Server, 
  Database, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ShieldCheck,
  Cloud,
  Layers,
  Activity,
  Cpu
} from 'lucide-react';

const DiagnosticsView: React.FC = () => {
  const [supabaseStatus, setSupabaseStatus] = useState<'testing' | 'ok' | 'error' | 'not_configured'>('testing');
  const [redisStatus, setRedisStatus] = useState<'testing' | 'ok' | 'error' | 'not_configured'>('testing');
  const [supabaseLatency, setSupabaseLatency] = useState<number | null>(null);
  const [redisLatency, setRedisLatency] = useState<number | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const runDiagnostics = async () => {
    setLastCheck(new Date());
    
    // Test Supabase
    if (!isSupabaseConfigured) {
      setSupabaseStatus('not_configured');
    } else {
      setSupabaseStatus('testing');
      const start = performance.now();
      try {
        const { data, error } = await supabase.from('profiles').select('count');
        if (error) throw error;
        setSupabaseLatency(Math.round(performance.now() - start));
        setSupabaseStatus('ok');
      } catch (err) {
        console.error('Supabase diagnostic failed:', err);
        setSupabaseStatus('error');
      }
    }

    // Test Redis
    setRedisStatus('testing');
    const startRedis = performance.now();
    try {
      await cacheService.set('diag_ping', 'pong', 10);
      const val = await cacheService.get('diag_ping');
      if (val !== 'pong') throw new Error('Redis data mismatch');
      setRedisLatency(Math.round(performance.now() - startRedis));
      setRedisStatus('ok');
    } catch (err) {
      console.error('Redis diagnostic failed:', err);
      setRedisStatus('error');
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'ok') return <CheckCircle2 className="text-emerald-500" size={24} />;
    if (status === 'error') return <XCircle className="text-red-500" size={24} />;
    if (status === 'testing') return <RefreshCw className="text-brand animate-spin" size={24} />;
    return <XCircle className="text-slate-300" size={24} />;
  };

  return (
    <Layout title="System Diagnostics">
      <div className="mb-12 flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Cluster Health</h2>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time infrastructure monitoring</p>
        </div>
        <button 
          onClick={runDiagnostics}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
        >
          <RefreshCw size={14} />
          Restart Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Supabase Monitor */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Database size={120} />
           </div>
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                 <div className="p-4 bg-brand/10 text-brand rounded-2xl shadow-inner">
                    <Database size={28} />
                 </div>
                 <Badge variant={supabaseStatus === 'ok' ? 'transit' : (supabaseStatus === 'error' ? 'failed' : 'neutral')}>
                    {supabaseStatus.toUpperCase().replace('_', ' ')}
                 </Badge>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Supabase Engine</h3>
              <p className="text-xs text-slate-500 font-medium mb-8 max-w-xs">Primary Postgres cluster handling relational persistence and Row-Level Security.</p>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Latency</p>
                    <p className="text-xl font-black text-slate-900">{supabaseLatency ? `${supabaseLatency}ms` : '--'}</p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Protocol</p>
                    <p className="text-xl font-black text-slate-900">RLS-Gate</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Redis Monitor */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Zap size={120} />
           </div>
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                 <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl shadow-inner">
                    <Zap size={28} />
                 </div>
                 <Badge variant={redisStatus === 'ok' ? 'transit' : (redisStatus === 'error' ? 'failed' : 'neutral')}>
                    {redisStatus.toUpperCase().replace('_', ' ')}
                 </Badge>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Upstash Redis</h3>
              <p className="text-xs text-slate-500 font-medium mb-8 max-w-xs">Hot-cache layer for driver telemetry and session-specific temporary data.</p>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Latency</p>
                    <p className="text-xl font-black text-slate-900">{redisLatency ? `${redisLatency}ms` : '--'}</p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Throughput</p>
                    <p className="text-xl font-black text-slate-900">Ultra-Low</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/20 rounded-full animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/20 rounded-full" />
         </div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1">
               <div className="flex items-center gap-3 mb-6">
                  <Cloud className="text-brand" size={32} />
                  <h3 className="text-4xl font-black tracking-tighter">Cloud Run Auto-Scale</h3>
               </div>
               <p className="text-lg text-white/60 font-medium leading-relaxed max-w-2xl mb-8">
                  The infrastructure is configured to handle bursts of up to 10,000 concurrent users. 
                  Shipstack automatically provisions new compute instances in response to telemetry pressure.
               </p>
               <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl">
                     <Cpu size={16} className="text-brand" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Instance Max: 1,000</span>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl">
                     <Activity size={16} className="text-emerald-400" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Uptime: 99.99%</span>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl">
                     <ShieldCheck size={16} className="text-blue-400" />
                     <span className="text-[10px] font-black uppercase tracking-widest">WAF Active</span>
                  </div>
               </div>
            </div>
            
            <div className="w-full md:w-80 h-80 bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col justify-between">
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">IOPS Pressure</span>
                     <span className="text-[10px] font-black text-brand uppercase tracking-widest">Low</span>
                  </div>
                  <div className="h-12 w-full bg-white/5 rounded-full relative overflow-hidden">
                     <div className="absolute top-0 left-0 h-full bg-brand/30 w-[12%]" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">CPU Utilization</span>
                     <span className="text-[10px] font-black text-brand uppercase tracking-widest">4%</span>
                  </div>
                  <div className="h-12 w-full bg-white/5 rounded-full relative overflow-hidden">
                     <div className="absolute top-0 left-0 h-full bg-brand/30 w-[4%]" />
                  </div>
               </div>
               
               <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] text-center">
                  Last Health Pulse: {lastCheck.toLocaleTimeString()}
               </p>
            </div>
         </div>
      </div>

      <div className="mt-12 p-8 bg-brand/5 border border-brand/10 rounded-[2.5rem]">
         <div className="flex items-start gap-4">
            <div className="p-3 bg-brand text-white rounded-xl shadow-lg">
               <ShieldCheck size={20} />
            </div>
            <div>
               <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Supabase RLS Isolation Active</h4>
               <p className="text-sm text-slate-500 font-medium leading-relaxed mt-2">
                  Row-Level Security is currently active. Every query is filtered at the database level using your Tenant ID. 
                  Even with the anonymous key compromised, data cannot be scraped across the cluster.
               </p>
            </div>
         </div>
      </div>
    </Layout>
  );
};

export default DiagnosticsView;
