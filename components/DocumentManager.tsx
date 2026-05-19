
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Loader2, 
  Plus, 
  X,
  FileCheck,
  Shield,
  Clock,
  Tag,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DocumentService, DocumentMetadata } from '../services/documentService';
import { useAuthStore } from '../store';

interface DocumentManagerProps {
  entityType: string;
  entityId: string;
  onDocumentCountChange?: (count: number) => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ 
  entityType, 
  entityId, 
  onDocumentCountChange 
}) => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const user = useAuthStore(state => state.user);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await DocumentService.getDocuments(entityType, entityId);
      setDocuments(docs);
      onDocumentCountChange?.(docs.length);
      setError(null);
    } catch (err: any) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, onDocumentCountChange]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    
    if (!file || !documentType) return;

    try {
      setUploading(true);
      await DocumentService.uploadDocument(file, {
        entityType,
        entityId,
        documentType,
        uploadedBy: user?.name || 'System',
        tags: []
      });
      setShowUploadModal(false);
      loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await DocumentService.deleteDocument(docId);
      loadDocuments();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleDownload = async (doc: DocumentMetadata) => {
    try {
      await DocumentService.downloadDocument(doc.id, doc.originalName);
    } catch (err) {
      alert('Download failed');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <FileText size={14} className="text-brand" />
          Document Vault ({documents.length})
        </h3>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="p-2 bg-brand/10 hover:bg-brand/20 text-brand rounded-lg transition-colors group"
          title="Upload Document"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
            <Loader2 size={24} className="text-brand animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Vault...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem] gap-2">
            <FileText size={32} className="text-slate-200" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Documents Attached</p>
          </div>
        ) : (
          documents.map((doc) => (
            <motion.div 
              key={doc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="group p-4 bg-white border border-slate-100 rounded-2xl hover:border-brand/30 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-50 text-slate-400 group-hover:bg-brand group-hover:text-white rounded-xl flex items-center justify-center transition-colors">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight mb-1">{doc.originalName}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <Tag size={10} className="text-brand" />
                        {doc.documentType}
                      </span>
                      <span className="text-[9px] font-medium text-slate-300">•</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <Clock size={10} />
                        {new Date(doc.uploadTimestamp).toLocaleDateString()}
                      </span>
                      <span className="text-[9px] font-medium text-slate-300">•</span>
                      <span className="text-[9px] font-black uppercase text-slate-400">{formatSize(doc.size)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-slate-400 hover:text-brand hover:bg-brand/5 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !uploading && setShowUploadModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-2">Secure Upload</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attach Document to {entityId}</p>
                </div>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="h-10 w-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpload} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Document Classification</label>
                    <select 
                      name="documentType"
                      required
                      className="w-full h-14 bg-slate-50 border-2 border-transparent focus:border-brand/30 focus:bg-white rounded-2xl px-6 text-sm font-bold transition-all outline-none"
                    >
                      <option value="WAYBILL">Waybill</option>
                      <option value="MANIFEST">Smart Manifest</option>
                      <option value="PROOF_OF_DELIVERY">Proof of Delivery (POD)</option>
                      <option value="INVOICE">Tax Invoice (eTIMS)</option>
                      <option value="CUSTOMS_DECLARATION">Customs Doc</option>
                      <option value="INSURANCE_CERTIFICATE">Insurance Cert</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Physical File</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        name="file"
                        required
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="h-32 border-2 border-dashed border-slate-200 group-hover:border-brand/30 group-hover:bg-brand/5 rounded-2xl flex flex-col items-center justify-center transition-all">
                        <Upload size={24} className="text-slate-300 group-hover:text-brand mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-brand">Drag or Click to Select</span>
                        <span className="text-[8px] font-bold text-slate-300 mt-1 uppercase">Max 10MB • PDF, JPG, PNG</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={uploading}
                  className="w-full h-16 bg-brand hover:bg-brand/90 disabled:bg-slate-100 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-brand/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Encrypting...
                    </>
                  ) : (
                    <>
                      <Shield size={20} />
                      Commit to Vault
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentManager;
