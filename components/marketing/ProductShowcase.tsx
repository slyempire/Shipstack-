import React from 'react';
import {
  LayoutDashboard,
  Truck,
  Map as MapIcon,
  Wallet,
  Users,
  Navigation,
  CheckCircle,
  Bell,
  Search,
  TrendingUp,
} from 'lucide-react';
import { ShipmentTrendChart, StatusDistributionChart, MiniSparkline } from '../DashboardCharts';
import { KPICard } from '../shared/KPICard';

// Faithful, in-browser reproduction of the real Shipstack operations console
// (views/admin/AdminDashboard.tsx). It renders the actual product chart
// components — ShipmentTrendChart / StatusDistributionChart / MiniSparkline —
// inside a light "app window", so visitors see the genuine dashboard UI rather
// than a placeholder. Static, representative data (Nairobi operations, KES).

const VOLUME = [
  { day: 'Mon', count: 42 },
  { day: 'Tue', count: 58 },
  { day: 'Wed', count: 45 },
  { day: 'Thu', count: 62 },
  { day: 'Fri', count: 75 },
  { day: 'Sat', count: 31 },
  { day: 'Sun', count: 18 },
];

const STATUS = [
  { name: 'In transit', value: 24 },
  { name: 'Delivered', value: 61 },
  { name: 'Pending', value: 12 },
  { name: 'Exceptions', value: 3 },
];
const STATUS_COLORS = ['#0066FF', '#10B981', '#F59E0B', '#EF4444'];

const spark = (a: number[]) => a.map((value) => ({ value }));

const KPIS = [
  {
    label: 'Active shipments',
    value: '128',
    trend: 12,
    icon: Navigation,
    chip: 'bg-blue-50 text-blue-600',
    data: spark([18, 24, 20, 30, 26, 34, 38]),
    color: '#10B981',
  },
  {
    label: 'On-time rate',
    value: '98.2%',
    trend: 1,
    icon: CheckCircle,
    chip: 'bg-emerald-50 text-emerald-600',
    data: spark([94, 95, 96, 95, 97, 98, 98]),
    color: '#10B981',
  },
  {
    label: 'Fleet utilization',
    value: '85%',
    trend: 4,
    icon: Truck,
    chip: 'bg-amber-50 text-amber-600',
    data: spark([70, 74, 72, 78, 80, 83, 85]),
    color: '#10B981',
  },
  {
    label: 'Revenue · MTD',
    value: 'KES 4.1M',
    trend: 8,
    icon: Wallet,
    chip: 'bg-violet-50 text-violet-600',
    data: spark([22, 28, 26, 31, 35, 33, 41]),
    color: '#10B981',
  },
];

const NAV = [LayoutDashboard, Truck, MapIcon, Wallet, Users];

export const DashboardShowcase: React.FC = () => {
  return (
    <div className="w-full rounded-2xl bg-white border border-slate-200 shadow-[0_40px_80px_-32px_rgba(15,23,42,0.45)] overflow-hidden text-slate-900 normal-case selection:bg-blue-600 selection:text-white">
      {/* Window chrome */}
      <div className="flex items-center gap-4 px-4 h-11 bg-slate-50 border-b border-slate-200">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 max-w-xs mx-auto hidden sm:flex items-center gap-2 h-6 px-3 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          app.shipstack.co/dashboard
        </div>
        <div className="flex items-center gap-3 text-slate-300 ml-auto sm:ml-0">
          <Search size={14} />
          <Bell size={14} />
          <span className="h-6 w-6 rounded-full bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center">AK</span>
        </div>
      </div>

      <div className="flex">
        {/* Rail */}
        <div className="hidden md:flex flex-col items-center gap-1 w-14 bg-[#0B0E16] py-4 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-[#FF5722] flex items-center justify-center text-white mb-3">
            <LayoutDashboard size={16} />
          </div>
          {NAV.slice(1).map((Icon, i) => (
            <div key={i} className="h-9 w-9 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 transition-colors">
              <Icon size={16} />
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0 p-4 sm:p-5 bg-slate-50/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-900">Command Hub</h3>
              <p className="text-[11px] text-slate-400 font-medium">Nairobi operations · live</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
              <span className="inline-flex items-center h-7 px-3 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-slate-500">Last 7 days</span>
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            {KPIS.map((k) => (
              <KPICard
                key={k.label}
                variant="mock-showcase"
                icon={k.icon}
                label={k.label}
                value={k.value}
                trend={k.trend}
                chipClass={k.chip}
                color={k.color}
              />
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-5 gap-3">
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-slate-900">Network volume</h4>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-[#0066FF]" /> Shipments / day
                </span>
              </div>
              <ShipmentTrendChart data={VOLUME} />
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-900 mb-1">Status distribution</h4>
              <StatusDistributionChart data={STATUS} />
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {STATUS.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-50">
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[i] }} />
                      {s.name}
                    </span>
                    <span className="text-[11px] font-bold text-slate-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardShowcase;
