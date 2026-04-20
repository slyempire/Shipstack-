
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { DeliveryNote, DNStatus, Trip, IndustryType } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import { useAppStore, useTenantStore, useAuthStore } from '../../store';
import RoleGuard from '../../components/RoleGuard';
import { 
  FileText, 
  Download, 
  Clock,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  CreditCard,
  ChevronRight,
  ArrowUpRight,
  QrCode,
  Zap,
  Truck,
  DollarSign,
  Wallet,
  AlertCircle,
  ArrowRight,
  PieChart,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Modal } from '../../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

const Invoicing: React.FC = () => {
  const { addNotification } = useAppStore();
  const { user } = useAuthStore();
  const { currentTenant } = useTenantStore();
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SETTLEMENTS' | 'COMPENSATION'>('SETTLEMENTS');
  const [filter, setFilter] = useState<'UNBILLED' | 'SETTLED'>('UNBILLED');
  const [simulating, setSimulating] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<{ qrCodeUrl: string; invoiceNumber: string } | null>(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedTripsForPayout, setSelectedTripsForPayout] = useState<string[]>([]);
  const [payoutProcessing, setPayoutProcessing] = useState(false);

  useEffect(() => { loadData(); }, [currentTenant?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dnData, tripData] = await Promise.all([
        api.getDeliveryNotes(),
        api.getTrips()
      ]);
      setDns(dnData.filter(d => [DNStatus.DELIVERED, DNStatus.COMPLETED, DNStatus.INVOICED].includes(d.status)));
      setTrips(tripData.filter(t => t.status === 'COMPLETED' || t.status === 'RECONCILED'));
    } catch (error) {
      addNotification('Failed to load financial data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totals = {
    unbilled: dns.filter(d => d.status !== DNStatus.INVOICED).reduce((acc, curr) => acc + (curr.rate || 0), 0),
    settled: dns.filter(d => d.status === DNStatus.INVOICED).reduce((acc, curr) => acc + (curr.rate || 0), 0),
    pendingCommission: trips.filter(t => t.commissionStatus !== 'DISBURSED').reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0),
    codToCollect: trips.reduce((acc, curr) => acc + (curr.codCollected || 0), 0)
  };

  const handleBatchInvoice = async () => {
    const unbilledIds = dns.filter(d => d.status !== DNStatus.INVOICED).map(d => d.id);
    if (unbilledIds.length === 0) return;
    
    setLoading(true);
    try {
      await api.batchUpdateStatus(unbilledIds, DNStatus.INVOICED, {}, 'Finance Ops');
      addNotification(`Manifested receipts for ${unbilledIds.length} orders.`, 'success');
      await loadData();
    } catch (error) {
      addNotification('Batch run failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisburseCommission = async (tripId: string) => {
    setPayoutProcessing(true);
    const requestId = `pay-${tripId}-${Date.now()}`;
    try {
      await api.batchDisburseCommission([tripId], user?.role, requestId);
      addNotification('Commission disbursement initiated', 'success');
      await loadData();
    } catch (error) {
      addNotification('Disbursement failed', 'error');
    } finally {
      setPayoutProcessing(false);
    }
  };

  const handleBatchPayout = async () => {
    if (selectedTripsForPayout.length === 0) return;
    setPayoutProcessing(true);
    const requestId = `pay-batch-${Date.now()}`;
    try {
      await api.batchDisburseCommission(selectedTripsForPayout, user?.role, requestId);
      addNotification(`Batch payout initiated for ${selectedTripsForPayout.length} trips.`, 'success');
      setSelectedTripsForPayout([]);
      setIsPayoutModalOpen(false);
      await loadData();
    } catch (error) {
      addNotification('Batch payout failed', 'error');
    } finally {
      setPayoutProcessing(false);
    }
  };

  const handleSimulateEtims = async (dn: DeliveryNote) => {
    setSimulating(dn.id);
    try {
      const result = await api.generateEtimsInvoice(dn.id);
      setSimulationResult({
        qrCodeUrl: result.qrCodeUrl,
        invoiceNumber: result.cuInvoiceNumber
      });
      addNotification(`eTIMS Invoice ${result.cuInvoiceNumber} generated for ${dn.externalId}`, 'success');
      await loadData();
    } catch (error) {
      addNotification('eTIMS Simulation failed', 'error');
    } finally {
      setSimulating(null);
    }
  };

  const isEcommerce = currentTenant?.industry === 'E-COMMERCE';

  return (
    <Layout title="Commercial Hub" subtitle="Financial settlements, driver compensation & revenue tracking">
      <div className="space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit">
          <button 
            onClick={() => setActiveTab('SETTLEMENTS')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'SETTLEMENTS' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Order Settlements
          </button>
          <button 
            onClick={() => setActiveTab('COMPENSATION')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'COMPENSATION' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Driver Compensation
          </button>
        </div>

        {activeTab === 'SETTLEMENTS' ? (
          <div className="space-y-8">
            {/* Ledger Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="h-12 w-12 bg-brand/5 text-brand rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Receivable Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900">${totals.unbilled.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-slate-400">USD</span>
                </div>
                <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase">
                   <Clock size={12} /> {dns.filter(d => d.status !== DNStatus.INVOICED).length} Pending Settlement
                </div>
              </div>

              {/* FEATURE 5: Revenue Leakage Detection */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden border border-white/5">
                {(!api.getTenantPlan() || api.getTenantPlan() === 'STARTER' || api.getTenantPlan() === 'GROWTH') && (
                  <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-8 text-center">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
                      <div className="h-12 w-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert size={24} />
                      </div>
                      <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Recover Lost Revenue</h4>
                      <p className="text-sm text-slate-500 font-medium mb-6">
                        Cortex AI identifies unbilled detention, missing surcharges, and discrepancy anomalies. Upgrade to SCALE to enable Revenue Leakage Detection.
                      </p>
                      <button 
                        onClick={() => window.location.href = '/admin/subscription'}
                        className="w-full py-4 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all text-sm font-sans"
                      >
                        View Scale Intelligence
                      </button>
                    </div>
                  </div>
                )}
                <div className="absolute top-0 right-0 p-6 opacity-10">
                   <ShieldAlert size={100} className="text-red-500" />
                </div>
                <div className="h-12 w-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                  <AlertCircle size={24} />
                </div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Revenue Leakage Detected</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">$1,420</span>
                  <span className="text-[10px] font-bold text-white/40">USD</span>
                </div>
                <div className="mt-6 flex flex-col gap-2">
                   <div className="flex items-center gap-2 text-[9px] font-black text-red-500 uppercase">
                      <Zap size={10} /> 12 Unbilled Waiting Time Charges
                   </div>
                   <div className="flex items-center gap-2 text-[9px] font-black text-amber-500 uppercase">
                      <Zap size={10} /> 4 Missing Fuel Surcharges
                   </div>
                </div>
                <button className="mt-6 w-full py-3 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all">
                   Reclaim Revenue
                </button>
              </div>

              <div className="bg-brand p-8 rounded-[2.5rem] shadow-xl shadow-brand/20 flex flex-col justify-between text-white">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter mb-2">Billing Automation</h3>
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-relaxed">
                    AI-powered batch settlement with automated eTIMS synchronization.
                  </p>
                </div>
                <RoleGuard allowedRoles={['ADMIN', 'FINANCE']}>
                  <button 
                    onClick={handleBatchInvoice}
                    disabled={totals.unbilled === 0 || loading}
                    className="w-full bg-white text-brand py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    Run Billing Engine
                  </button>
                </RoleGuard>
              </div>
            </div>

            {/* Transaction Ledger */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                 <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                   <button onClick={() => setFilter('UNBILLED')} className={`text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-lg transition-all ${filter === 'UNBILLED' ? 'bg-white text-brand shadow-sm' : 'text-slate-400'}`}>Active Ledger</button>
                   <button onClick={() => setFilter('SETTLED')} className={`text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-lg transition-all ${filter === 'SETTLED' ? 'bg-white text-brand shadow-sm' : 'text-slate-400'}`}>Archived Receipts</button>
                 </div>
                 <button onClick={loadData} className="p-2 text-slate-300 hover:text-brand transition-colors">
                   <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                 </button>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50">
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Status</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Verification</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {dns.filter(d => filter === 'SETTLED' ? d.status === DNStatus.INVOICED : d.status !== DNStatus.INVOICED).map(dn => (
                         <tr key={dn.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-6">
                               <p className="text-sm font-black text-slate-900 mb-1">{dn.clientName}</p>
                               <p className="text-[10px] font-mono font-bold text-brand uppercase tracking-tight">DN-{dn.externalId}</p>
                            </td>
                            <td className="px-8 py-6">
                               <span className="text-sm font-black text-slate-900">${dn.rate?.toLocaleString()}</span>
                            </td>
                            <td className="px-8 py-6">
                               <Badge variant={dn.podImageUrl ? 'delivered' : 'neutral'} className="scale-90 origin-left">
                                  {dn.podImageUrl ? 'Evidence Captured' : 'Evidence Pending'}
                               </Badge>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex items-center justify-end gap-3">
                                 {dn.externalId === 'FD-9001' && dn.status !== DNStatus.INVOICED && (
                                   <button 
                                     onClick={() => handleSimulateEtims(dn)}
                                     disabled={simulating === dn.id}
                                     className="px-4 py-2 bg-brand/5 text-brand rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand hover:text-white transition-all"
                                   >
                                     <Zap size={12} className={simulating === dn.id ? 'animate-pulse' : ''} />
                                     {simulating === dn.id ? 'Simulating...' : 'eTIMS'}
                                   </button>
                                 )}
                                 <Badge variant={dn.status.toLowerCase() as any}>{dn.status}</Badge>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Driver Compensation Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <Wallet size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pending Commissions</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900">${totals.pendingCommission.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-slate-400">USD</span>
                </div>
              </div>

              {isEcommerce && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                    <DollarSign size={24} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">COD to Collect</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900">${totals.codToCollect.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400">USD</span>
                  </div>
                </div>
              )}

              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between text-white">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter mb-2">Payout Cycle</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6 leading-relaxed">
                    Next scheduled disbursement: Friday, 18:00
                  </p>
                </div>
                <button 
                  onClick={() => setIsPayoutModalOpen(true)}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all"
                >
                  Run Payout Engine
                </button>
              </div>
            </div>

            {/* Compensation Ledger */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Driver Payouts</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-disbursement:</span>
                  <Badge variant="delivered">Active</Badge>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trip / Driver</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission</th>
                      {isEcommerce && <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">COD Collected</th>}
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {trips.map(trip => (
                      <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-900 mb-1">{trip.routeTitle || trip.externalId}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Driver ID: {trip.driverId}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-black text-slate-900">${trip.commissionAmount?.toLocaleString() || '0'}</span>
                        </td>
                        {isEcommerce && (
                          <td className="px-8 py-6">
                            <span className="text-sm font-black text-amber-600">${trip.codCollected?.toLocaleString() || '0'}</span>
                          </td>
                        )}
                        <td className="px-8 py-6">
                          <Badge variant={trip.commissionStatus === 'DISBURSED' ? 'delivered' : 'neutral'}>
                            {trip.commissionStatus || 'PENDING'}
                          </Badge>
                        </td>
                        <td className="px-8 py-6 text-right">
                          {trip.commissionStatus !== 'DISBURSED' && (
                            <button 
                              onClick={() => handleDisburseCommission(trip.id)}
                              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                            >
                              Disburse
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {trips.length === 0 && (
                      <tr>
                        <td colSpan={isEcommerce ? 5 : 4} className="p-20 text-center">
                          <Truck className="text-slate-200 mx-auto mb-4" size={48} />
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No completed trips for payout</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payout Engine Modal */}
        <Modal
          isOpen={isPayoutModalOpen}
          onClose={() => setIsPayoutModalOpen(false)}
          title="Payout Engine"
        >
          <div className="p-8 space-y-6">
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-indigo-900 uppercase">Efficient Payroll</h4>
                  <p className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-widest">Select trips for disbursement</p>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2">
                {trips.filter(t => t.commissionStatus !== 'DISBURSED').map(trip => (
                  <div 
                    key={trip.id}
                    onClick={() => {
                      if (selectedTripsForPayout.includes(trip.id)) {
                        setSelectedTripsForPayout(selectedTripsForPayout.filter(id => id !== trip.id));
                      } else {
                        setSelectedTripsForPayout([...selectedTripsForPayout, trip.id]);
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                      selectedTripsForPayout.includes(trip.id) 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'bg-white border-slate-100 text-slate-900 hover:border-indigo-200'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-black uppercase">{trip.routeTitle || trip.externalId}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedTripsForPayout.includes(trip.id) ? 'text-white/60' : 'text-slate-400'}`}>
                        Driver: {trip.driverId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black">${trip.commissionAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {trips.filter(t => t.commissionStatus !== 'DISBURSED').length === 0 && (
                  <p className="text-center py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">No pending payouts</p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setIsPayoutModalOpen(false)}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400"
              >
                Cancel
              </button>
              <button 
                onClick={handleBatchPayout}
                disabled={selectedTripsForPayout.length === 0 || payoutProcessing}
                className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {payoutProcessing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CheckCircle size={14} />
                )}
                Disburse {selectedTripsForPayout.length} Payouts
              </button>
            </div>
          </div>
        </Modal>

        {/* Simulation Result Modal */}
        <Modal 
          isOpen={!!simulationResult} 
          onClose={() => setSimulationResult(null)}
          title="eTIMS Simulation Result"
        >
          <div className="p-8 space-y-8">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">CU Invoice Number</p>
              <p className="text-2xl font-black text-brand">{simulationResult?.invoiceNumber}</p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                <QrCode size={160} className="text-slate-900" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Verification URL</p>
                <a 
                  href={simulationResult?.qrCodeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-brand hover:underline break-all"
                >
                  {simulationResult?.qrCodeUrl}
                </a>
              </div>
            </div>

            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
              <div className="flex items-start gap-4">
                <CheckCircle size={20} className="text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-tight">Status Synchronized</p>
                  <p className="text-[10px] font-medium text-emerald-600/70 mt-1">Order payment status updated to PENDING and invoice URL attached to the manifest.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSimulationResult(null)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
            >
              Dismiss
            </button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default Invoicing;
