
import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { DriverApplication } from '../../types';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  Mail,
  Phone,
  Truck,
  Calendar,
  MoreVertical,
  ExternalLink,
  Loader2,
  FileText,
  ChevronRight,
  UserPlus,
  ShieldCheck,
  Briefcase,
  ArrowRight,
  MessageSquare,
  ClipboardCheck,
  FileCheck,
  Shield,
  GraduationCap,
  Eye
} from 'lucide-react';
import { useAppStore } from '../../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../../components/Modal';
import { VehicleType } from '../../types';

const RecruitmentManagement: React.FC = () => {
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [selectedApp, setSelectedApp] = useState<DriverApplication | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleType: VehicleType.LIGHT_TRUCK,
    experienceYears: 1,
    idNumber: '',
    kraPin: '',
    licenseNumber: ''
  });
  const { addNotification } = useAppStore();

  const stages: { id: DriverApplication['status']; label: string; icon: any; color: string; benchmark: string }[] = [
    { id: 'PENDING', label: 'Applied', icon: ClipboardCheck, color: 'amber', benchmark: 'Initial application received. Awaiting document submission.' },
    { id: 'REVIEWING', label: 'Screening', icon: Search, color: 'blue', benchmark: 'Verifying credentials, KRA PIN, and DL validity.' },
    { id: 'INTERVIEWING', label: 'Interview', icon: MessageSquare, color: 'purple', benchmark: 'Professional background and route knowledge assessment.' },
    { id: 'ONBOARDING', label: 'Onboarding', icon: Truck, color: 'indigo', benchmark: 'Safety training and platform orientation.' },
    { id: 'APPROVED', label: 'Hired', icon: CheckCircle, color: 'emerald', benchmark: 'Onboarding complete. Driver activated in fleet.' },
    { id: 'REJECTED', label: 'Rejected', icon: XCircle, color: 'rose', benchmark: 'Application declined based on compliance or interview.' },
  ];

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await api.getDriverApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load applications:', error);
      addNotification('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: DriverApplication['status']) => {
    try {
      await api.updateDriverApplicationStatus(id, status);
      addNotification(`Moved to ${status.toLowerCase()}`, 'success');
      loadApplications();
    } catch (error) {
      addNotification('Failed to update status', 'error');
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      console.log('[Recruitment] Submitting invitation:', inviteForm);
      const response = await api.createDriverApplication(inviteForm);
      console.log('[Recruitment] Invitation success:', response);
      addNotification('Driver invitation sent successfully', 'success');
      setIsInviteModalOpen(false);
      setInviteForm({
        name: '',
        email: '',
        phone: '',
        vehicleType: VehicleType.LIGHT_TRUCK,
        experienceYears: 1,
        idNumber: '',
        kraPin: '',
        licenseNumber: ''
      });
      loadApplications();
    } catch (error) {
      console.error('[Recruitment] Invitation failed:', error);
      addNotification('Failed to send invitation. Please check the form and try again.', 'error');
    } finally {
      setInviting(false);
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.phone.includes(searchTerm);
    return matchesSearch;
  });

  const handleRequirementToggle = async (appId: string, key: keyof DriverApplication['requirements']) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const newRequirements = { ...app.requirements, [key]: !app.requirements[key] };
    try {
      await api.updateDriverApplicationRequirements(appId, newRequirements);
      loadApplications();
      if (selectedApp?.id === appId) {
        setSelectedApp({ ...app, requirements: newRequirements });
      }
    } catch (error) {
      addNotification('Failed to update requirement', 'error');
    }
  };

  const KanbanColumn = ({ stage }: { stage: typeof stages[0] }) => {
    const stageApps = filteredApps.filter(app => app.status === stage.id);
    
    return (
      <div className="flex-1 min-w-[300px] flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg bg-${stage.color}-50 text-${stage.color}-600 flex items-center justify-center`}>
              <stage.icon size={16} />
            </div>
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{stage.label}</h3>
          </div>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-black">{stageApps.length}</span>
        </div>

        <div className="flex-1 bg-slate-50/50 rounded-[2rem] p-3 border border-slate-100/50 space-y-3 min-h-[500px]">
          {stageApps.map(app => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-brand/20 transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-brand/5 text-brand rounded-xl flex items-center justify-center font-black text-sm">
                  {app.name?.charAt(0)}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-slate-400 hover:text-brand hover:bg-slate-50 rounded-lg">
                    <Eye size={14} />
                  </button>
                </div>
              </div>

              <h4 className="text-[13px] font-black text-slate-900 mb-1">{app.name}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-4">{app.vehicleType}</p>

              {/* Progress Indicators */}
              <div className="flex gap-1 mb-4">
                <div className={`h-1 flex-1 rounded-full ${app.requirements.documentsSubmitted ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                <div className={`h-1 flex-1 rounded-full ${app.requirements.documentsVerified ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                <div className={`h-1 flex-1 rounded-full ${app.requirements.backgroundCheckPassed ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                <div className={`h-1 flex-1 rounded-full ${app.requirements.interviewPassed ? 'bg-emerald-500' : 'bg-slate-100'}`} />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                  <Mail size={12} className="text-slate-300" />
                  <span className="truncate">{app.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                  <Briefcase size={12} className="text-slate-300" />
                  <span>{app.experienceYears} Years Experience</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                  {new Date(app.appliedAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  {stage.id !== 'REJECTED' && stage.id !== 'APPROVED' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextIndex = stages.findIndex(s => s.id === stage.id) + 1;
                        if (nextIndex < stages.length - 1) {
                          handleStatusUpdate(app.id, stages[nextIndex].id);
                        } else if (nextIndex === stages.length - 1) {
                          handleStatusUpdate(app.id, 'APPROVED');
                        }
                      }}
                      className="h-8 w-8 bg-brand/5 text-brand rounded-lg flex items-center justify-center hover:bg-brand hover:text-white transition-all active:scale-90"
                      title="Move to Next Stage"
                    >
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {stageApps.length === 0 && (
            <div className="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Candidates</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout title="Talent Acquisition" subtitle="Modern driver recruitment & onboarding pipeline">
      <div className="space-y-8">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
              <button 
                onClick={() => setViewMode('KANBAN')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'KANBAN' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Pipeline View
              </button>
              <button 
                onClick={() => setViewMode('LIST')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'LIST' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Registry View
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand/10 transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all"
            >
              <UserPlus size={16} /> Invite Driver
            </button>
          </div>
        </div>

        {/* Workflow Benchmarks Guide */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stages.map((stage) => (
            <div key={stage.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <stage.icon size={14} className={`text-${stage.color}-600`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">{stage.label}</span>
              </div>
              <p className="text-[9px] text-slate-400 font-medium leading-tight">{stage.benchmark}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <Loader2 className="animate-spin text-brand mb-4" size={48} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Syncing Talent Pipeline...</p>
          </div>
        ) : viewMode === 'KANBAN' ? (
          <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar min-h-[700px]">
            {stages.map(stage => (
              <KanbanColumn key={stage.id} stage={stage} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Candidate</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Credentials</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Vehicle</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredApps.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center font-black text-lg">
                            {app.name?.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 mb-1">{app.name}</h4>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                              <span className="flex items-center gap-1"><Mail size={12} /> {app.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-600">ID: {app.idNumber}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">License: {app.licenseNumber}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                            <Truck size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-600">{app.vehicleType}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{app.experienceYears} Years Exp.</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                          app.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Modal 
          isOpen={isInviteModalOpen} 
          onClose={() => setIsInviteModalOpen(false)} 
          title="Invite New Driver"
        >
          <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <input 
                  required
                  type="text"
                  value={inviteForm.name}
                  onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                <input 
                  required
                  type="email"
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                <input 
                  required
                  type="tel"
                  value={inviteForm.phone}
                  onChange={e => setInviteForm({ ...inviteForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                  placeholder="+254..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle Type</label>
                <select 
                  value={inviteForm.vehicleType}
                  onChange={e => setInviteForm({ ...inviteForm, vehicleType: e.target.value as VehicleType })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                >
                  {Object.values(VehicleType).map(type => (
                    <option key={type} value={type}>{type.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Number</label>
                <input 
                  required
                  type="text"
                  value={inviteForm.idNumber}
                  onChange={e => setInviteForm({ ...inviteForm, idNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                  placeholder="ID Number"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KRA PIN</label>
                <input 
                  required
                  type="text"
                  value={inviteForm.kraPin}
                  onChange={e => setInviteForm({ ...inviteForm, kraPin: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                  placeholder="A00..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">License Number</label>
                <input 
                  required
                  type="text"
                  value={inviteForm.licenseNumber}
                  onChange={e => setInviteForm({ ...inviteForm, licenseNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                  placeholder="DL-..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience (Years)</label>
                <input 
                  required
                  type="number"
                  min="0"
                  value={inviteForm.experienceYears}
                  onChange={e => setInviteForm({ ...inviteForm, experienceYears: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                disabled={inviting}
                type="submit"
                className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inviting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Candidate Detail Modal */}
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title="Candidate Profile & Workflow"
        >
          {selectedApp && (
            <div className="p-8 space-y-8">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 bg-brand/10 text-brand rounded-3xl flex items-center justify-center font-black text-3xl">
                  {selectedApp.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{selectedApp.name}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedApp.vehicleType} Candidate</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest">
                      {selectedApp.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Workflow Benchmarks</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'documentsSubmitted', label: 'Document Submission', icon: FileText, stage: 'PENDING' },
                      { key: 'documentsVerified', label: 'Credential Verification', icon: FileCheck, stage: 'REVIEWING' },
                      { key: 'backgroundCheckPassed', label: 'Background Security Check', icon: Shield, stage: 'REVIEWING' },
                      { key: 'interviewPassed', label: 'Professional Interview', icon: MessageSquare, stage: 'INTERVIEWING' },
                      { key: 'trainingCompleted', label: 'Onboarding & Training', icon: GraduationCap, stage: 'ONBOARDING' },
                    ].map((req) => (
                      <div 
                        key={req.key}
                        onClick={() => handleRequirementToggle(selectedApp.id, req.key as any)}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                          selectedApp.requirements[req.key as keyof DriverApplication['requirements']]
                            ? 'bg-emerald-50 border-emerald-100'
                            : 'bg-slate-50 border-slate-100 hover:border-brand/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            selectedApp.requirements[req.key as keyof DriverApplication['requirements']]
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white text-slate-400 shadow-sm'
                          }`}>
                            <req.icon size={16} />
                          </div>
                          <div>
                            <p className={`text-[11px] font-black uppercase tracking-tight ${
                              selectedApp.requirements[req.key as keyof DriverApplication['requirements']] ? 'text-emerald-700' : 'text-slate-600'
                            }`}>{req.label}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Required for {req.stage}</p>
                          </div>
                        </div>
                        {selectedApp.requirements[req.key as keyof DriverApplication['requirements']] && (
                          <CheckCircle size={16} className="text-emerald-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Candidate Credentials</h3>
                  <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Number</p>
                        <p className="text-xs font-bold text-slate-700">{selectedApp.idNumber}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">KRA PIN</p>
                        <p className="text-xs font-bold text-slate-700">{selectedApp.kraPin}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">License Number</p>
                      <p className="text-xs font-bold text-slate-700">{selectedApp.licenseNumber}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience</p>
                      <p className="text-xs font-bold text-slate-700">{selectedApp.experienceYears} Years in Logistics</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleStatusUpdate(selectedApp.id, 'REJECTED')}
                        className="flex items-center justify-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button 
                        onClick={() => {
                          const currentIndex = stages.findIndex(s => s.id === selectedApp.status);
                          if (currentIndex < stages.length - 1) {
                            handleStatusUpdate(selectedApp.id, stages[currentIndex + 1].id);
                          }
                        }}
                        className="flex items-center justify-center gap-2 p-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:opacity-90 transition-all"
                      >
                        Next Stage <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default RecruitmentManagement;
