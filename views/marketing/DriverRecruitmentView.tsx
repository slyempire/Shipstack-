
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  CheckCircle, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Clock, 
  DollarSign,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { api } from '../../api';
import { VehicleType, DriverApplication } from '../../types';
import { useAppStore } from '../../store';

const DriverRecruitmentView: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useAppStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusEmail, setStatusEmail] = useState('');
  const [applicationStatus, setApplicationStatus] = useState<DriverApplication | null>(null);
  
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

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingStatus(true);
    try {
      const apps = await api.getDriverApplications();
      const myApp = apps.find(a => a.email.toLowerCase() === statusEmail.toLowerCase());
      if (myApp) {
        setApplicationStatus(myApp);
        setStep(3); // Status View
      } else {
        addNotification('No application found for this email.', 'info');
      }
    } catch (error) {
      addNotification('Error checking status.', 'error');
    } finally {
      setCheckingStatus(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-slate-100">
          <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
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

  if (step === 3 && applicationStatus) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Application Status</h2>
              <p className="text-slate-400 font-medium">Tracking progress for {applicationStatus.name}</p>
            </div>
            <span className="px-4 py-2 bg-brand/10 text-brand rounded-xl text-[10px] font-black uppercase tracking-widest">
              {applicationStatus.status}
            </span>
          </div>

          <div className="space-y-8">
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-100" />
              <div className="space-y-10">
                {[
                  { label: 'Application Submitted', key: 'applied', done: true, desc: 'Initial registration received.' },
                  { label: 'Document Submission', key: 'documentsSubmitted', done: applicationStatus.requirements.documentsSubmitted, desc: 'ID, License, and KRA PIN upload.' },
                  { label: 'Credential Verification', key: 'documentsVerified', done: applicationStatus.requirements.documentsVerified, desc: 'Shipstack team verifying documents.' },
                  { label: 'Background Check', key: 'backgroundCheckPassed', done: applicationStatus.requirements.backgroundCheckPassed, desc: 'Security and safety clearance.' },
                  { label: 'Professional Interview', key: 'interviewPassed', done: applicationStatus.requirements.interviewPassed, desc: 'Face-to-face or digital interview.' },
                  { label: 'Shipstack Onboarding', key: 'trainingCompleted', done: applicationStatus.requirements.trainingCompleted, desc: 'Platform training and final setup.' },
                ].map((s, i) => (
                  <div key={i} className="relative flex gap-8 items-start">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center z-10 shrink-0 ${s.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white border-2 border-slate-100 text-slate-300'}`}>
                      {s.done ? <CheckCircle size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <h4 className={`text-sm font-black uppercase tracking-tight mb-1 ${s.done ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</h4>
                      <p className="text-xs text-slate-400 font-medium">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400"
              >
                Back to Portal
              </button>
              <button 
                onClick={() => addNotification('Document upload feature coming soon to portal.', 'info')}
                className="flex-[2] bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Upload Missing Documents
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container-responsive flex items-center justify-between py-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-brand transition-colors"
            aria-label="Back to Home"
          >
            <ChevronLeft size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Back to Home</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-brand rounded-lg flex items-center justify-center text-white">
              <Truck size={18} />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase">Shipstack Driver</span>
          </div>
          <div className="w-24"></div> {/* Spacer */}
        </div>
      </nav>

      <div className="container-responsive grid lg:grid-cols-2 min-h-[calc(100vh-73px)] !px-0">
        {/* Left Side: Info */}
        <div className="bg-slate-900 text-white p-12 lg:p-24 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full mb-10 w-fit">
            <Zap size={14} className="text-brand-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Recruitment Open</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-10">
            Drive the <br />
            <span className="text-brand-accent">Future of Trade.</span>
          </h1>
          
          <p className="text-xl text-white/40 font-medium mb-16 max-w-md">
            Join East Africa's most advanced logistics network. We offer consistent gigs, fair pay, and a platform built for professional drivers.
          </p>

          <div className="space-y-10">
            {[
              { icon: DollarSign, title: "Consistent Earnings", desc: "Access a steady stream of delivery gigs across the corridor." },
              { icon: Clock, title: "Flexible Schedule", desc: "Choose the trips that fit your availability and route preferences." },
              { icon: ShieldCheck, title: "Digital Security", desc: "Every trip is tracked and insured. Your safety is our priority." }
            ].map((item, i) => (
              <div key={i} className="flex gap-6">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <item.icon size={24} className="text-brand-accent" />
                </div>
                <div>
                  <h4 className="font-black uppercase text-sm tracking-tight mb-1">{item.title}</h4>
                  <p className="text-sm text-white/30 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-12 lg:p-24 bg-white flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-12">
              <div className="flex gap-4 mb-8">
                <button 
                  onClick={() => setStep(1)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${step === 1 ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-slate-50 text-slate-400'}`}
                >
                  Apply Now
                </button>
                <button 
                  onClick={() => setStep(2)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${step === 2 ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-slate-50 text-slate-400'}`}
                >
                  Check Status
                </button>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">
                {step === 1 ? 'Enroll as a Driver' : 'Track Application'}
              </h2>
              <p className="text-slate-400 font-medium">
                {step === 1 ? 'Submit your credentials to start the verification process.' : 'Enter your email to see your current progress.'}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input 
                    type="tel" required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all"
                    placeholder="+254..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all"
                  placeholder="driver@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">National ID</label>
                  <input 
                    type="text" required
                    value={formData.idNumber}
                    onChange={e => setFormData({...formData, idNumber: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all"
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">KRA PIN</label>
                  <input 
                    type="text" required
                    value={formData.kraPin}
                    onChange={e => setFormData({...formData, kraPin: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all"
                    placeholder="A00..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vehicle Type</label>
                <select 
                  value={formData.vehicleType}
                  onChange={e => setFormData({...formData, vehicleType: e.target.value as VehicleType})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all appearance-none"
                >
                  {Object.values(VehicleType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">License Number</label>
                  <input 
                    type="text" required
                    value={formData.licenseNumber}
                    onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all"
                    placeholder="DL-..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Experience (Years)</label>
                  <input 
                    type="number" required min="0"
                    value={formData.experienceYears}
                    onChange={e => setFormData({...formData, experienceYears: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all"
                  />
                </div>
              </div>

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
            </form>
            ) : (
              <form onSubmit={handleCheckStatus} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Email</label>
                  <input 
                    type="email" required
                    value={statusEmail}
                    onChange={e => setStatusEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all"
                    placeholder="driver@example.com"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={checkingStatus}
                  className="w-full bg-slate-900 text-white py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {checkingStatus ? <Loader2 className="animate-spin" size={20} /> : <>Check My Status <ArrowRight size={20} /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverRecruitmentView;
