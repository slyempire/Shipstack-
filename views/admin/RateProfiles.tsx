
import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useAuthStore, useAppStore } from '../../store';
import { Badge } from '../../packages/ui/Badge';
import { 
  DollarSign, 
  MapPin, 
  Truck, 
  Plus,
  Edit2,
  Trash2,
  Lock,
  Search,
  X,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const RateProfiles: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useAppStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Commercial logic restricted to FINANCE and ADMIN
  const hasAccess = user && ['ADMIN', 'FINANCE'].includes(user.role);

  const [profiles, setProfiles] = useState([
    { id: '1', name: 'Standard Urban', type: 'Per KM', rate: '2.50', area: 'City Limits', status: 'Active' },
    { id: '2', name: 'Cold Chain Premium', type: 'Flat Fee', rate: '150.00', area: 'Regional', status: 'Active' },
    { id: '3', name: 'Express Pharmacy', type: 'Per Weight', rate: '0.85', area: 'National', status: 'Draft' },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Per KM',
    rate: '',
    area: 'Local',
    status: 'Draft'
  });

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const newP = { id: Date.now().toString(), ...formData };
    setProfiles([...profiles, newP]);
    addNotification("New commercial rate manifested", "success");
    setIsFormOpen(false);
    setFormData({ name: '', type: 'Per KM', rate: '', area: 'Local', status: 'Draft' });
  };

  const filtered = profiles.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  if (!hasAccess) {
    return (
      <Layout title="Restricted Access">
        <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
           <div className="h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-inner">
              <Lock size={40} />
           </div>
           <div className="max-w-xs">
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Security Clearance Denied</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">
                Commercial and financial rate profiles are restricted to authorized personnel.
              </p>
           </div>
           <button onClick={() => window.history.back()} className="text-[10px] font-black text-brand uppercase tracking-[0.2em] hover:underline underline-offset-4 transition-all">Go Back</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Rate Profiles">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <p className="text-sm font-medium text-slate-500">Commercial logic for automated billing and transporter settlements.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text" 
                placeholder="Find commercial rules..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand outline-none transition-all shadow-sm" 
              />
           </div>
           <button 
             onClick={() => setIsFormOpen(true)}
             className="bg-brand text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-brand/90 active:scale-95 transition-all shrink-0"
           >
            <Plus size={18} /> New Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((profile) => (
          <div key={profile.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:border-brand-accent hover:shadow-xl transition-all group flex flex-col h-full relative overflow-hidden">
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-brand group-hover:text-white transition-all shadow-inner">
                <DollarSign size={28} />
              </div>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                <button className="p-2.5 text-slate-400 hover:text-brand bg-slate-50 rounded-xl border border-slate-100 shadow-sm"><Edit2 size={14} /></button>
                <button className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-50 rounded-xl border border-slate-100 shadow-sm"><Trash2 size={14} /></button>
              </div>
            </div>
            
            <div className="flex-1 relative z-10">
              <h3 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-brand-accent transition-colors">{profile.name}</h3>
              <div className="flex items-center gap-3 mb-8">
                <span className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">{profile.type}</span>
                <Badge variant={profile.status === 'Active' ? 'delivered' : 'neutral'} className="scale-90 origin-left">
                  {profile.status}
                </Badge>
              </div>
              
              <div className="space-y-6 pt-8 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Truck size={14} className="text-brand-accent" /> Base Rate
                  </span>
                  <span className="text-lg font-black text-slate-900">${profile.rate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} className="text-brand-accent" /> Geo Coverage
                  </span>
                  <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{profile.area}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-10 flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] opacity-60">
               <Lock size={12} /> Secure Auth Rule
            </div>
            
            <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
               <DollarSign size={160} strokeWidth={4} />
            </div>
          </div>
        ))}
      </div>

      {/* Create Profile Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] bg-brand/40 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg">
                       <DollarSign size={20} />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-brand">Rate Configurator</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">New Commercial Rule</p>
                    </div>
                 </div>
                 <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-brand"><X size={24} /></button>
              </div>

              <form onSubmit={handleCreateProfile} className="p-10 space-y-8">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Profile Name</label>
                       <input 
                         type="text" required
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                         placeholder="e.g. Regional Fridge Flat"
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rate Logic</label>
                          <select 
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                          >
                             <option value="Per KM">Per KM</option>
                             <option value="Flat Fee">Flat Fee</option>
                             <option value="Per Weight">Per Weight</option>
                             <option value="Base + Over-mileage">Base + Excess</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Rate ($)</label>
                          <input 
                            type="number" required
                            step="0.01"
                            value={isNaN(parseFloat(formData.rate)) ? '' : formData.rate}
                            onChange={e => setFormData({...formData, rate: e.target.value})}
                            placeholder="0.00"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Jurisdiction / Area</label>
                       <input 
                         type="text" required
                         value={formData.area}
                         onChange={e => setFormData({...formData, area: e.target.value})}
                         placeholder="National, Regional, etc."
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                       />
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
                    <button 
                      type="submit" 
                      className="flex-[2] bg-brand text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                       <CheckCircle2 size={16} /> Manifest Rule
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default RateProfiles;
