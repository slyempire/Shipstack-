
import React from 'react';
import { DeliveryNote, LogisticsDocument, LogisticsDocumentType } from '../types';
import { X, Printer, Download, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';

interface DocumentPreviewProps {
  dn: DeliveryNote;
  doc: LogisticsDocument;
  onClose: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ dn, doc, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-brand/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in">
      <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-12">
        {/* Document Header Controls */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 bg-brand text-white rounded-lg flex items-center justify-center">
                <ShieldCheck size={18} />
             </div>
             <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">{doc.type.replace('_', ' ')}</h3>
                <p className="text-[10px] font-bold text-slate-400">ID: {doc.verificationCode} &bull; Issued {new Date(doc.issuedAt).toLocaleDateString()}</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <button className="p-2 text-slate-400 hover:text-brand transition-colors"><Printer size={18} /></button>
             <button className="p-2 text-slate-400 hover:text-brand transition-colors"><Download size={18} /></button>
             <div className="h-6 w-px bg-slate-200 mx-2" />
             <button onClick={onClose} className="p-2 text-slate-400 hover:text-brand transition-colors"><X size={24} /></button>
          </div>
        </div>

        {/* The "Paper" Container */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-100 flex justify-center">
          <div className="bg-white w-full max-w-[800px] shadow-xl p-16 relative font-serif text-slate-900 min-h-[1000px]">
             {/* Document Letterhead */}
             <div className="flex justify-between items-start mb-20">
                <div>
                   <div className="h-12 w-12 bg-brand text-white rounded flex items-center justify-center font-black text-2xl mb-4">M</div>
                   <h1 className="text-2xl font-black uppercase tracking-tighter font-sans">MEDS Logistics Hub</h1>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">Consolidated Supply Chain Division</p>
                </div>
                <div className="text-right font-sans">
                   <h2 className="text-xl font-black uppercase mb-1">{doc.type.replace('_', ' ')}</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Copy #10293</p>
                   <div className="mt-6 flex justify-end">
                      <div className="p-2 border border-slate-100 rounded-lg">
                         <QrCode size={64} className="text-slate-900" />
                      </div>
                   </div>
                </div>
             </div>

             {/* Core Data Sections */}
             <div className="grid grid-cols-2 gap-20 mb-16 font-sans">
                <div>
                   <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Logistics Provider</h4>
                   <p className="text-sm font-black mb-1">Alpha Transporters Ltd</p>
                   <p className="text-xs text-slate-600">Unit ID: {dn.vehicleId || 'N/A'}</p>
                   <p className="text-xs text-slate-600">Driver: {dn.driverId || 'Pending'}</p>
                </div>
                <div>
                   <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Destination Target</h4>
                   <p className="text-sm font-black mb-1">{dn.clientName}</p>
                   <p className="text-xs text-slate-600 leading-relaxed">{dn.address}</p>
                </div>
             </div>

             {/* Item Table */}
             <div className="mb-20 font-sans">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b-2 border-slate-900">
                         <th className="py-4 text-[10px] font-black uppercase tracking-widest">SKU / Item Description</th>
                         <th className="py-4 text-[10px] font-black uppercase tracking-widest text-right">Quantity</th>
                         <th className="py-4 text-[10px] font-black uppercase tracking-widest text-right">Unit</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {dn.items.map((item, idx) => (
                        <tr key={idx}>
                           <td className="py-6 text-sm font-bold">{item.name}</td>
                           <td className="py-6 text-sm font-black text-right">{item.qty}</td>
                           <td className="py-6 text-sm font-bold text-right text-slate-400 uppercase">{item.unit}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             {/* Execution Notes */}
             <div className="mb-20 font-sans">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Operational Directives</h4>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                   "This document serves as an official {doc.type.toLowerCase().replace('_', ' ')} for Reference {dn.externalId}. 
                   The carrier is authorized to proceed upon verification of this security token: {doc.verificationCode}. 
                   Tampering with digital watermarks is strictly prohibited."
                </p>
             </div>

             {/* Signatures */}
             <div className="grid grid-cols-2 gap-20 font-sans mt-32 border-t border-slate-100 pt-10">
                <div className="text-center">
                   <div className="h-20 flex items-center justify-center border-b border-slate-100 mb-4 italic text-slate-300">
                      {doc.signedBy ? <span className="text-brand font-black font-serif italic text-xl">Signed: {doc.signedBy}</span> : "Issuer Signature"}
                   </div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authority Representative</p>
                </div>
                <div className="text-center">
                   <div className="h-20 flex items-center justify-center border-b border-slate-100 mb-4 italic text-slate-300">
                      Receiver Signature
                   </div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transporter Acknowledgment</p>
                </div>
             </div>

             {/* Background Watermark */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] pointer-events-none opacity-[0.03] select-none">
                <h1 className="text-9xl font-black uppercase tracking-tighter">OFFICIAL COPY</h1>
             </div>
          </div>
        </div>

        {/* Footer Sync Notification */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-center gap-3">
           <CheckCircle2 size={16} className="text-logistics-green" />
           <span className="text-[10px] font-black uppercase tracking-widest">Encrypted Document Link Verified</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
