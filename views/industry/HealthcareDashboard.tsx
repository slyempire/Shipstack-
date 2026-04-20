
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Thermometer, 
  ShieldAlert, 
  Activity, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Stethoscope,
  Pill,
  Microscope,
  FileText,
  Truck
} from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuthStore, useTenantStore } from '../../store';
import { Badge } from '../../packages/ui/Badge';

const HealthcareDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { currentTenant } = useTenantStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const metrics = [
    { label: 'Cold Chain Integrity', value: '99.8%', icon: Thermometer, color: 'emerald', trend: '+0.2%' },
    { label: 'Urgent Deliveries', value: '14', icon: Activity, color: 'rose', trend: 'Active' },
    { label: 'Compliance Score', value: '100%', icon: ShieldAlert, color: 'blue', trend: 'Verified' },
    { label: 'Avg. Transit Time', value: '42m', icon: Clock, color: 'amber', trend: '-5m' },
  ];

  const activeShipments = [
    { id: 'MED-9021', type: 'Vaccines', temp: '4.2°C', status: 'In Transit', priority: 'CRITICAL', eta: '12:45 PM' },
    { id: 'MED-8842', type: 'Blood Plasma', temp: '-18.5°C', status: 'Loading', priority: 'HIGH', eta: '01:15 PM' },
    { id: 'MED-7731', type: 'Surgical Kits', temp: 'Ambient', status: 'Delivered', priority: 'MEDIUM', eta: '11:20 AM' },
  ];

  return (
    <Layout title="Healthcare Logistics Command">
      <div className="space-y-8">
        {/* Industry Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-rose-200">
              <Stethoscope size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Medical Supply Chain</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regulatory Compliance & Cold Chain Monitoring</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
              Compliance Report
            </button>
            <button className="px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all">
              Emergency Dispatch
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <motion.div 
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${m.color}-50 text-${m.color}-600 rounded-2xl`}>
                  <m.icon size={20} />
                </div>
                <span className={`text-[10px] font-black text-${m.color === 'rose' ? 'rose' : 'emerald'}-500 uppercase tracking-widest`}>
                  {m.trend}
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
              <h3 className="text-3xl font-black text-slate-900">{m.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Active Shipments */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Active Medical Shipments</h3>
                <Badge variant="delivered">Live Telemetry</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payload</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Temp Status</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {activeShipments.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                          <span className="text-xs font-black text-rose-600 mono-id">{s.id}</span>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs font-bold text-slate-900">{s.type}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">ETA: {s.eta}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <Thermometer size={14} className={s.temp.includes('-') ? 'text-blue-500' : 'text-emerald-500'} />
                            <span className="text-xs font-black text-slate-900">{s.temp}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <Badge variant={s.priority === 'CRITICAL' ? 'failed' : s.priority === 'HIGH' ? 'exception' : 'delivered'}>
                            {s.priority}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Industry Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-rose-400">Compliance Status</h3>
              <div className="space-y-4">
                {[
                  { label: 'HIPAA Data Protocol', status: 'Active', icon: ShieldAlert },
                  { label: 'Cold Chain Validation', status: 'Verified', icon: Thermometer },
                  { label: 'Medical Waste License', status: 'Valid', icon: FileText },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <item.icon size={16} className="text-rose-400" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{item.status}</span>
                  </div>
                ))}
              </div>
              <button className="w-full py-4 bg-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-900/40 hover:bg-rose-700 transition-all">
                Renew Certifications
              </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Order Labs', icon: Microscope },
                  { label: 'Pharmacy', icon: Pill },
                  { label: 'Fleet', icon: Truck },
                  { label: 'Records', icon: FileText },
                ].map((action) => (
                  <button key={action.label} className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50 transition-all group">
                    <action.icon size={20} className="text-slate-400 group-hover:text-rose-500 mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-rose-600">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HealthcareDashboard;
