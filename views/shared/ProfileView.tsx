
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../../store';
import { api } from '../../api';
import Layout from '../../components/Layout';
import { Badge } from '../../packages/ui/Badge';
import { PasswordInput } from '../../packages/ui/PasswordInput';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  Building, 
  Camera, 
  Save, 
  Lock, 
  ChevronLeft,
  Truck,
  Warehouse,
  History,
  ToggleLeft,
  ToggleRight,
  Fingerprint,
  X,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

const ProfileView: React.FC = () => {
  const { user, login } = useAuthStore();
  const { addNotification } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showRotationModal, setShowRotationModal] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    idNumber: user?.idNumber || '',
    kraPin: user?.kraPin || '',
    licenseNumber: user?.licenseNumber || '',
    onDuty: user?.onDuty || false
  });

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updatedUser = await api.updateUser(user.id, formData);
      login(updatedUser, 'mock-token');
      addNotification('Profile synchronized.', 'success');
    } catch (err) {
      addNotification('Synchronization failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const ContentWrapper = ({ children, title }: { children?: React.ReactNode, title: string }) => {
    if (user?.role === 'DRIVER') return (
      <div className="min-h-screen bg-slate-900 text-white font-sans p-6 pb-20">
        <header className="flex items-center gap-4 mb-8 pt-8">
           <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-xl"><ChevronLeft size={20}/></button>
           <h1 className="text-xl font-black uppercase tracking-widest">{title}</h1>
        </header>
        {children}
      </div>
    );
    return <Layout title={title}>{children}</Layout>;
  };

  return (
    <ContentWrapper title="Identity Terminal">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Card */}
        <div className={`bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-10 ${user?.role === 'DRIVER' ? 'bg-slate-800 border-white/5 text-white' : ''}`}>
           <div className="relative shrink-0">
              <div className="h-32 w-32 rounded-[2rem] bg-brand text-white flex items-center justify-center text-4xl font-black shadow-2xl relative overflow-hidden">
                {user?.name.charAt(0)}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                   <Camera size={24} />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg">
                 <Shield size={18} />
              </div>
           </div>

           <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4">
                 <h2 className="text-3xl font-black tracking-tight">{user?.name}</h2>
                 <Badge variant={user?.role.toLowerCase() as any}>{user?.role}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex items-center gap-3 text-slate-400 font-bold text-sm">
                    <Mail size={16} /> {user?.email}
                 </div>
                 <div className="flex items-center gap-3 text-slate-400 font-bold text-sm">
                    <Building size={16} /> {user?.company || 'Enterprise Operations'}
                 </div>
              </div>
              {user?.role === 'DRIVER' && (
                 <div className="pt-4 flex items-center gap-6">
                    <button 
                      onClick={() => setFormData({...formData, onDuty: !formData.onDuty})}
                      className="flex items-center gap-3 group"
                    >
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">On-Duty Status</span>
                       {formData.onDuty ? <ToggleRight className="text-emerald-500" size={32} /> : <ToggleLeft className="text-slate-600" size={32} />}
                    </button>
                 </div>
              )}
           </div>
        </div>

        {/* Tactical Sections */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
           <div className="md:col-span-7 space-y-6">
              <div className={`bg-white rounded-[2rem] border p-8 shadow-sm ${user?.role === 'DRIVER' ? 'bg-slate-800 border-white/5' : ''}`}>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                    <UserIcon size={14} className="text-brand-accent" /> Field Records
                 </h3>
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Legal Name</label>
                       <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className={`w-full rounded-xl border-2 px-4 py-3 font-bold focus:ring-2 focus:ring-brand outline-none transition-all ${user?.role === 'DRIVER' ? 'bg-slate-900 border-white/5 text-white focus:ring-blue-500' : 'bg-slate-50 border-slate-100'}`}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">National ID Number</label>
                          <input 
                           type="text" 
                           value={formData.idNumber} 
                           onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                           className={`w-full rounded-xl border-2 px-4 py-3 font-bold focus:ring-2 focus:ring-brand outline-none transition-all ${user?.role === 'DRIVER' ? 'bg-slate-900 border-white/5 text-white focus:ring-blue-500' : 'bg-slate-50 border-slate-100'}`}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">KRA PIN</label>
                          <input 
                           type="text" 
                           value={formData.kraPin} 
                           onChange={(e) => setFormData({...formData, kraPin: e.target.value.toUpperCase()})}
                           className={`w-full rounded-xl border-2 px-4 py-3 font-bold focus:ring-2 focus:ring-brand outline-none transition-all ${user?.role === 'DRIVER' ? 'bg-slate-900 border-white/5 text-white focus:ring-blue-500' : 'bg-slate-50 border-slate-100'}`}
                          />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Secure Phone</label>
                          <input 
                           type="text" 
                           value={formData.phone} 
                           onChange={(e) => setFormData({...formData, phone: e.target.value})}
                           className={`w-full rounded-xl border-2 px-4 py-3 font-bold focus:ring-2 focus:ring-brand outline-none transition-all ${user?.role === 'DRIVER' ? 'bg-slate-900 border-white/5 text-white focus:ring-blue-500' : 'bg-slate-50 border-slate-100'}`}
                          />
                       </div>
                       {user?.role === 'DRIVER' && (
                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">License ID</label>
                            <input 
                             type="text" 
                             value={formData.licenseNumber} 
                             onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                             className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-4 py-3 font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                         </div>
                       )}
                    </div>
                 </div>
                 <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full mt-10 bg-brand text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                 >
                    {loading ? <Save className="animate-spin" size={18} /> : <Fingerprint size={18} />} Synchronize Profile
                 </button>
              </div>
           </div>

           <div className="md:col-span-5 space-y-6">
              <div className={`bg-white rounded-[2rem] border p-8 shadow-sm ${user?.role === 'DRIVER' ? 'bg-slate-800 border-white/5' : ''}`}>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <Lock size={14} className="text-amber-500" /> Security Protocol
                 </h3>
                 <div className="space-y-4">
                    <button 
                      onClick={() => setShowRotationModal(true)}
                      className={`w-full text-left p-4 rounded-xl border-2 flex items-center justify-between group transition-all ${user?.role === 'DRIVER' ? 'bg-slate-900 border-white/5 hover:border-blue-500' : 'bg-slate-50 border-slate-100 hover:border-brand/20'}`}
                    >
                       <div className="flex items-center gap-3">
                          <Lock size={16} className="text-slate-400" />
                          <span className="text-xs font-bold">Rotate Security PIN</span>
                       </div>
                       <ChevronLeft size={14} className="rotate-180 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                 </div>
              </div>

              <div className={`p-8 rounded-[2rem] border ${user?.role === 'DRIVER' ? 'bg-blue-600/10 border-blue-500/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                 <History size={24} className="mb-4 text-brand-accent" />
                 <h4 className="text-sm font-black uppercase tracking-tight mb-2">Login History</h4>
                 <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">Last access verified from Nairobi, KE @ {new Date().toLocaleTimeString()}</p>
              </div>
           </div>
        </div>
      </div>

      {/* PIN ROTATION MODAL */}
      {showRotationModal && (
        <div className="fixed inset-0 z-[5000] bg-brand/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-none mb-1">Rotation Protocol</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Update Security Credentials</p>
                </div>
              </div>
              <button onClick={() => setShowRotationModal(false)} className="p-2.5 bg-white rounded-xl text-slate-300 hover:text-brand transition-all shadow-sm border border-slate-100"><X size={24}/></button>
            </div>

            <div className="p-10 space-y-8">
              <PasswordInput label="Current Security Pin" placeholder="••••••••" />
              <div className="h-px bg-slate-100 w-full" />
              <PasswordInput label="New Security Pin" showStrength placeholder="••••••••" />
              
              <button className="w-full bg-brand text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                Authorize Rotation
              </button>
            </div>
          </div>
        </div>
      )}
    </ContentWrapper>
  );
};

export default ProfileView;
