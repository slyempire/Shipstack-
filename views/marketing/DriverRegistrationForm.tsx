
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  CheckCircle, 
  ArrowRight, 
  ChevronLeft,
  Loader2,
  ShieldCheck,
  User,
  Mail,
  Phone,
  CreditCard,
  FileText
} from 'lucide-react';
import { api } from '../../api';
import { VehicleType } from '../../types';
import { useAppStore } from '../../store';

const DriverRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    kraPin: '',
    licenseNumber: '',
    vehicleType: VehicleType.SMALL_VAN,
    experienceYears: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createDriverApplication(formData);
      setSubmitted(true);
      addNotification('Application submitted successfully!', 'success');
    } catch (error) {
      console.error('Application failed:', error);
      addNotification('Failed to submit application. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
          <div className="h-24 w-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Application Received!</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">
            Thank you for applying to join the Shipstack fleet. Our recruitment team will review your credentials and contact you within 48 hours.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-brand text-white py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container-responsive flex items-center justify-between py-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-brand transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-brand rounded-lg flex items-center justify-center text-white">
              <Truck size={18} />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase">Shipstack</span>
          </div>
          <div className="w-10"></div>
        </div>
      </nav>

      <div className="container-responsive py-12 lg:py-20 flex justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <Truck size={120} />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-brand-accent/20 text-brand-accent px-4 py-2 rounded-full mb-6">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Secure Registration</span>
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-4">
                  Driver Onboarding
                </h1>
                <p className="text-white/40 font-medium max-w-sm">
                  Join East Africa's premier logistics network. Complete the form below to start your journey.
                </p>
              </div>
            </div>

            <div className="p-12">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <User size={14} /> Personal Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        type="text" required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input 
                        type="email" required
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand outline-none transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input 
                        type="tel" required
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand outline-none transition-all"
                        placeholder="+254 700 000 000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">National ID Number</label>
                      <input 
                        type="text" required
                        value={formData.idNumber}
                        onChange={e => setFormData({...formData, idNumber: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand outline-none transition-all"
                        placeholder="12345678"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Professional Credentials */}
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <FileText size={14} /> Professional Credentials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">License Number</label>
                      <input 
                        type="text" required
                        value={formData.licenseNumber}
                        onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand outline-none transition-all"
                        placeholder="DL-12345678"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">KRA PIN</label>
                      <input 
                        type="text" required
                        value={formData.kraPin}
                        onChange={e => setFormData({...formData, kraPin: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand outline-none transition-all"
                        placeholder="A001234567X"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vehicle Type</label>
                      <select 
                        value={formData.vehicleType}
                        onChange={e => setFormData({...formData, vehicleType: e.target.value as VehicleType})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand outline-none transition-all appearance-none"
                      >
                        {Object.values(VehicleType).map(type => (
                          <option key={type} value={type}>{type.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Experience (Years)</label>
                      <input 
                        type="number" required min="0"
                        value={formData.experienceYears}
                        onChange={e => setFormData({...formData, experienceYears: parseInt(e.target.value)})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand text-white py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand/40 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>Submit Application <ArrowRight size={20} /></>
                    )}
                  </button>
                  <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6">
                    By submitting, you agree to Shipstack's Terms of Service and Privacy Policy.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverRegistrationForm;
