
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuthStore } from '../../store';
import { 
  Scale, 
  ShieldCheck, 
  FileText, 
  ChevronLeft, 
  BookOpen, 
  Lock, 
  CheckCircle2,
  AlertCircle,
  Layers
} from 'lucide-react';

const LegalView: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const ContentWrapper = ({ children, title }: { children?: React.ReactNode, title: string }) => {
    if (user?.role === 'DRIVER') return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 pb-20">
        <header className="flex items-center gap-4 mb-8 pt-8">
           <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><ChevronLeft size={20}/></button>
           <h1 className="text-xl font-black uppercase tracking-widest">{title}</h1>
        </header>
        <div className="max-w-3xl mx-auto">{children}</div>
      </div>
    );
    return <Layout title={title}>{children}</Layout>;
  };

  return (
    <ContentWrapper title="Governance & Compliance">
       <div className="space-y-12">
          {/* Top Banner */}
          <div className="bg-brand text-white p-12 rounded-[3rem] shadow-2xl shadow-brand/20 relative overflow-hidden">
             <Layers className="absolute -right-8 -top-8 text-white/5" size={200} />
             <div className="relative z-10 max-w-lg">
                <h2 className="text-4xl font-black tracking-tighter uppercase mb-6 leading-none">Shipstack Operational Charter</h2>
                <p className="text-white/40 text-sm font-medium leading-relaxed uppercase tracking-tight">
                   The following protocols govern all data transmission, cargo handling, and driver behavior within the Shipstack Logistics Grid. 
                   Compliance is monitored in real-time by the Stack Guard protocol.
                </p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
             <div className="lg:col-span-8 space-y-10">
                <section className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-brand"><BookOpen size={20} /></div>
                      <h3 className="text-xl font-black uppercase tracking-tight">1. Data Sovereignty</h3>
                   </div>
                   <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm text-sm text-slate-600 leading-relaxed space-y-4">
                      <p>
                        All telemetry data, including high-precision GPS coordinates, odometer readings, and photographic evidence 
                        transmitted through the Shipstack terminal, remains the property of the originating client, managed by 
                        <strong> Shipstack Operations Division</strong>.
                      </p>
                      <p>
                        Drivers and Facility Agents agree to the continuous logging of operational metrics for the purpose of 
                        SLA verification and safety auditing. Unauthorized extraction of identity data is strictly prohibited.
                      </p>
                   </div>
                </section>

                <section className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-brand"><ShieldCheck size={20} /></div>
                      <h3 className="text-xl font-black uppercase tracking-tight">2. Cargo Liability Protocol</h3>
                   </div>
                   <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm text-sm text-slate-600 leading-relaxed space-y-4">
                      <p>
                        Upon verification of a <strong>Loading Authority (LA)</strong> via the Shipstack terminal, the assigned Transporter assumes full 
                        custody and liability for the cargo manifest. Handover is only complete when the destination site 
                        confirms receipt via Digital Signature and Photo Evidence.
                      </p>
                      <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex gap-4 text-orange-800">
                         <AlertCircle className="shrink-0" size={20} />
                         <p className="text-[10px] font-bold uppercase tracking-wide">
                            Exceptions must be reported immediately via the Terminal's incident flag system. Failure to document 
                            damage at point-of-loading voids Transporter exception claims.
                         </p>
                      </div>
                   </div>
                </section>
             </div>

             <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 text-center">Stack Security Verified</h4>
                   <ul className="space-y-4">
                      {[
                        "Identity Verification Protocol",
                        "Terminal Encryption Level 4",
                        "Audit Trail Immutable Logs",
                        "Privacy Shield Compliant"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                           <CheckCircle2 size={16} className="text-brand-teal" /> {item}
                        </li>
                      ))}
                   </ul>
                </div>

                <div className="bg-brand text-white p-8 rounded-[2rem] shadow-2xl">
                   <Lock size={32} className="text-brand-accent mb-4" />
                   <h4 className="text-sm font-black uppercase mb-2">Shipstack Privacy Shield</h4>
                   <p className="text-[10px] font-bold text-white/40 uppercase leading-relaxed tracking-wider">
                      Version 3.0.0 &bull; Revised Jan 2025. All interactions are signed with Shipstack RSA keys.
                   </p>
                </div>
             </div>
          </div>
       </div>
    </ContentWrapper>
  );
};

export default LegalView;