
import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { OperationalMetrics, AnalyticsReport, DeliveryNote } from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Activity, Zap, ShieldAlert, CheckCircle, FileText, Download, TrendingUp, ChevronRight, X, Filter, Search } from 'lucide-react';
import { Badge } from '../../packages/ui/Badge';

const Analytics: React.FC = () => {
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [zoneMetrics, setZoneMetrics] = useState<{ name: string, count: number, id: string }[]>([]);
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [drillDown, setDrillDown] = useState<{ type: 'DAY' | 'ZONE' | 'METRIC', value: string, data: DeliveryNote[] } | null>(null);
  const [allDns, setAllDns] = useState<DeliveryNote[]>([]);

  useEffect(() => {
    Promise.all([
      api.getOperationalMetrics(),
      api.getZoneMetrics(),
      api.getAnalyticsReports(),
      api.getDeliveryNotes()
    ]).then(([m, zm, r, dns]) => {
      setMetrics(m);
      setZoneMetrics(zm as any);
      setReports(r);
      setAllDns(dns);
      setLoading(false);
    });
  }, []);

  const dailyData = [
    { name: 'Mon', completed: 45, exceptions: 2, date: '2026-03-09' },
    { name: 'Tue', completed: 52, exceptions: 1, date: '2026-03-10' },
    { name: 'Wed', completed: 48, exceptions: 4, date: '2026-03-11' },
    { name: 'Thu', completed: 61, exceptions: 0, date: '2026-03-12' },
    { name: 'Fri', completed: 55, exceptions: 2, date: '2026-03-13' },
  ];

  const handleDayClick = (data: any) => {
    if (!data || !data.activePayload) return;
    const day = data.activePayload[0].payload;
    // In a real app, we'd filter by date. For demo, we'll just show some data.
    setDrillDown({
      type: 'DAY',
      value: day.name,
      data: allDns.slice(0, 5)
    });
  };

  const handleZoneClick = (data: any) => {
    if (!data || !data.activePayload) return;
    const zone = data.activePayload[0].payload;
    const filtered = allDns.filter(dn => dn.zoneId === zone.id);
    setDrillDown({
      type: 'ZONE',
      value: zone.name,
      data: filtered
    });
  };

  if (loading || !metrics) return <Layout title="System Metrics">Loading...</Layout>;

  return (
    <Layout title="Operational Intelligence">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricTile icon={Zap} label="Dispatch Velocity" value={`${metrics.dispatchTimeAvg}m`} color="text-blue-600" />
        <MetricTile icon={CheckCircle} label="Fulfillment Rate" value={`${metrics.completionRate}%`} color="text-green-600" />
        <MetricTile icon={ShieldAlert} label="Anomaly Rate" value={`${metrics.exceptionRate}%`} color="text-amber-600" />
        <MetricTile icon={Activity} label="Telemetry Lag" value={`${metrics.telemetryLag}s`} color="text-cyan-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-neutral-border dark:border-slate-800 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-muted dark:text-slate-400">Delivery Volume vs Exceptions</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Click to drill down</p>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={dailyData} onClick={handleDayClick}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} fontWeight="bold" />
                    <YAxis fontSize={10} fontWeight="bold" />
                    <Tooltip />
                    <Area type="monotone" dataKey="completed" stroke="#0F2A44" fill="#0F2A44" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="exceptions" stroke="#DC2626" fill="#DC2626" fillOpacity={0.1} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-neutral-border dark:border-slate-800 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-muted dark:text-slate-400">Dispatch Efficiency (Weekly)</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Click to drill down</p>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={dailyData} onClick={handleDayClick}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} fontWeight="bold" />
                    <YAxis fontSize={10} fontWeight="bold" />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#0F2A44" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-neutral-border dark:border-slate-800 shadow-sm lg:col-span-2">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-muted dark:text-slate-400">Volume by Delivery Zone</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Click to drill down</p>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={zoneMetrics} onClick={handleZoneClick}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} fontWeight="bold" />
                    <YAxis fontSize={10} fontWeight="bold" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Reports Section */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intelligence Reports</h3>
            <button 
              onClick={() => setIsDashboardOpen(true)}
              className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2"
            >
              <TrendingUp size={14} /> View BI Dashboard
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map(report => (
              <div 
                key={report.id} 
                onClick={() => alert(`Downloading ${report.title}...`)}
                className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:border-brand transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-brand shadow-sm transition-all">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{report.title}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Generated: {new Date(report.generatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="p-2 text-slate-300 dark:text-slate-600 hover:text-brand transition-all">
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isDashboardOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white">Business Intelligence</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Performance Dashboard</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDashboardOpen(false)}
                className="h-10 w-10 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-brand transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 dark:bg-slate-900/50 space-y-8">
               <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Revenue Growth</p>
                     <p className="text-2xl font-black text-slate-900 dark:text-white">+24.5%</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">OpEx Efficiency</p>
                     <p className="text-2xl font-black text-slate-900 dark:text-white">92.1%</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Customer Satisfaction</p>
                     <p className="text-2xl font-black text-slate-900 dark:text-white">4.8/5</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Performance Distribution</h4>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0'} />
                          <XAxis dataKey="name" fontSize={10} fontWeight="bold" stroke={document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b'} />
                          <YAxis fontSize={10} fontWeight="bold" stroke={document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b'} />
                          <Tooltip contentStyle={{ backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#fff', borderColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0' }} />
                          <Bar dataKey="completed" fill="#0F2A44" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="exceptions" fill="#DC2626" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Asset Utilization</h4>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Active', value: 75 },
                              { name: 'Maintenance', value: 15 },
                              { name: 'Idle', value: 10 },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#0F2A44" />
                            <Cell fill="#F59E0B" />
                            <Cell fill={document.documentElement.classList.contains('dark') ? '#334155' : '#E2E8F0'} />
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#fff', borderColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Granular Operational Log</h4>
                    <div className="flex gap-2">
                       <button className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400"><Filter size={14} /></button>
                       <button className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400"><Search size={14} /></button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-50 dark:border-slate-700">
                          <th className="text-left py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                          <th className="text-left py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                          <th className="text-left py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Zone</th>
                          <th className="text-left py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="text-right py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                        {allDns.map(dn => (
                          <tr key={dn.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all">
                            <td className="py-4 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{dn.externalId}</td>
                            <td className="py-4 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{dn.clientName}</td>
                            <td className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dn.zoneId}</td>
                            <td className="py-4">
                              <Badge variant={dn.status.toLowerCase() as any}>{dn.status}</Badge>
                            </td>
                            <td className="py-4 text-right">
                              <span className={`text-[9px] font-black uppercase tracking-widest ${dn.priority === 'HIGH' ? 'text-red-500' : 'text-slate-400'}`}>{dn.priority}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
            
            <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
               <button 
                 onClick={() => setIsDashboardOpen(false)}
                 className="px-8 py-4 bg-slate-900 dark:bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 dark:hover:bg-brand-accent transition-all"
               >
                 Close Dashboard
               </button>
            </div>
          </div>
        </div>
      )}

      {drillDown && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white">Drill Down: {drillDown.value}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Granular data for {drillDown.type.toLowerCase()}</p>
                 </div>
                 <button 
                   onClick={() => setDrillDown(null)}
                   className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-brand transition-all"
                 >
                   <X size={20} />
                 </button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
                 {drillDown.data.map(dn => (
                   <div key={dn.id} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:border-brand transition-all">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-brand shadow-sm transition-all">
                            <Activity size={18} />
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{dn.clientName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{dn.externalId} • {dn.address}</p>
                         </div>
                      </div>
                      <Badge variant={dn.status.toLowerCase() as any}>{dn.status}</Badge>
                   </div>
                 ))}
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                 <button 
                   onClick={() => setDrillDown(null)}
                   className="px-8 py-4 bg-slate-900 dark:bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl"
                 >
                   Done
                 </button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

const MetricTile = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-neutral-border dark:border-slate-800 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${color}`}><Icon size={24} /></div>
    <div>
      <p className="text-[10px] font-black text-neutral-muted dark:text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-neutral-primary dark:text-white">{value}</p>
    </div>
  </div>
);

export default Analytics;
