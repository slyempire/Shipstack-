
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { DeliveryNote, DNStatus } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import { useAppStore } from '../../store';
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
  Zap
} from 'lucide-react';
import { Modal } from '../../components/Modal';

const Invoicing: React.FC = () => {
  const { addNotification } = useAppStore();
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'UNBILLED' | 'SETTLED'>('UNBILLED');
  const [simulating, setSimulating] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<{ qrCodeUrl: string; invoiceNumber: string } | null>(null);

  useEffect(() => { loadBilling(); }, []);

  const loadBilling = async () => {
    setLoading(true);
    const data = await api.getDeliveryNotes();
    setDns(data.filter(d => [DNStatus.DELIVERED, DNStatus.COMPLETED, DNStatus.INVOICED].includes(d.status)));
    setLoading(false);
  };

  const totals = {
    unbilled: dns.filter(d => d.status !== DNStatus.INVOICED).reduce((acc, curr) => acc + (curr.rate || 0), 0),
    settled: dns.filter(d => d.status === DNStatus.INVOICED).reduce((acc, curr) => acc + (curr.rate || 0), 0)
  };

  const handleBatchInvoice = async () => {
    const unbilledIds = dns.filter(d => d.status !== DNStatus.INVOICED).map(d => d.id);
    if (unbilledIds.length === 0) return;
    
    setLoading(true);
    await api.batchUpdateStatus(unbilledIds, DNStatus.INVOICED, {}, 'Finance Ops');
    addNotification(`Manifested receipts for ${unbilledIds.length} orders.`, 'success');
    await loadBilling();
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
      await loadBilling();
    } catch (error) {
      addNotification('eTIMS Simulation failed', 'error');
    } finally {
      setSimulating(null);
    }
  };

  const displayItems = dns.filter(d => filter === 'SETTLED' ? d.status === DNStatus.INVOICED : d.status !== DNStatus.INVOICED);

  return (
    <Layout title="Financial Control">
      <div className="space-y-6">
        {/* Ledger Summary: Stripe Style */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Receivable Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-brand">${totals.unbilled.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-slate-400">USD</span>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
               <Clock size={12} className="text-logistics-amber" /> {dns.filter(d => d.status !== DNStatus.INVOICED).length} pending settlement
            </div>
          </div>

          <div className="md:col-span-4 bg-brand text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">Net Realized (MTD)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">${totals.settled.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-white/40">USD</span>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-white/40 uppercase">
               <CheckCircle size={12} className="text-logistics-green" /> Reconciled with ERP Ledger
            </div>
            <TrendingUp className="absolute -right-4 -bottom-4 text-white/5" size={120} />
          </div>

          <div className="md:col-span-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-center gap-4">
             <button 
               onClick={handleBatchInvoice}
               disabled={totals.unbilled === 0 || loading}
               className="w-full bg-brand text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] shadow-xl shadow-brand/10 hover:opacity-90 active:scale-95 disabled:opacity-20"
             >
                Initiate Batch Run
             </button>
             <div className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-400 uppercase">
                <ArrowUpRight size={12} /> External ERP Sync Active
             </div>
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[450px]">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
             <div className="flex items-center gap-2 p-1 bg-slate-200/50 rounded-lg">
               <button onClick={() => setFilter('UNBILLED')} className={`text-[9px] font-black uppercase tracking-wider px-4 py-1.5 rounded-md transition-all ${filter === 'UNBILLED' ? 'bg-white text-brand shadow-sm' : 'text-slate-500'}`}>Active Ledger</button>
               <button onClick={() => setFilter('SETTLED')} className={`text-[9px] font-black uppercase tracking-wider px-4 py-1.5 rounded-md transition-all ${filter === 'SETTLED' ? 'bg-white text-brand shadow-sm' : 'text-slate-500'}`}>Archived Receipts</button>
             </div>
             <button onClick={loadBilling} className="p-2 text-slate-300 hover:text-brand transition-colors">
               <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
             </button>
          </div>

          <div className="flex-1 overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                   <tr>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Recipient</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Audit Status</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Verification</th>
                      <th className="px-6 py-4 w-12"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {displayItems.length === 0 ? (
                      <tr><td colSpan={5} className="p-32 text-center text-slate-300 uppercase text-[10px] font-black tracking-widest">Ledger Clear</td></tr>
                   ) : (
                      displayItems.map(dn => (
                        <tr key={dn.id} className="hover:bg-slate-50 transition-colors group">
                           <td className="px-6 py-4">
                              <p className="text-[13px] font-bold text-slate-900 leading-none mb-1">{dn.clientName}</p>
                              <p className="text-[10px] font-mono font-bold text-brand/40 uppercase tracking-tight">REF-{dn.externalId}</p>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-[13px] font-black text-slate-900">${dn.rate?.toLocaleString()}</span>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center">
                                 <Badge variant={dn.podImageUrl ? 'delivered' : 'neutral'} className="scale-90">
                                    {dn.podImageUrl ? 'Evidence Captured' : 'Evidence Pending'}
                                 </Badge>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {dn.externalId === 'FD-9001' && dn.status !== DNStatus.INVOICED && (
                                  <button 
                                    onClick={() => handleSimulateEtims(dn)}
                                    disabled={simulating === dn.id}
                                    className="p-2 text-brand hover:bg-brand/10 rounded-lg transition-all flex items-center gap-1 text-[9px] font-black uppercase"
                                    title="Simulate eTIMS"
                                  >
                                    <Zap size={14} className={simulating === dn.id ? 'animate-pulse' : ''} />
                                    {simulating === dn.id ? 'Simulating...' : 'eTIMS'}
                                  </button>
                                )}
                                <Badge variant={dn.status === DNStatus.INVOICED ? 'invoiced' : 'dispatched'}>{dn.status}</Badge>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="p-2 text-slate-300 hover:text-brand transition-all opacity-0 group-hover:opacity-100">
                                 <ChevronRight size={16} />
                              </button>
                           </td>
                        </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
        </div>

        {/* Simulation Result Modal */}
        <Modal 
          isOpen={!!simulationResult} 
          onClose={() => setSimulationResult(null)}
          title="eTIMS Simulation Result"
        >
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">CU Invoice Number</p>
              <p className="text-xl font-black text-brand">{simulationResult?.invoiceNumber}</p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <QrCode size={120} className="text-slate-900" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verification URL</p>
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

            <div className="bg-logistics-green/10 p-4 rounded-xl border border-logistics-green/20">
              <div className="flex items-start gap-3">
                <CheckCircle size={16} className="text-logistics-green mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-logistics-green">Status Updated</p>
                  <p className="text-[10px] text-logistics-green/70">Delivery note payment status set to PENDING and invoice URL attached.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSimulationResult(null)}
              className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest"
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
