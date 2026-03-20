
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { APIKey, ImportLog, ImportPreviewRow, WebhookSubscription } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import { useAppStore, useAuthStore } from '../../store';
import { 
  DatabaseZap, 
  Upload, 
  Key, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Plus,
  Trash2,
  Terminal,
  Activity,
  ChevronRight,
  Code,
  Link as LinkIcon,
  ShieldCheck,
  X,
  FileSearch,
  Wand2,
  Check,
  AlertCircle,
  Settings
} from 'lucide-react';

const DataIngress: React.FC = () => {
  const { addNotification } = useAppStore();
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'API' | 'WEBHOOKS' | 'ERP'>('PIPELINE');
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [keys, logs] = await Promise.all([api.getAPIKeys(), api.getImportLogs()]);
    setApiKeys(keys);
    setImportLogs(logs);
    setLoading(false);
  };

  return (
    <Layout title="Data Pipeline & API Gateway">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex p-1 bg-slate-200/50 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            <button 
              onClick={() => setActiveTab('PIPELINE')}
              className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'PIPELINE' ? 'bg-white text-brand shadow-md' : 'text-slate-500'}`}
            >
              Pipeline
            </button>
            <button 
              onClick={() => setActiveTab('API')}
              className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'API' ? 'bg-white text-brand shadow-md' : 'text-slate-500'}`}
            >
              API Gateway
            </button>
            <button 
              onClick={() => setActiveTab('WEBHOOKS')}
              className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'WEBHOOKS' ? 'bg-white text-brand shadow-md' : 'text-slate-500'}`}
            >
              Webhooks
            </button>
            <button 
              onClick={() => setActiveTab('ERP')}
              className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'ERP' ? 'bg-white text-brand shadow-md' : 'text-slate-500'}`}
            >
              ERP Connectors
            </button>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">Gateway Stable</span>
             </div>
          </div>
        </div>

        {activeTab === 'PIPELINE' && <IngressWizard onComplete={loadData} />}
        {activeTab === 'API' && <APIGateway keys={apiKeys} onUpdate={loadData} />}
        {activeTab === 'WEBHOOKS' && <WebhookManager />}
        {activeTab === 'ERP' && <ERPConnectorManager />}
      </div>
    </Layout>
  );
};

