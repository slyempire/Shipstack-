
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#0066FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const ShipmentTrendChart = ({ data }: { data: any[] }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorShipment" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis 
          dataKey="day" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} 
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} 
        />
        <Tooltip 
          contentStyle={{ 
            borderRadius: '12px', 
            border: 'none', 
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            fontSize: '10px',
            fontWeight: 800,
            textTransform: 'uppercase'
          }}
        />
        <Area 
          type="monotone" 
          dataKey="count" 
          stroke="#0066FF" 
          strokeWidth={3} 
          fillOpacity={1} 
          fill="url(#colorShipment)" 
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export const StatusDistributionChart = ({ data }: { data: any[] }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={8}
          dataKey="value"
          animationBegin={200}
          animationDuration={1500}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            borderRadius: '12px', 
            border: 'none', 
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            fontSize: '10px',
            fontWeight: 800
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export const ComplianceGaugeChart = ({ value }: { value: number }) => (
  <div className="h-48 w-full relative flex items-center justify-center">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={[
            { value },
            { value: 100 - value }
          ]}
          cx="50%"
          cy="80%"
          startAngle={180}
          endAngle={0}
          innerRadius={60}
          outerRadius={85}
          paddingAngle={0}
          dataKey="value"
          stroke="none"
        >
          <Cell fill="#0066FF" />
          <Cell fill="#F1F5F9" />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
    <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
      <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}%</span>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance</span>
    </div>
  </div>
);

export const EfficiencyRadarChart = ({ data }: { data: any[] }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="#E2E8F0" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
        <Radar
          name="Performance"
          dataKey="A"
          stroke="#0066FF"
          fill="#0066FF"
          fillOpacity={0.6}
          animationDuration={2000}
        />
        <Tooltip 
          contentStyle={{ 
            borderRadius: '12px', 
            border: 'none', 
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            fontSize: '10px',
            fontWeight: 800
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  </div>
);

export const ComparisonBarChart = ({ data }: { data: any[] }) => (
  <div className="h-48 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barGap={8}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
        />
        <Tooltip 
          cursor={{ fill: 'transparent' }}
          contentStyle={{ 
            borderRadius: '12px', 
            border: 'none', 
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            fontSize: '10px',
            fontWeight: 800
          }}
        />
        <Bar dataKey="value" fill="#0066FF" radius={[6, 6, 0, 0]} animationDuration={1000} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const MiniSparkline = ({ data, color = "#0066FF" }: { data: any[], color?: string }) => (
  <div className="h-8 w-16">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2} 
          dot={false} 
          animationDuration={1000} 
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
