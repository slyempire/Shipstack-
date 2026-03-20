
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { Badge } from '../../packages/ui/Badge';
import { 
  ShieldCheck, 
  Lock, 
  History, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Server, 
  Globe,
  Fingerprint,
  Key,
  Database
} from 'lucide-react';

const SecurityAudit: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      // Simulate fetching security audit logs
      const securityLogs = [
        { id: 'sec-1', action: 'User Login', user: 'admin@meds.com', ip: '192.168.1.1', timestamp: new Date().toISOString(), status: 'SUCCESS' },
        { id: 'sec-2', action: 'Asset Modification', user: 'admin@meds.com', ip: '192.168.1.1', timestamp: new Date(Date.now() - 100000).toISOString(), status: 'SUCCESS' },
        { id: 'sec-3', action: 'Unauthorized Access Attempt', user: 'unknown', ip: '45.12.3.99', timestamp: new Date(Date.now() - 500000).toISOString(), status: 'BLOCKED' },
        { id: 'sec-4', action: 'Data Export', user: 'finance@meds.com', ip: '192.168.1.5', timestamp: new Date(Date.now() - 1000000).toISOString(), status: 'SUCCESS' },
      ];
      setLogs(securityLogs);
      setLoading(false);
    };
    loadLogs();
  }, []);

  const isoStandards = [
    { name: 'ISO 27001', status: 'COMPLIANT', description: 'Information Security Management System' },
    { name: 'ISO 9001', status: 'COMPLIANT', description: 'Quality Management Systems' },
    { name: 'GDPR / Data Protection Act', status: 'COMPLIANT', description: 'Personal Data Privacy & Protection' },
    { name: 'ISO 28000', status: 'IN_PROGRESS', description: 'Security Management Systems for Supply Chain' }
  ];

  return (
    <Layout title="Security & Compliance Center">
      <div className="space-y-8">
        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Score</p>
                <h3 className="text-2xl font-black text-slate-900">98%</h3>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[98%]"></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Lock size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Encryption</p>
                <h3 className="text-2xl font-black text-slate-900">AES-256</h3>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">At-rest & In-transit</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <Fingerprint size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MFA Status</p>
                <h3 className="text-2xl font-black text-slate-900">Enforced</h3>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All Admin Accounts</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center">
                <Database size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Residency</p>
                <h3 className="text-2xl font-black text-slate-900">Africa/KE</h3>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Local Cloud Nodes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ISO Standards Compliance */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand mb-8 flex items-center gap-2">
                <CheckCircle2 size={18} /> ISO Compliance
              </h3>
              <div className="space-y-6">
                {isoStandards.map(std => (
                  <div key={std.name} className="flex items-start gap-4">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${std.status === 'COMPLIANT' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{std.name}</span>
                        <Badge variant={std.status === 'COMPLIANT' ? 'delivered' : 'neutral'}>{std.status}</Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase leading-tight">{std.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-10 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all">
                Download Compliance Report
              </button>
            </div>

            <div className="bg-brand text-white rounded-[2.5rem] p-8 shadow-xl shadow-brand/20">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Key size={18} /> Security Measures
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide">
                  <div className="h-5 w-5 bg-white/20 rounded-lg flex items-center justify-center"><CheckCircle2 size={12} /></div>
                  End-to-End Encryption
                </li>
                <li className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide">
                  <div className="h-5 w-5 bg-white/20 rounded-lg flex items-center justify-center"><CheckCircle2 size={12} /></div>
                  Role-Based Access Control
                </li>
                <li className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide">
                  <div className="h-5 w-5 bg-white/20 rounded-lg flex items-center justify-center"><CheckCircle2 size={12} /></div>
                  Automated Threat Detection
                </li>
                <li className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide">
                  <div className="h-5 w-5 bg-white/20 rounded-lg flex items-center justify-center"><CheckCircle2 size={12} /></div>
                  ISO 27001 Certified Infrastructure
                </li>
              </ul>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm h-full flex flex-col">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand flex items-center gap-2">
                  <History size={18} /> Security Audit Logs
                </h3>
                <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand transition-all">
                  Export Logs
                </button>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Event</th>
                      <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                      <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Network Source</th>
                      <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{log.action}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[11px] font-bold text-slate-600">{log.user}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Globe size={12} />
                            <span className="text-[11px] font-mono font-bold">{log.ip}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <Badge variant={log.status === 'SUCCESS' ? 'delivered' : 'neutral'}>{log.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SecurityAudit;
