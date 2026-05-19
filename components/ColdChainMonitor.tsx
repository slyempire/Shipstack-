
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';
import { Thermometer, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { ColdChainLog } from '../types';

interface ColdChainMonitorProps {
  logs: ColdChainLog[];
  minTemp: number;
  maxTemp: number;
  unit?: string;
}

const ColdChainMonitor: React.FC<ColdChainMonitorProps> = ({ 
  logs, 
  minTemp, 
  maxTemp, 
  unit = 'C' 
}) => {
  const chartData = logs.map(log => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temp: log.temperature,
    isAlert: log.isAlert
  }));

  const currentTemp = logs.length > 0 ? logs[logs.length - 1].temperature : null;
  const isHealthy = currentTemp !== null && currentTemp >= minTemp && currentTemp <= maxTemp;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Temperature</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black tracking-tighter ${isHealthy ? 'text-slate-900' : 'text-red-600'}`}>
              {currentTemp !== null ? `${currentTemp}°${unit}` : 'N/A'}
            </span>
            <div className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Range</p>
          <span className="text-xl font-bold text-slate-700 tracking-tight">
            {minTemp}° to {maxTemp}°{unit}
          </span>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Compliance Status</p>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isHealthy ? 'text-emerald-600' : 'text-red-600'}`}>
              {isHealthy ? 'Within spec' : 'Exceeded bounds'}
            </span>
          </div>
          {isHealthy ? (
            <ShieldCheck className="text-emerald-500" size={24} />
          ) : (
            <AlertTriangle className="text-red-500" size={24} />
          )}
        </div>
      </div>

      <div className="h-[250px] w-full bg-slate-900/5 rounded-2xl p-4 border border-slate-100">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="time" 
              fontSize={10} 
              fontWeight="bold" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              fontSize={10} 
              fontWeight="bold" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#94a3b8' }}
              domain={[Math.min(minTemp - 5, ...logs.map(l => l.temperature)), Math.max(maxTemp + 5, ...logs.map(l => l.temperature))]}
            />
            <Tooltip 
              contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
              labelStyle={{ fontWeight: 'black', textTransform: 'uppercase' }}
            />
            
            {/* Target Range Highlight */}
            <ReferenceArea 
              y1={minTemp} 
              y2={maxTemp} 
              fill="#10b981" 
              fillOpacity={0.05} 
            />

            <Line 
              type="monotone" 
              dataKey="temp" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.temp < minTemp || payload.temp > maxTemp) {
                  return <circle cx={cx} cy={cy} r={4} fill="#ef4444" stroke="white" strokeWidth={2} />;
                }
                return <circle cx={cx} cy={cy} r={3} fill="#3b82f6" stroke="white" strokeWidth={2} />;
              }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 p-4 bg-slate-950 text-white rounded-2xl overflow-hidden relative">
         <Activity className="text-brand-accent animate-pulse shrink-0" size={20} />
         <div className="flex-1 overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Real-time Sensor Uplink</p>
            <div className="flex gap-4 overflow-x-auto no-scrollbar whitespace-nowrap">
               {logs.slice(-3).reverse().map((log, idx) => (
                 <div key={idx} className="flex items-center gap-2 opacity-60">
                    <span className="text-[9px] font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className="text-[10px] font-black">{log.temperature}°{unit}</span>
                    <div className={`h-1 w-1 rounded-full ${log.isAlert ? 'bg-red-500' : 'bg-emerald-500'}`} />
                 </div>
               ))}
            </div>
         </div>
         <Thermometer className="absolute -right-4 -bottom-4 opacity-10" size={80} />
      </div>
    </div>
  );
};

export default ColdChainMonitor;