const WebhookManager = () => {
  const { addNotification } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [] as string[]
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      const data = await api.getWebhooks();
      setWebhooks(data);
    } catch (err) {
      addNotification("Failed to load webhooks", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhook.url) {
      addNotification("Endpoint URL is required", "error");
      return;
    }
    if (newWebhook.events.length === 0) {
      addNotification("Select at least one event", "error");
      return;
    }

    try {
      await api.createWebhook(newWebhook);
      addNotification("Webhook subscription manifested.", "success");
      setNewWebhook({ url: '', events: [] });
      setShowAddModal(false);
      loadWebhooks();
    } catch (err) {
      addNotification("Failed to create webhook", "error");
    }
  };

  const toggleEvent = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event) 
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-right-8 duration-500">
       <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <LinkIcon size={24} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-none mb-1.5">Event Subscriptions</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outbound Webhook Endpoints</p>
                   </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-brand text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-accent shadow-xl transition-all"
                >
                   <Plus size={16} /> Add Endpoint
                </button>
             </div>
             
             <div className="divide-y divide-slate-50">
                {loading ? (
                   <div className="p-20 text-center">
                      <RefreshCw className="animate-spin mx-auto text-slate-300 mb-4" size={32} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Endpoints...</p>
                   </div>
                ) : webhooks.length === 0 ? (
                  <div className="p-20 text-center">
                    <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                       <Activity size={40} />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">No active webhooks</h4>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto">
                       Configure endpoints to receive real-time updates for delivery events, exceptions, and POD availability.
                    </p>
                  </div>
                ) : (
                  webhooks.map(wh => (
                    <div key={wh.id} className="p-8 flex items-center justify-between group hover:bg-slate-50/30 transition-all">
                       <div className="flex items-center gap-6">
                          <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 transition-all group-hover:bg-white group-hover:text-brand-accent group-hover:shadow-sm">
                             <Activity size={28} />
                          </div>
                          <div>
                             <p className="text-base font-black text-slate-900 truncate max-w-md mb-2">{wh.url}</p>
                             <div className="flex flex-wrap gap-2">
                                {wh.events.map(e => (
                                  <span key={e} className="text-[8px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest">{e}</span>
                                ))}
                                <Badge variant={wh.isActive ? 'delivered' : 'neutral'} className="scale-75 origin-left">
                                   {wh.isActive ? 'Active' : 'Paused'}
                                </Badge>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="text-right mr-4 hidden sm:block">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Delivery</p>
                             <p className={`text-[10px] font-black ${wh.lastDeliveryStatus === 'SUCCESS' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {wh.lastDeliveryStatus} &bull; {new Date(wh.lastDeliveryAt!).toLocaleTimeString()}
                             </p>
                          </div>
                          <button className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-brand transition-all shadow-sm">
                             <Settings size={18} />
                          </button>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
       </div>
       <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
             <h4 className="text-lg font-black uppercase tracking-tighter mb-4">Webhook Architecture</h4>
             <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed tracking-widest mb-6">
                Our system uses a retry-with-backoff strategy for failed deliveries. All payloads are signed with your secret key for verification.
             </p>
             <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                   <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mb-1">Supported Events</p>
                   <ul className="text-[10px] font-bold text-slate-300 space-y-1">
                      <li>• delivery_note.created</li>
                      <li>• trip.started</li>
                      <li>• trip.delivered</li>
                      <li>• pod.available</li>
                      <li>• exception.raised</li>
                   </ul>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                   <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mb-1">Security</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                      X-Shipstack-Signature header is included in every request. Use your endpoint secret to verify the HMAC-SHA256 signature.
                   </p>
                </div>
             </div>
          </div>
       </div>

       {showAddModal && (
         <div className="fixed inset-0 z-[100] bg-brand/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
               <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg">
                        <LinkIcon size={20} />
                     </div>
                     <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">New Webhook</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Register Outbound Endpoint</p>
                     </div>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-brand transition-all"><X size={24} /></button>
               </div>

               <form onSubmit={handleCreateWebhook} className="p-10 space-y-8">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Endpoint URL</label>
                     <input 
                       type="url" required
                       value={newWebhook.url}
                       onChange={e => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                       placeholder="https://your-api.com/webhooks"
                       className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all"
                     />
                  </div>

                  <div className="space-y-4">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Events to Subscribe</label>
                     <div className="grid grid-cols-1 gap-2">
                        {['delivery_note.created', 'trip.started', 'trip.delivered', 'exception.raised'].map(ev => (
                          <label key={ev} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-brand-accent transition-all">
                             <input 
                               type="checkbox" 
                               checked={newWebhook.events.includes(ev)}
                               onChange={() => toggleEvent(ev)}
                               className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" 
                             />
                             <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{ev}</span>
                          </label>
                        ))}
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
                     <button type="submit" className="flex-[2] bg-brand text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                        Create Webhook
                     </button>
                  </div>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

const ERPConnectorManager = () => {
  const { addNotification } = useAppStore();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [config, setConfig] = useState({
    endpoint: '',
    authStrategy: 'OAUTH2',
    clientId: '',
    clientSecret: '',
    environment: 'SANDBOX'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTesting, setIsTesting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // URL Validation
    if (!config.endpoint) {
      newErrors.endpoint = 'Endpoint URL is required';
    } else {
      try {
        new URL(config.endpoint);
      } catch (e) {
        newErrors.endpoint = 'Invalid URL format (e.g. https://api.example.com)';
      }
    }

    // Auth Validation
    if (config.authStrategy === 'OAUTH2' || config.authStrategy === 'API_KEY') {
      if (!config.clientId) newErrors.clientId = 'Client ID / Key is required';
      if (!config.clientSecret) newErrors.clientSecret = 'Client Secret is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    if (!validate()) {
      addNotification("Validation failed. Please check configuration.", "error");
      return;
    }
    
    setIsTesting(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsTesting(false);
    addNotification(`Handshake with ${config.endpoint} successful.`, "success");
  };

  const providers = [
    { id: 'SAP', name: 'SAP S/4HANA', icon: DatabaseZap, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Enterprise Resource Planning' },
    { id: 'ORACLE', name: 'Oracle NetSuite', icon: DatabaseZap, color: 'text-red-600', bg: 'bg-red-50', desc: 'Cloud Business Suite' },
    { id: 'DYNAMICS', name: 'MS Dynamics 365', icon: DatabaseZap, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Business Applications' },
    { id: 'CUSTOM', name: 'Custom REST API', icon: Code, color: 'text-slate-600', bg: 'bg-slate-50', desc: 'Universal Integration' },
  ];

  return (
    <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {providers.map(p => (
            <div 
              key={p.id} 
              onClick={() => setSelectedProvider(p.id)}
              className={`bg-white rounded-[2rem] border p-8 shadow-sm hover:shadow-xl transition-all group cursor-pointer ${selectedProvider === p.id ? 'border-brand-accent ring-2 ring-brand-accent/10' : 'border-slate-200'}`}
            >
               <div className={`h-14 w-14 ${p.bg} ${p.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                  <p.icon size={28} />
               </div>
               <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{p.name}</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.desc}</p>
               <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[9px] font-black text-brand uppercase">{selectedProvider === p.id ? 'Active' : 'Configure'}</span>
                  <ChevronRight size={14} className={`text-slate-300 transition-transform ${selectedProvider === p.id ? 'rotate-90 text-brand' : ''}`} />
               </div>
            </div>
          ))}
       </div>

       {selectedProvider ? (
         <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-brand text-white rounded-2xl flex items-center justify-center">
                     <DatabaseZap size={24} />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">{providers.find(p => p.id === selectedProvider)?.name} Configuration</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Native Uplink</p>
                  </div>
               </div>
               <button onClick={() => setSelectedProvider(null)} className="text-slate-400 hover:text-brand"><X size={24} /></button>
            </div>
            
            <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Environment</label>
                        <select 
                          value={config.environment}
                          onChange={(e) => setConfig({ ...config, environment: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:border-brand transition-all"
                        >
                           <option value="SANDBOX">Sandbox / Development</option>
                           <option value="PRODUCTION">Production</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Auth Strategy</label>
                        <select 
                          value={config.authStrategy}
                          onChange={(e) => setConfig({ ...config, authStrategy: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:border-brand transition-all"
                        >
                           <option value="OAUTH2">OAuth 2.0 Client Credentials</option>
                           <option value="API_KEY">API Key / Secret</option>
                           <option value="BASIC">Basic Auth</option>
                        </select>
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">API Endpoint URL</label>
                        {errors.endpoint && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">{errors.endpoint}</span>}
                     </div>
                     <input 
                        type="text" 
                        value={config.endpoint}
                        onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                        placeholder="https://api.sap.corp/odata/v2/..."
                        className={`w-full bg-slate-50 border rounded-xl px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all ${errors.endpoint ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-brand'}`}
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Client ID</label>
                           {errors.clientId && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Required</span>}
                        </div>
                        <input 
                          type="text" 
                          value={config.clientId}
                          onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                          className={`w-full bg-slate-50 border rounded-xl px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all ${errors.clientId ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-brand'}`} 
                        />
                     </div>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Secret</label>
                           {errors.clientSecret && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Required</span>}
                        </div>
                        <input 
                          type="password" 
                          value={config.clientSecret}
                          onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                          placeholder="••••••••••••••••" 
                          className={`w-full bg-slate-50 border rounded-xl px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all ${errors.clientSecret ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-brand'}`} 
                        />
                     </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                     <button 
                       onClick={handleTestConnection}
                       disabled={isTesting}
                       className="flex-1 bg-brand text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-brand-accent transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                        {isTesting ? <RefreshCw className="animate-spin" size={16} /> : 'Test Connection'}
                     </button>
                     <button className="flex-1 bg-slate-100 text-slate-900 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest">Save Configuration</button>
                  </div>
               </div>

               <div className="bg-slate-50 rounded-[2rem] p-10 border border-slate-100 flex flex-col justify-between">
                  <div className="space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-accent">
                           <ShieldCheck size={20} />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">Integration Health</h4>
                     </div>
                     
                     <div className="space-y-4">
                        <HealthMetric label="Sync Frequency" value="Every 15 Minutes" />
                        <HealthMetric label="Last Successful Sync" value="Never" />
                        <HealthMetric label="Data Flow" value="Bi-directional" />
                     </div>
                  </div>

                  <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Sync Preview</p>
                     <div className="flex items-center gap-3 text-slate-300">
                        <RefreshCw size={24} />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting first handshake...</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
       ) : (
         <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-12 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
               <div className="h-20 w-20 bg-brand/5 text-brand rounded-3xl flex items-center justify-center mx-auto">
                  <RefreshCw size={40} className="animate-spin-slow" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Automated ERP Synchronization</h3>
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Connect your existing ERP or WMS to automate order ingestion and status updates. Our connectors support bi-directional sync for inventory and delivery reconciliation.
               </p>
               <div className="pt-4">
                  <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-brand transition-all">
                     Request Custom Integration
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

const HealthMetric = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-200/50">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-[10px] font-black text-slate-900 uppercase">{value}</span>
  </div>
);

const IngressWizard = ({ onComplete }: { onComplete: () => void }) => {
  const { addNotification } = useAppStore();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({
    'Reference ID': 'externalId',
    'Customer Name': 'clientName',
    'Delivery Address': 'address',
    'Quantity': 'qty'
  });

  const runTestScenario = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 800));
    setIsProcessing(false);
    setStep(2);
    addNotification("Manifest payload detected. Please verify schema mapping.", "info");
  };

  const proceedToDiagnostic = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1200));
    const testData: ImportPreviewRow[] = [
      { 
        index: 1, 
        data: { externalId: 'DN-2025-001', clientName: 'Nairobi General Hospital', address: 'Upper Hill', qty: 50 }, 
        errors: {}, 
        isValid: true 
      },
      { 
        index: 2, 
        data: { externalId: '', clientName: 'Incomplete Order', address: 'Mombasa Rd', qty: 'NaN' }, 
        errors: { externalId: 'Mandatory Field Missing', qty: 'Value must be numeric' }, 
        isValid: false 
      },
      { 
        index: 3, 
        data: { externalId: 'DN-2025-003', clientName: 'Coast Pharma', address: 'Invalid Geo-Target 404', qty: 12 }, 
        errors: { address: 'Geo-Resolution Failed: Unrecognized Terrain' }, 
        isValid: false 
      }
    ];
    setPreviewRows(testData);
    setIsProcessing(false);
    setStep(3);
    addNotification("Diagnostic scan complete. Anomalies detected.", "info");
  };

  const finalizeIngress = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    // Commit only valid rows
    const validData = previewRows.filter(r => r.isValid).map(r => r.data);
    await api.processImport(validData);
    setIsProcessing(false);
    setStep(4);
    onComplete();
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-12 min-h-[500px] flex flex-col transition-all">
       {step === 1 && (
         <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in zoom-in-95">
            <div className="h-32 w-32 bg-slate-50 text-slate-300 rounded-[3rem] flex items-center justify-center border border-slate-100 group shadow-inner">
               <DatabaseZap size={64} className="group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="max-w-xl space-y-4">
               <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Manifest Ingestion Terminal</h3>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Bulk load manifest payloads. Our diagnostic engine performs real-time schema and geo-validation before grid commitment.
               </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-5 w-full max-w-2xl">
               <button onClick={runTestScenario} className="flex-1 bg-brand text-white py-6 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                  {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <><Wand2 size={18} /> Simulate Ingestion</>}
               </button>
               <button 
                 onClick={() => api.resetData()}
                 className="flex-1 bg-emerald-500 text-white py-6 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
               >
                  <RefreshCw size={18} /> Seed System Data
               </button>
               <button className="flex-1 bg-white border-2 border-slate-100 text-slate-900 py-6 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-brand-accent transition-all">
                  <Upload size={18} className="mr-2 inline" /> Upload Manifest
               </button>
            </div>
         </div>
       )}

       {step === 2 && (
         <div className="space-y-10 animate-in slide-in-from-right-8">
            <div className="flex justify-between items-end border-b border-slate-100 pb-6">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                    <Code size={24} className="text-brand-accent" /> Schema Mapping
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    Align Spreadsheet Columns with Logistics Grid Fields
                  </p>
               </div>
               <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 tracking-widest flex items-center gap-2">
                 <X size={16} /> Reset
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  {Object.entries(mappings).map(([source, target]) => (
                    <div key={source} className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-brand-accent transition-all">
                       <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Column</p>
                          <p className="text-xs font-black text-slate-900 uppercase">{source}</p>
                       </div>
                       <ChevronRight size={16} className="text-slate-300" />
                       <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Grid Field</p>
                          <select 
                            value={target}
                            onChange={(e) => setMappings(prev => ({ ...prev, [source]: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold text-brand outline-none focus:ring-1 focus:ring-brand/20"
                          >
                             <option value="externalId">Reference ID</option>
                             <option value="clientName">Consignee Name</option>
                             <option value="address">Destination Address</option>
                             <option value="qty">Quantity</option>
                             <option value="weight">Weight (KG)</option>
                          </select>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 flex flex-col justify-between shadow-2xl">
                  <div className="space-y-4">
                     <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <ShieldCheck size={24} className="text-brand-accent" />
                     </div>
                     <h4 className="text-xl font-black uppercase tracking-tighter">Mapping Intelligence</h4>
                     <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed tracking-widest">
                        Our engine has auto-detected 4 potential matches. You can manually override these mappings or save this configuration for future manifests from this source.
                     </p>
                  </div>

                  <div className="space-y-4">
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="h-6 w-6 rounded-lg border-2 border-white/20 flex items-center justify-center group-hover:border-brand-accent transition-all">
                           <Check size={14} className="text-brand-accent" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Save this mapping profile</span>
                     </label>
                     <button 
                        onClick={proceedToDiagnostic}
                        className="w-full bg-brand-accent text-white py-6 rounded-3xl text-[12px] font-black uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                     >
                        {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : 'Run Diagnostics'}
                     </button>
                  </div>
               </div>
            </div>
         </div>
       )}

       {step === 3 && (
         <div className="space-y-10 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-end border-b border-slate-100 pb-6">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                    <FileSearch size={24} className="text-brand-accent" /> Payload Diagnostic Review
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    Found {previewRows.filter(r => !r.isValid).length} Operational Blockers in Payload
                  </p>
               </div>
               <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 tracking-widest flex items-center gap-2">
                 <X size={16} /> Abort Ingress
               </button>
            </div>
            
            <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-inner">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead className="bg-white border-b border-slate-200">
                        <tr>
                           <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Row ID</th>
                           <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">External Reference</th>
                           <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Validation Status</th>
                           <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Log</th>
                           <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {previewRows.map((row) => (
                           <tr key={row.index} className={row.isValid ? 'bg-white hover:bg-slate-50' : 'bg-red-50/30'}>
                              <td className="px-8 py-6 text-[10px] font-mono text-slate-400">00{row.index}</td>
                              <td className="px-8 py-6">
                                 <p className={`text-xs font-black uppercase ${row.errors.externalId ? 'text-red-600' : 'text-slate-900'}`}>
                                   {row.data.externalId || '[MISSING ID]'}
                                 </p>
                                 <p className="text-[9px] font-bold text-slate-400 mt-0.5">{row.data.clientName}</p>
                              </td>
                              <td className="px-8 py-6">
                                 {row.isValid ? (
                                   <Badge variant="delivered"><Check size={10} className="mr-1" /> Ready</Badge>
                                 ) : (
                                   <Badge variant="failed"><AlertCircle size={10} className="mr-1" /> Blocker</Badge>
                                 )}
                              </td>
                              <td className="px-8 py-6">
                                 {Object.values(row.errors).length > 0 ? (
                                   <div className="space-y-1">
                                      {Object.entries(row.errors).map(([key, err]) => (
                                        <p key={key} className="text-[9px] font-black text-red-500 uppercase tracking-tight">
                                          &bull; {key}: {err}
                                        </p>
                                      ))}
                                   </div>
                                 ) : (
                                   <span className="text-[10px] font-bold text-emerald-600 uppercase">Schema Verified</span>
                                 )}
                              </td>
                              <td className="px-8 py-6 text-right">
                                 {row.isValid ? (
                                   <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ml-auto">
                                      <CheckCircle2 size={16} />
                                   </div>
                                 ) : (
                                   <button className="px-4 py-2 bg-white border border-red-100 text-red-500 rounded-xl text-[9px] font-black uppercase hover:bg-red-50 transition-all">
                                      Fix Row
                                   </button>
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
               <div className="flex-1 p-8 bg-blue-50 border border-blue-100 rounded-[2rem] flex gap-5 items-center">
                  <Activity size={28} className="text-brand-accent shrink-0" />
                  <div>
                    <p className="text-[11px] font-black text-brand uppercase mb-1">Operational Rule</p>
                    <p className="text-[10px] font-bold text-blue-800/60 uppercase leading-relaxed tracking-tight">
                       Committing this payload will only manifest the <span className="text-emerald-600">Verified Rows</span>. Blocked rows must be resolved or will be discarded from the batch.
                    </p>
                  </div>
               </div>
               <button 
                onClick={finalizeIngress} 
                disabled={isProcessing}
                className="md:w-72 bg-brand text-white py-6 rounded-3xl text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                  {isProcessing ? <RefreshCw className="animate-spin" size={24} /> : 'Authorize Commitment'}
               </button>
            </div>
         </div>
       )}

       {step === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in zoom-in-95 duration-700">
             <div className="h-32 w-32 bg-emerald-50 text-emerald-500 rounded-[3.5rem] flex items-center justify-center shadow-inner border border-emerald-100">
                <ShieldCheck size={64} strokeWidth={3} />
             </div>
             <div className="text-center space-y-4">
                <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Manifest committed</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Payload has been synchronized with the Logistics Grid.</p>
             </div>
             <button onClick={() => setStep(1)} className="bg-slate-900 text-white px-16 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl">Return to Terminal</button>
          </div>
       )}
    </div>
  );
};

const APIGateway = ({ keys, onUpdate }: { keys: APIKey[], onUpdate: () => void }) => {
  const { addNotification } = useAppStore();
  const { user } = useAuthStore();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['dn.read']);
  const [error, setError] = useState('');
  const [revokingKey, setRevokingKey] = useState<APIKey | null>(null);

  const availableScopes = [
    { id: 'dn.read', label: 'Read Delivery Notes', description: 'Access to view delivery notes and status' },
    { id: 'dn.write', label: 'Write Delivery Notes', description: 'Permission to create and update delivery notes' },
    { id: 'trip.read', label: 'Read Trips', description: 'Access to view trip details and telemetry' },
    { id: 'inventory.read', label: 'Read Inventory', description: 'Access to view stock levels' },
    { id: 'inventory.write', label: 'Write Inventory', description: 'Permission to adjust stock levels' },
  ];

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) {
      setError('Identifier is required');
      return;
    }
    if (newKeyName.length < 3) {
      setError('Identifier must be at least 3 characters');
      return;
    }

    try {
      await api.createAPIKey(newKeyName, selectedScopes, newKeyDescription);
      addNotification("New integration token manifested.", "success");
      setNewKeyName('');
      setNewKeyDescription('');
      setSelectedScopes(['dn.read']);
      setError('');
      setShowKeyModal(false);
      onUpdate();
    } catch (err) {
      addNotification("Token generation failed.", "error");
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    addNotification("API Key copied to clipboard.", "success");
  };

  const handleRevokeKey = async () => {
    if (!revokingKey) return;
    
    if (user?.role !== 'ADMIN') {
      addNotification("Unauthorized: Only administrators can revoke keys.", "error");
      setRevokingKey(null);
      return;
    }

    try {
      await api.revokeAPIKey(revokingKey.id);
      addNotification(`Access revoked for ${revokingKey.name}.`, "success");
      setRevokingKey(null);
      onUpdate();
    } catch (err) {
      addNotification("Revocation failed.", "error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-right-8 duration-500">
       <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Key size={24} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-none mb-1.5">Bearer Authentication</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Integration Tokens</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="hidden md:flex flex-col items-end mr-4">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Ingestion Endpoint</p>
                      <code className="text-[10px] font-mono font-bold text-brand bg-brand/5 px-2 py-1 rounded">POST /api/ingest</code>
                   </div>
                   <button 
                     onClick={() => setShowKeyModal(true)}
                     className="bg-brand text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-accent shadow-xl transition-all"
                   >
                      <Plus size={16} /> New Token
                   </button>
                </div>
              </div>
             <div className="divide-y divide-slate-50">
                {keys.map(k => (
                  <div key={k.id} className="p-8 flex items-center justify-between group hover:bg-slate-50/30 transition-all">
                     <div className="flex items-center gap-6">
                        <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 transition-all group-hover:bg-white group-hover:text-brand-accent group-hover:shadow-sm">
                           <Terminal size={28} />
                        </div>
                        <div>
                           <p className="text-base font-black text-slate-900 uppercase leading-none mb-2">{k.name}</p>
                           {k.description && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{k.description}</p>}
                           <div className="flex items-center gap-4">
                              <Badge variant="dispatched" className="scale-90 origin-left">{k.status}</Badge>
                              <code className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded uppercase">{k.key.substring(0, 12)}••••••••</code>
                              {k.scopes && k.scopes.length > 0 && (
                                <div className="flex gap-1">
                                  {k.scopes.map(s => (
                                    <span key={s} className="text-[8px] font-black text-brand bg-brand/5 px-1.5 py-0.5 rounded uppercase tracking-tighter">{s}</span>
                                  ))}
                                </div>
                              )}
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleCopyKey(k.key)}
                          className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-brand hover:border-brand transition-all shadow-sm" 
                          title="Copy Key"
                        >
                           <Copy size={18} />
                        </button>
                        <button 
                          onClick={() => setRevokingKey(k)}
                          disabled={k.status === 'REVOKED'}
                          className={`p-3 bg-white border border-slate-200 rounded-xl transition-all shadow-sm ${k.status === 'REVOKED' ? 'opacity-50 cursor-not-allowed' : 'text-slate-400 hover:text-red-500 hover:border-red-500'}`} 
                          title="Revoke Access"
                        >
                           <Trash2 size={18} />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
       </div>

       {showKeyModal && (
        <div className="fixed inset-0 z-[100] bg-brand/40 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg">
                       <Key size={20} />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Gateway Token</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Generate Integration Secret</p>
                    </div>
                 </div>
                 <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-brand transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={handleGenerateKey} className="p-10 space-y-6">
                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Token Identifier (Internal)</label>
                       {error && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">{error}</span>}
                    </div>
                    <input 
                      type="text" required
                      autoFocus
                      value={newKeyName}
                      onChange={e => { setNewKeyName(e.target.value); if(error) setError(''); }}
                      placeholder="e.g. SAP Principal Uplink"
                      className={`w-full bg-white border-2 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 outline-none transition-all ${error ? 'border-red-500' : 'border-slate-100 focus:border-brand-accent'}`}
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Description (Optional)</label>
                    <textarea 
                      value={newKeyDescription}
                      onChange={e => setNewKeyDescription(e.target.value)}
                      placeholder="What is this token for?"
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-brand-accent transition-all resize-none h-24"
                    />
                 </div>

                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Authorized Scopes</label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                       {availableScopes.map(scope => (
                         <label key={scope.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all">
                            <input 
                              type="checkbox"
                              checked={selectedScopes.includes(scope.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedScopes([...selectedScopes, scope.id]);
                                } else {
                                  setSelectedScopes(selectedScopes.filter(s => s !== scope.id));
                                }
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                            />
                            <div>
                               <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{scope.label}</p>
                               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{scope.description}</p>
                            </div>
                         </label>
                       ))}
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowKeyModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
                    <button 
                      type="submit" 
                      className="flex-[2] bg-brand text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                       Manifest Secret
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {revokingKey && (
        <div className="fixed inset-0 z-[100] bg-brand/40 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 bg-red-50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                       <AlertTriangle size={20} />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-red-900">Revoke Access</h3>
                       <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Security Authorization Required</p>
                    </div>
                 </div>
                 <button onClick={() => setRevokingKey(null)} className="text-slate-400 hover:text-red-500 transition-all"><X size={24} /></button>
              </div>

              <div className="p-10 space-y-8 text-center">
                 <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-600">
                       Are you sure you want to revoke access for <span className="text-slate-900 font-black">"{revokingKey.name}"</span>?
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                       This action is irreversible. All systems using this token will immediately lose access to the Logistics Grid.
                    </p>
                 </div>

                 <div className="flex gap-4">
                    <button onClick={() => setRevokingKey(null)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
                    <button 
                      onClick={handleRevokeKey}
                      className="flex-[2] bg-red-500 text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                       Revoke Token
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DataIngress;
