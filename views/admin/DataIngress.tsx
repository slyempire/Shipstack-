
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { APIKey, ImportLog, ImportPreviewRow, WebhookSubscription, ERPConnector, SyncLog } from '../../types';
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
  Settings,
  FileJson,
  Table
} from 'lucide-react';
import Papa from 'papaparse';

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
    <Layout title="Data Ingress & Pipeline Gateway">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex p-1 bg-slate-200/50 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            <button 
              onClick={() => setActiveTab('PIPELINE')}
              className={`px-6 py-2.5 rounded-lg label-logistics !mb-0 transition-all whitespace-nowrap ${activeTab === 'PIPELINE' ? 'bg-white text-brand shadow-md' : 'text-slate-500'}`}
            >
              Pipeline
            </button>
            <button 
              onClick={() => setActiveTab('API')}
              className={`px-6 py-2.5 rounded-lg label-logistics !mb-0 transition-all whitespace-nowrap ${activeTab === 'API' ? 'bg-white text-brand shadow-md' : 'text-slate-500'}`}
            >
              API Gateway
            </button>
            <button 
              onClick={() => setActiveTab('WEBHOOKS')}
              className={`px-6 py-2.5 rounded-lg label-logistics !mb-0 transition-all whitespace-nowrap ${activeTab === 'WEBHOOKS' ? 'bg-white text-brand shadow-md' : 'text-slate-500'}`}
            >
              Webhooks
            </button>
            <button 
              onClick={() => setActiveTab('ERP')}
              className={`px-6 py-2.5 rounded-lg label-logistics !mb-0 transition-all whitespace-nowrap ${activeTab === 'ERP' ? 'bg-white text-brand shadow-md' : 'text-slate-500'}`}
            >
              ERP Connectors
            </button>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="label-logistics text-emerald-600 !mb-0 leading-none">Gateway Stable</span>
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
                             <p className="body-value truncate-name max-w-md mb-2">{wh.url}</p>
                             <div className="flex flex-wrap gap-2">
                                {wh.events.map(e => (
                                  <span key={e} className="label-logistics text-slate-400 bg-slate-100 px-2 py-0.5 rounded !mb-0">{e}</span>
                                ))}
                                <Badge variant={wh.isActive ? 'delivered' : 'neutral'} className="scale-75 origin-left">
                                   {wh.isActive ? 'Active' : 'Paused'}
                                </Badge>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="text-right mr-4 hidden sm:block">
                             <p className="label-logistics text-slate-400 mb-1">Last Delivery</p>
                             <p className={`body-value ${wh.lastDeliveryStatus === 'SUCCESS' ? 'text-emerald-500' : 'text-red-500'}`}>
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
  const [connectors, setConnectors] = useState<ERPConnector[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConnector, setSelectedConnector] = useState<ERPConnector | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'CONFIG' | 'MAPPING' | 'LOGS'>('CONFIG');

  const [formData, setFormData] = useState<Partial<ERPConnector>>({
    name: '',
    provider: 'SAP',
    environment: 'SANDBOX',
    syncFrequency: 'MANUAL',
    entities: [],
    config: { endpoint: '', authType: 'OAUTH2' },
    mapping: {}
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, lData] = await Promise.all([api.getConnectors(), api.getSyncLogs()]);
      setConnectors(cData);
      setSyncLogs(lData);
    } catch (err) {
      addNotification("Failed to load ERP data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      name: '',
      provider: 'SAP',
      environment: 'SANDBOX',
      syncFrequency: 'MANUAL',
      entities: [],
      config: { endpoint: '', authType: 'OAUTH2' },
      mapping: {
        'external_id': 'id',
        'customer_name': 'name',
        'delivery_address': 'address',
        'quantity': 'qty'
      }
    });
    setIsEditing(true);
    setSelectedConnector(null);
    setActiveSubTab('CONFIG');
  };

  const handleEdit = (connector: ERPConnector) => {
    setFormData({ ...connector });
    setSelectedConnector(connector);
    setIsEditing(true);
    setActiveSubTab('CONFIG');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.config?.endpoint) {
      addNotification("Name and Endpoint are required", "error");
      return;
    }

    try {
      if (selectedConnector) {
        await api.updateConnector(selectedConnector.id, formData);
        addNotification("Connector updated successfully", "success");
      } else {
        await api.createConnector(formData);
        addNotification("New connector manifested", "success");
      }
      setIsEditing(false);
      loadData();
    } catch (err) {
      addNotification("Failed to save connector", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to decommission this uplink?")) return;
    try {
      await api.deleteConnector(id);
      addNotification("Connector decommissioned", "success");
      loadData();
    } catch (err) {
      addNotification("Failed to delete connector", "error");
    }
  };

  const handleTriggerSync = async (id: string) => {
    setIsSyncing(id);
    try {
      await api.triggerSync(id);
      addNotification("Synchronization cycle initiated", "success");
      loadData();
    } catch (err) {
      addNotification("Sync failed", "error");
    } finally {
      setIsSyncing(null);
    }
  };

  const providers = [
    { id: 'SAP', name: 'SAP S/4HANA', icon: DatabaseZap, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'ORACLE', name: 'Oracle NetSuite', icon: DatabaseZap, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'DYNAMICS', name: 'MS Dynamics 365', icon: DatabaseZap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'ODOO', name: 'Odoo ERP', icon: DatabaseZap, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'CUSTOM', name: 'Custom REST', icon: Code, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  if (isEditing) {
    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsEditing(false)} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand transition-all">
              <X size={20} />
            </button>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {selectedConnector ? `Edit ${selectedConnector.name}` : 'New ERP Connector'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Native Uplink Configuration</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsEditing(false)} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
            <button onClick={handleSave} className="bg-brand text-white px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-brand-accent transition-all">
              Save Configuration
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100">
            {(['CONFIG', 'MAPPING', 'LOGS'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-10 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeSubTab === tab ? 'border-brand text-brand bg-slate-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-12">
            {activeSubTab === 'CONFIG' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Connector Identity</label>
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Global SAP Production"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-brand transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Provider</label>
                      <select 
                        value={formData.provider}
                        onChange={e => setFormData({ ...formData, provider: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:border-brand"
                      >
                        {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Environment</label>
                      <select 
                        value={formData.environment}
                        onChange={e => setFormData({ ...formData, environment: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:border-brand"
                      >
                        <option value="SANDBOX">Sandbox</option>
                        <option value="PRODUCTION">Production</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Endpoint</label>
                    <input 
                      type="url"
                      value={formData.config?.endpoint}
                      onChange={e => setFormData({ ...formData, config: { ...formData.config!, endpoint: e.target.value } })}
                      placeholder="https://api.sap.corp/odata/v2"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-brand transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Auth Type</label>
                      <select 
                        value={formData.config?.authType}
                        onChange={e => setFormData({ ...formData, config: { ...formData.config!, authType: e.target.value as any } })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:border-brand"
                      >
                        <option value="OAUTH2">OAuth 2.0</option>
                        <option value="API_KEY">API Key</option>
                        <option value="BASIC">Basic Auth</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sync Frequency</label>
                      <select 
                        value={formData.syncFrequency}
                        onChange={e => setFormData({ ...formData, syncFrequency: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:border-brand"
                      >
                        <option value="MANUAL">Manual Only</option>
                        <option value="15M">Every 15 Minutes</option>
                        <option value="1H">Every Hour</option>
                        <option value="DAILY">Daily at Midnight</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entities to Synchronize</label>
                    <div className="grid grid-cols-2 gap-4">
                      {(['INVENTORY', 'ORDERS', 'DELIVERIES', 'CLIENTS'] as const).map(entity => (
                        <label key={entity} className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${formData.entities?.includes(entity) ? 'bg-brand/5 border-brand text-brand' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                          <input 
                            type="checkbox"
                            className="hidden"
                            checked={formData.entities?.includes(entity)}
                            onChange={e => {
                              const current = formData.entities || [];
                              setFormData({
                                ...formData,
                                entities: e.target.checked ? [...current, entity] : current.filter(en => en !== entity)
                              });
                            }}
                          />
                          <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.entities?.includes(entity) ? 'bg-brand border-brand text-white' : 'bg-white border-slate-200'}`}>
                            {formData.entities?.includes(entity) && <Check size={14} />}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">{entity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <ShieldCheck size={20} className="text-brand-accent" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-tight">Security & Compliance</h4>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-6">
                      All credentials are encrypted using AES-256-GCM before storage. Shipstack never stores your ERP passwords in plain text.
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                        <span className="text-slate-500">IP Whitelisting</span>
                        <span className="text-emerald-500">Required</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                        <span className="text-slate-500">TLS Version</span>
                        <span className="text-slate-300">1.3 Minimum</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'MAPPING' && (
              <div className="space-y-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-1">Field Schema Mapping</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Map ERP source fields to Shipstack internal ledger</p>
                  </div>
                  <button className="bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                    Auto-Detect Schema
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Object.entries(formData.mapping || {}).map(([internal, external]) => (
                    <div key={internal} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-8">
                      <div className="flex-1 space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Shipstack Field</label>
                        <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 text-[10px] font-black text-brand uppercase tracking-widest">
                          {internal.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="text-slate-300">
                        <ChevronRight size={24} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ERP Source Field</label>
                        <input 
                          type="text"
                          value={external as string}
                          onChange={e => setFormData({
                            ...formData,
                            mapping: { ...formData.mapping, [internal]: e.target.value }
                          })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[10px] font-black text-slate-900 uppercase tracking-widest outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === 'LOGS' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Synchronization History</h4>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
                      <p className="text-lg font-black text-slate-900 leading-none">1,240</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Success Rate</p>
                      <p className="text-lg font-black text-emerald-500 leading-none">98.2%</p>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Entity</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Processed</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {syncLogs.filter(l => l.connectorId === selectedConnector?.id).map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-4 text-[10px] font-bold text-slate-600">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="px-8 py-4">
                            <span className="text-[9px] font-black text-slate-900 bg-slate-100 px-2 py-1 rounded uppercase tracking-widest">{log.entity}</span>
                          </td>
                          <td className="px-8 py-4">
                            <Badge variant={log.status === 'SUCCESS' ? 'delivered' : log.status === 'PARTIAL' ? 'dispatched' : 'neutral'}>
                              {log.status}
                            </Badge>
                          </td>
                          <td className="px-8 py-4 text-[10px] font-black text-slate-900">{log.recordsProcessed} items</td>
                          <td className="px-8 py-4 text-[10px] font-bold text-slate-400">{log.durationMs}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">ERP Connectors</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Automated Enterprise Data Synchronization</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="bg-brand text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-accent shadow-xl transition-all"
        >
          <Plus size={16} /> Add Connector
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-200">
              <RefreshCw className="animate-spin mx-auto text-slate-300 mb-4" size={32} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Uplinks...</p>
            </div>
          ) : connectors.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-200">
              <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                <DatabaseZap size={40} />
              </div>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">No Active Connectors</h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto mb-8">
                Connect your SAP, Oracle, or Odoo instance to automate order ingestion and inventory reconciliation.
              </p>
              <button onClick={handleCreateNew} className="bg-brand text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                Configure First Uplink
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {connectors.map(c => {
                const provider = providers.find(p => p.id === c.provider) || providers[4];
                return (
                  <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className={`h-16 w-16 ${provider.bg} ${provider.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                          <provider.icon size={32} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter">{c.name}</h4>
                            <Badge variant={c.status === 'CONNECTED' ? 'delivered' : c.status === 'DISCONNECTED' ? 'neutral' : 'dispatched'}>
                              {c.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{provider.name} &bull; {c.environment}</p>
                            <span className="h-1 w-1 rounded-full bg-slate-200" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sync: {c.syncFrequency}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleTriggerSync(c.id)}
                          disabled={isSyncing === c.id}
                          className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-brand hover:bg-brand/5 transition-all disabled:opacity-50"
                          title="Sync Now"
                        >
                          <RefreshCw size={20} className={isSyncing === c.id ? 'animate-spin' : ''} />
                        </button>
                        <button 
                          onClick={() => handleEdit(c)}
                          className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-brand hover:bg-brand/5 transition-all"
                          title="Configure"
                        >
                          <Settings size={20} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Decommission"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-50 flex justify-between items-center">
                      <div className="flex gap-2">
                        {c.entities.map(e => (
                          <span key={e} className="text-[8px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded uppercase tracking-widest border border-slate-100">{e}</span>
                        ))}
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Handshake</p>
                        <p className="text-[10px] font-black text-slate-900 uppercase">
                          {c.lastSync ? new Date(c.lastSync).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
            <h4 className="text-lg font-black uppercase tracking-tighter mb-4">Uplink Architecture</h4>
            <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed tracking-widest mb-8">
              Shipstack Connectors provide a secure, bi-directional bridge between your enterprise core and our logistics ledger.
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} className="text-brand-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">End-to-End Encryption</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">Mutual TLS and AES-256 encryption for all data in transit and at rest.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Activity size={16} className="text-brand-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">Real-time Reconciliation</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">Automatic inventory adjustments and order status updates back to ERP.</p>
                </div>
              </div>
            </div>
            <div className="mt-10 pt-10 border-t border-white/10">
              <button
                onClick={() => {
                  const doc = [
                    '# Shipstack API SDK — Quick Reference',
                    '',
                    '## Authentication',
                    'All requests require an API key in the Authorization header:',
                    '  Authorization: Bearer SS_PUB_<your-key>',
                    '',
                    '## Endpoints',
                    'POST /api/dn          — Create delivery note',
                    'GET  /api/dn/:id      — Get delivery note',
                    'PUT  /api/dn/:id/status — Update delivery status',
                    'POST /api/telemetry    — Submit driver telemetry',
                    '',
                    '## Webhook Events',
                    'dn.created | dn.status_changed | dn.delivered | telemetry.ping',
                    '',
                    '## Request Signing',
                    'Compute HMAC-SHA256 of the JSON body using your webhook secret.',
                    'Include as header: X-Shipstack-Signature: <hex-digest>',
                    '',
                    '## Rate Limits',
                    '100 req/min per API key. 429 returned when exceeded.',
                  ].join('\n');
                  const blob = new Blob([doc], { type: 'text/plain;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'shipstack-sdk-docs.txt';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-brand-accent transition-all">
                Download SDK Docs
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Recent Anomalies</h4>
            <div className="space-y-4">
              {syncLogs.filter(l => l.status === 'FAILED' || l.status === 'PARTIAL').slice(0, 3).map(log => (
                <div key={log.id} className="p-4 bg-red-50 rounded-2xl border border-red-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">{log.entity} Sync</span>
                    <span className="text-[8px] font-bold text-red-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[10px] font-bold text-red-700 leading-tight">{log.errors?.[0] || 'Unknown Error'}</p>
                </div>
              ))}
              {syncLogs.filter(l => l.status === 'FAILED' || l.status === 'PARTIAL').length === 0 && (
                <div className="py-10 text-center">
                  <CheckCircle2 size={32} className="text-emerald-200 mx-auto mb-3" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No anomalies detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
  const [rawFileContent, setRawFileContent] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'CSV' | 'JSON' | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({
    'externalId': '',
    'clientName': '',
    'address': '',
    'qty': ''
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      if (file.name.endsWith('.json')) {
        try {
          const json = JSON.parse(content);
          const data = Array.isArray(json) ? json : [json];
          setRawFileContent(data);
          setFileType('JSON');
          autoMap(data[0]);
          setStep(2);
          addNotification("JSON payload detected. Please verify schema mapping.", "info");
        } catch (err) {
          addNotification("Invalid JSON format", "error");
        }
      } else if (file.name.endsWith('.csv')) {
        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setRawFileContent(results.data as any[]);
            setFileType('CSV');
            autoMap(results.data[0]);
            setStep(2);
            addNotification("CSV manifest detected. Please verify schema mapping.", "info");
          },
          error: () => {
            addNotification("Failed to parse CSV", "error");
          }
        });
      } else {
        addNotification("Unsupported file format. Use CSV or JSON.", "error");
      }
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const autoMap = (firstRow: any) => {
    if (!firstRow) return;
    const keys = Object.keys(firstRow);
    const newMappings = { ...mappings };
    
    const findMatch = (target: string, options: string[]) => {
      return options.find(opt => 
        opt.toLowerCase().includes(target.toLowerCase()) || 
        target.toLowerCase().includes(opt.toLowerCase())
      );
    };

    if (findMatch('externalId', keys)) newMappings.externalId = findMatch('externalId', keys)!;
    if (findMatch('clientName', keys)) newMappings.clientName = findMatch('clientName', keys)!;
    if (findMatch('address', keys)) newMappings.address = findMatch('address', keys)!;
    if (findMatch('qty', keys)) newMappings.qty = findMatch('qty', keys)!;

    setMappings(newMappings);
  };

  const proceedToDiagnostic = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1200));

    const mappedData: ImportPreviewRow[] = rawFileContent.map((row, index) => {
      const data: Record<string, any> = {};
      Object.entries(mappings).forEach(([internal, source]) => {
        if (source) data[internal] = row[source];
      });

      const errors: Record<string, string> = {};
      if (!data.externalId) errors.externalId = 'Reference ID is required';
      if (!data.clientName) errors.clientName = 'Client Name is required';
      if (!data.address) errors.address = 'Address is required';
      
      if (data.address && data.address.toLowerCase().includes('invalid')) {
        errors.address = 'Geo-Resolution Failed: Unrecognized Terrain';
      }

      return {
        id: `ipr-${index}`,
        index: index + 1,
        data,
        errors,
        isValid: Object.keys(errors).length === 0
      };
    });

    setPreviewRows(mappedData);
    setIsProcessing(false);
    setStep(3);
    addNotification("Diagnostic scan complete. Anomalies detected.", "info");
  };

  const finalizeIngress = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    const validData = previewRows.filter(r => r.isValid).map(r => r.data);
    await api.processImport(validData);
    setIsProcessing(false);
    setStep(4);
    addNotification("Data ingress successful. Records manifested.", "success");
    onComplete();
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
       <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-6">
             <div className="h-14 w-14 bg-brand rounded-2xl flex items-center justify-center text-white shadow-xl">
                <DatabaseZap size={28} />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Ingress Wizard</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Multi-Step Data Manifesting</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             {[1, 2, 3, 4].map(s => (
               <div key={s} className={`h-2.5 w-2.5 rounded-full transition-all ${step >= s ? 'bg-brand scale-125' : 'bg-slate-200'}`} />
             ))}
          </div>
       </div>

       <div className="p-12">
          {step === 1 && (
            <div className="max-w-xl mx-auto text-center space-y-8 py-10">
               <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto border-2 border-dashed border-slate-200 group hover:border-brand transition-all relative overflow-hidden">
                  <Upload size={40} className="group-hover:scale-110 transition-transform" />
                  <input 
                    type="file" 
                    accept=".csv,.json" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
               </div>
               <div>
                  <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Upload Manifest</h4>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                     Drag and drop your CSV or JSON file here. Our parser will automatically detect the schema and prepare for mapping.
                  </p>
               </div>
               <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                     <FileText size={14} className="text-slate-400" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">CSV Support</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                     <FileJson size={14} className="text-slate-400" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">JSON Support</span>
                  </div>
               </div>
               {isProcessing && (
                 <div className="flex items-center justify-center gap-3 text-brand">
                    <RefreshCw size={18} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Analyzing Payload...</span>
                 </div>
               )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 animate-in slide-in-from-bottom-4">
               <div className="flex justify-between items-end">
                  <div>
                     <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">Schema Mapping</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Align source columns with Shipstack fields</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                     <Wand2 size={14} />
                     <span className="text-[9px] font-black uppercase tracking-widest">Auto-mapped {Object.values(mappings).filter(Boolean).length}/4 fields</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Object.keys(mappings).map(field => (
                    <div key={field} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                       <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{field.replace(/([A-Z])/g, ' $1')}</label>
                          <Badge variant="neutral" className="scale-75">Required</Badge>
                       </div>
                       <select 
                         value={mappings[field]}
                         onChange={(e) => setMappings({ ...mappings, [field]: e.target.value })}
                         className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-brand"
                       >
                          <option value="">Select Source Column</option>
                          {rawFileContent[0] && Object.keys(rawFileContent[0]).map(k => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                       </select>
                    </div>
                  ))}
               </div>

               <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                  <button onClick={() => setStep(1)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all">Back to Upload</button>
                  <button 
                    onClick={proceedToDiagnostic}
                    disabled={isProcessing}
                    className="bg-brand text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-brand-accent transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                     {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <FileSearch size={16} />}
                     Run Diagnostics
                  </button>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
               <div className="flex justify-between items-end">
                  <div>
                     <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">Diagnostic Results</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validation & Geo-Resolution Check</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valid Rows</p>
                        <p className="text-lg font-black text-emerald-500 leading-none">{previewRows.filter(r => r.isValid).length}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Anomalies</p>
                        <p className="text-lg font-black text-red-500 leading-none">{previewRows.filter(r => !r.isValid).length}</p>
                     </div>
                  </div>
               </div>

               <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                           <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Row</th>
                           <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                           <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                           <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                           <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnostics</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {previewRows.slice(0, 5).map(row => (
                          <tr key={row.index} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-6 py-4 text-[10px] font-bold text-slate-400">#{row.index}</td>
                             <td className="px-6 py-4">
                                <span className={`text-[10px] font-black uppercase ${row.errors.externalId ? 'text-red-500' : 'text-slate-900'}`}>
                                   {row.data.externalId || 'MISSING'}
                                </span>
                             </td>
                             <td className="px-6 py-4">
                                <p className={`text-[10px] font-black uppercase ${row.errors.clientName ? 'text-red-500' : 'text-slate-900'}`}>{row.data.clientName}</p>
                             </td>
                             <td className="px-6 py-4">
                                <div className={`h-2 w-2 rounded-full ${row.isValid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                             </td>
                             <td className="px-6 py-4">
                                {row.isValid ? (
                                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                     <Check size={12} /> Ready
                                  </span>
                                ) : (
                                  <div className="space-y-1">
                                     {Object.values(row.errors).map((err, i) => (
                                       <p key={i} className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                                          <AlertCircle size={10} /> {err as string}
                                       </p>
                                     ))}
                                  </div>
                                )}
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
                  {previewRows.length > 5 && (
                    <div className="p-4 bg-slate-50/50 text-center border-t border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">And {previewRows.length - 5} more records...</p>
                    </div>
                  )}
               </div>

               <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                  <button onClick={() => setStep(2)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all">Back to Mapping</button>
                  <button 
                    onClick={finalizeIngress}
                    disabled={isProcessing || previewRows.filter(r => r.isValid).length === 0}
                    className="bg-brand text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-brand-accent transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                     {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                     Commit {previewRows.filter(r => r.isValid).length} Records
                  </button>
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-xl mx-auto text-center space-y-8 py-10 animate-in zoom-in-95">
               <div className="h-24 w-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 size={48} />
               </div>
               <div>
                  <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Ingress Complete</h4>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                     Your manifest has been successfully committed to the Shipstack ledger. All valid records are now available in the dispatch queue.
                  </p>
               </div>
               <div className="pt-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-brand transition-all"
                  >
                     Start New Ingress
                  </button>
               </div>
            </div>
          )}
       </div>
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
