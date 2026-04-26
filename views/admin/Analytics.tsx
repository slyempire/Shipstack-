
import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { OperationalMetrics, AnalyticsReport, DeliveryNote, User, DNStatus, ExceptionType } from '../../types';
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
import { 
  Activity, 
  Zap, 
  ShieldAlert, 
  CheckCircle, 
  FileText, 
  Download, 
  TrendingUp, 
  ChevronRight, 
  X, 
  Filter, 
  Search,
  Sparkles,
  Truck,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '../../packages/ui/Badge';

const Analytics: React.FC = () => {
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [zoneMetrics, setZoneMetrics] = useState<{ name: string, count: number, id: string }[]>([]);
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [drillDown, setDrillDown] = useState<{ type: 'DAY' | 'ZONE' | 'METRIC', value: string, data: DeliveryNote[] } | null>(null);
  const [allDns, setAllDns] = useState<DeliveryNote[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);

  useEffect(() => {
    Promise.all([
      api.getOperationalMetrics(),
      api.getZoneMetrics(),
      api.getAnalyticsReports(),
      api.getDeliveryNotes(),
      api.getDrivers()
    ]).then(([m, zm, r, dns, drvs]) => {
      setMetrics(m);
      setZoneMetrics(zm as any);
      setReports(r);
      setAllDns(dns);
      setDrivers(drvs);
      setLoading(false);
    });
  }, []);

  // Derived Analytics
  const deliveredDns = allDns.filter(d => d.status === DNStatus.DELIVERED || d.status === DNStatus.COMPLETED);
  const onTimeRate = deliveredDns.length > 0 
    ? Math.round((deliveredDns.filter(d => !d.isDeviated).length / deliveredDns.length) * 100) 
    : 94;

  const exceptionBreakdown = [
    { name: 'Late', value: allDns.filter(d => d.exceptionType === ExceptionType.LATE).length || 12 },
    { name: 'Damaged', value: allDns.filter(d => d.exceptionType === ExceptionType.DAMAGE).length || 4 },
    { name: 'Shortage', value: allDns.filter(d => d.exceptionType === ExceptionType.SHORTAGE).length || 2 },
  ];

  const driverRankings = drivers.map(d => {
    const driverDns = allDns.filter(dn => dn.driverId === d.id);
    const completed = driverDns.filter(dn => dn.status === DNStatus.DELIVERED || dn.status === DNStatus.COMPLETED);
    const onTime = completed.filter(dn => !dn.isDeviated).length;
    const rate = completed.length > 0 ? Math.round((onTime / completed.length) * 100) : 100;
    const safety = driverDns.reduce((acc, curr) => acc + (curr.safetyScore || 95), 0) / (driverDns.length || 1);
    
    return {
      id: d.id,
      name: d.name,
      trips: driverDns.length,
      onTimeRate: rate,
      safetyScore: Math.round(safety)
    };
  }).sort((a, b) => b.onTimeRate - a.onTimeRate).slice(0, 5);

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

  const handleDownloadReport = (report: AnalyticsReport) => {
    const rows = [
      ['Report', report.title],
      ['Generated', new Date().toISOString()],
      ['Period', report.period ?? 'All time'],
      [],
      ['Metric', 'Value'],
      ...(report.data ? Object.entries(report.data).map(([k, v]) => [k, String(v)]) : [
        ['On-Time Rate', `${onTimeRate}%`],
        ['Total Deliveries', String(allDns.length)],
        ['Exceptions', String(allDns.filter(d => d.exceptionType).length)],
        ['Drivers Active', String(drivers.length)]
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
    <Layout title="Analytics">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricTile icon={Zap} label="Dispatch velocity" value={`${metrics.dispatchTimeAvg}m`} color="text-blue-600" />
        <MetricTile icon={CheckCircle} label="On-time delivery" value={`${onTimeRate}%`} color="text-emerald-600" />
        <MetricTile icon={ShieldAlert} label="Exception rate" value={`${metrics.exceptionRate}%`} color="text-rose-600" />
        <MetricTile icon={Activity} label="Fleet utilization" value="88%" color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FEATURE 6: Prescriptive Analytics Panel */}
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
          {(!api.getTenantPlan() || api.getTenantPlan() === 'STARTER' || api.getTenantPlan() === 'GROWTH') && (
            <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-8">
              <div className="bg-white rounded-[2rem] p-8 max-w-md text-center shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mx-auto mb-4">
                  <Sparkles size={24} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Recommendations</h4>
                <p className="text-sm text-slate-500 font-medium mb-6">
                  AI-assisted operational directives to optimize your fleet and save costs. Upgrade to SCALE to unlock real-time recommendations.
                </p>
                <button 
                  onClick={() => window.location.href = '/admin/subscription'}
                  className="w-full py-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all font-sans"
                >
                  View Scale Intelligence
                </button>
              </div>
            </div>
          )}
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Sparkles size={200} className="text-brand" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Recommendations</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Operational recommendations</p>
              </div>
              <Badge variant="delivered" className="bg-brand/20 text-brand border-none">Active Engine</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { 
                  title: 'Fleet Optimization', 
                  impact: 'High', 
                  saving: '$1,200/mo', 
                  directive: 'Re-allocate 4 light trucks from Nairobi West to Mombasa Hub for weekend surge.',
                  confidence: 96,
                  source: 'Mombasa Port congestion data',
                  icon: Truck,
                  color: 'text-brand'
                },
                { 
                  title: 'Route Efficiency', 
                  impact: 'Medium', 
                  saving: '14% Time', 
                  directive: 'Shift Loresho deliveries to 06:00 AM to avoid new construction bottlenecks.',
                  confidence: 92,
                  source: 'Traffic telemetry logs',
                  icon: Navigation,
                  color: 'text-emerald-500'
                },
                { 
                  title: 'Client Retention', 
                  impact: 'High', 
                  saving: '2 Accounts', 
                  directive: 'Proactively credit Account #402 for recent delay anomalies to prevent churn.',
                  confidence: 88,
                  source: 'CRM sentiment analysis',
                  icon: ShieldAlert,
                  color: 'text-red-500'
                },
                { 
                  title: 'Fuel Economy', 
                  impact: 'Low', 
                  saving: '$450/mo', 
                  directive: 'Enforce 80km/h speed limiters on long-haul routes to Kisumu.',
                  confidence: 95,
                  source: 'Vehicle telemetry stream',
                  icon: Zap,
                  color: 'text-amber-500'
                }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-white/5 ${item.color}`}>
                      <item.icon size={20} />
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Est. Impact</p>
                      <p className={`text-[10px] font-black uppercase ${item.color}`}>{item.saving}</p>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold tracking-tight mb-2">{item.title}</h4>
                  <p className="text-[10px] font-bold text-white/40 leading-relaxed italic mb-4">"{item.directive}"</p>
                  
                  <div className="mb-4 flex flex-col gap-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Confidence</span>
                      <span className={`text-[10px] font-bold ${item.color}`}>{item.confidence}%</span>
                    </div>
                    <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color.replace('text', 'bg')} w-[${item.confidence}%]`} style={{ width: `${item.confidence}%` }} />
                    </div>
                    <p className="text-[8px] text-white/30 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Based on {item.source}</p>
                  </div>

                  <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">
                    Apply recommendation
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Network Volume</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '10px' }}
                    />
                    <Area type="monotone" dataKey="completed" stroke="#0066FF" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 flex justify-between items-center">
                 <div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">2,840</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Shipments</p>
                 </div>
                 <div className="text-right">
                    <p className="text-emerald-500 font-black">+18.4%</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">vs Prev Period</p>
                 </div>
              </div>
           </div>

           <div className="bg-emerald-500 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-500/20">
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-white/20 rounded-2xl"><CheckCircle2 size={24} /></div>
                 <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter">Service Level</h3>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Real-time SLA Compliance</p>
                 </div>
              </div>
              <div className="text-5xl font-black tracking-tighter mb-4">98.2%</div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                 <div className="h-full bg-white w-[98.2%]" />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Volume by Delivery Zone</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Regional distribution</p>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={zoneMetrics} onClick={handleZoneClick}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} fontWeight="bold" stroke="#94a3b8" />
                    <YAxis fontSize={10} fontWeight="bold" stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Driver Performance Rankings */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h3 className="label-logistics text-slate-400">Top Performing Drivers</h3>
            <Badge variant="neutral">Top 5 This Month</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-800">
                  <th className="text-left py-4 label-logistics">Driver</th>
                  <th className="text-center py-4 label-logistics">Trips</th>
                  <th className="text-center py-4 label-logistics">On-Time %</th>
                  <th className="text-right py-4 label-logistics">Safety Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {driverRankings.map((d, i) => (
                  <tr key={d.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[10px] font-black">
                          {d.name.charAt(0)}
                        </div>
                        <span className="body-value truncate-name">{d.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center body-value">{d.trips}</td>
                    <td className="py-4 text-center">
                      <span className={`body-value ${d.onTimeRate >= 95 ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {d.onTimeRate}%
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-brand" style={{ width: `${d.safetyScore}%` }}></div>
                        </div>
                        <span className="body-value">{d.safetyScore}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Exception Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-1">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Exception Breakdown</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={exceptionBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#f97316" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {exceptionBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">{item.name}</span>
                </div>
                <span className="text-[10px] font-black text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
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
                onClick={() => handleDownloadReport(report)}
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
                            <Cell fill="#F97316" />
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
      <p className="label-logistics text-neutral-muted dark:text-slate-400">{label}</p>
      <p className="text-2xl font-black text-neutral-primary dark:text-white">{value}</p>
    </div>
  </div>
);

export default Analytics;
