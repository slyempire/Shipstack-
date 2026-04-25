
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Pagination } from '../../components/Pagination';
import { api } from '../../api';
import { Vehicle, Facility, VehicleType, MaintenanceLog, FuelLog, User } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import { useAppStore, useAuthStore } from '../../store';
import RoleGuard from '../../components/RoleGuard';
import { 
  Truck, 
  Warehouse, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  Zap,
  X,
  Camera,
  RotateCw,
  Box,
  Eye,
  History,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Fuel,
  Calendar,
  Gauge,
  Droplets
} from 'lucide-react';

import { useTenant } from '../../hooks/useTenant';

const FleetManagement: React.FC = () => {
  const { tenant, formatCurrency } = useTenant();
  const { addNotification } = useAppStore();
  const { user } = useAuthStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'FLEET' | 'FACILITIES' | 'MAINTENANCE' | 'FUEL'>('FLEET');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [vehiclePage, setVehiclePage] = useState(1);
  const VEHICLE_PAGE_SIZE = 12;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFacilityFormOpen, setIsFacilityFormOpen] = useState(false);
  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false);
  const [isFuelFormOpen, setIsFuelFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Omit<Vehicle, 'id'>>({
    plate: '',
    capacityKg: 3000,
    type: VehicleType.LIGHT_TRUCK,
    ownerId: 'Alpha Transporters',
    status: 'ACTIVE',
    logbookNumber: '',
    chassisNumber: '',
    engineNumber: '',
    ntsaInspectionExpiry: '',
    speedGovernorId: '',
    insurancePolicyNumber: '',
    insuranceExpiry: '',
    trackerId: '',
    ownerPin: '',
    yearOfManufacture: new Date().getFullYear(),
    color: '',
    verificationStatus: 'PENDING',
    complianceScore: 0,
    lastInspectionDate: '',
    nextInspectionDate: '',
    currentOdometer: 0,
    fuelLevel: 100
  });

  const [maintenanceFormData, setMaintenanceFormData] = useState<Partial<MaintenanceLog>>({
    vehicleId: '',
    type: 'ROUTINE',
    description: '',
    cost: 0,
    date: new Date().toISOString().split('T')[0],
    odometerReading: 0,
    performedBy: '',
    status: 'COMPLETED',
    nextServiceDate: '',
    nextServiceOdometer: 0
  });

  const [fuelFormData, setFuelFormData] = useState<Partial<FuelLog>>({
    vehicleId: '',
    driverId: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    cost: 0,
    odometerReading: 0,
    stationName: ''
  });

  useEffect(() => { loadData(); }, [tenant?.id]);

  const loadData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    const [v, f, m, fl, d] = await Promise.all([
      api.getVehicles(tenant.id), 
      api.getFacilities(tenant.id),
      api.getMaintenanceLogs(tenant.id),
      api.getFuelLogs(tenant.id),
      api.getUsers(tenant.id).then(users => users.filter(u => u.role === 'DRIVER'))
    ]);
    setVehicles(v);
    setFacilities(f);
    setMaintenanceLogs(m);
    setFuelLogs(fl);
    setDrivers(d);
    setLoading(false);
  };

  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const requestId = `maint-log-${Date.now()}`;
    try {
      await api.addMaintenanceLog(maintenanceFormData, requestId);
      addNotification("Maintenance activity logged successfully.", "success");
      setIsMaintenanceFormOpen(false);
      setMaintenanceFormData({
        vehicleId: '',
        type: 'ROUTINE',
        description: '',
        cost: 0,
        date: new Date().toISOString().split('T')[0],
        odometerReading: 0,
        performedBy: '',
        status: 'COMPLETED'
      });
      loadData();
    } catch (err) {
      addNotification("Failed to log maintenance.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.capacityKg <= 0) {
      addNotification("Invalid payload capacity.", "error");
      return;
    }
    setIsSubmitting(true);
    const requestId = editingVehicle ? `veh-upd-${editingVehicle.id}-${Date.now()}` : `veh-reg-${Date.now()}`;
    try {
      if (editingVehicle) {
        await api.updateVehicle(editingVehicle.id, formData, tenant?.id || 'tenant-1', requestId);
        addNotification(`Asset ${formData.plate} updated.`, 'success');
      } else {
        await api.createVehicle(formData, tenant?.id || 'tenant-1', requestId);
        addNotification(`Asset ${formData.plate} registered to fleet pool.`, 'success');
      }
      setIsFormOpen(false);
      resetVehicleForm();
      loadData();
    } catch (e) {
      addNotification("Sync error", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetVehicleForm = () => {
    setEditingVehicle(null);
    setFormData({ 
      plate: '', 
      capacityKg: 3000, 
      type: VehicleType.LIGHT_TRUCK, 
      ownerId: 'Alpha Transporters', 
      status: 'ACTIVE',
      logbookNumber: '',
      chassisNumber: '',
      engineNumber: '',
      ntsaInspectionExpiry: '',
      speedGovernorId: '',
      insurancePolicyNumber: '',
      insuranceExpiry: '',
      trackerId: '',
      ownerPin: '',
      yearOfManufacture: new Date().getFullYear(),
      color: '',
      verificationStatus: 'PENDING',
      complianceScore: 0,
      lastInspectionDate: '',
      nextInspectionDate: ''
    });
  };

  const [facilityFormData, setFacilityFormData] = useState<Omit<Facility, 'id'>>({
    name: '',
    type: 'WAREHOUSE',
    lat: -1.286,
    lng: 36.817,
    address: ''
  });

  const handleFacilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingFacility) {
        await api.updateFacility(editingFacility.id, facilityFormData);
        addNotification(`Facility ${facilityFormData.name} updated.`, 'success');
      } else {
        await api.createFacility(facilityFormData);
        addNotification(`Facility ${facilityFormData.name} created.`, 'success');
      }
      setIsFacilityFormOpen(false);
      setEditingFacility(null);
      setFacilityFormData({ name: '', type: 'WAREHOUSE', lat: -1.286, lng: 36.817, address: '' });
      loadData();
    } catch (e) {
      addNotification("Error saving facility", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.addMaintenanceLog(maintenanceFormData);
      addNotification(`Maintenance log recorded for vehicle.`, 'success');
      setIsMaintenanceFormOpen(false);
      setMaintenanceFormData({
        vehicleId: '',
        type: 'ROUTINE',
        description: '',
        cost: 0,
        date: new Date().toISOString().split('T')[0],
        odometerReading: 0,
        performedBy: '',
        status: 'COMPLETED',
        nextServiceDate: '',
        nextServiceOdometer: 0
      });
      loadData();
    } catch (e) {
      addNotification("Error saving maintenance log", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.addFuelLog(fuelFormData);
      addNotification(`Fuel log recorded.`, 'success');
      setIsFuelFormOpen(false);
      setFuelFormData({
        vehicleId: '',
        driverId: '',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        cost: 0,
        odometerReading: 0,
        stationName: ''
      });
      loadData();
    } catch (e) {
      addNotification("Error saving fuel log", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.plate.toLowerCase().includes(search.toLowerCase()) ||
                         v.type.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || v.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const pagedVehicles = filteredVehicles.slice(
    (vehiclePage - 1) * VEHICLE_PAGE_SIZE,
    vehiclePage * VEHICLE_PAGE_SIZE
  );

  return (
    <Layout title="Asset & Network Infrastructure">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex p-1 bg-slate-200/50 rounded-xl">
            {(['FLEET', 'FACILITIES', 'MAINTENANCE', 'FUEL'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg label-logistics !mb-0 transition-all ${activeTab === tab ? 'bg-white text-brand shadow-md' : 'text-slate-500'}`}
              >
                {tab === 'FLEET' ? 'Asset Registry' : tab === 'FACILITIES' ? 'Network Nodes' : tab === 'MAINTENANCE' ? 'Maintenance' : 'Fuel Tracking'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search assets..." 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setVehiclePage(1); }}
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-900 focus:ring-2 focus:ring-brand outline-none transition-all"
              />
            </div>
            
            {activeTab === 'FLEET' && (
              <select 
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setVehiclePage(1); }}
                className="hidden sm:block px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-900 focus:ring-2 focus:ring-brand outline-none transition-all"
              >
                <option value="ALL">All Types</option>
                {Object.values(VehicleType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            )}

            <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER']}>
              <button 
                onClick={() => {
                  if (activeTab === 'FLEET') {
                    resetVehicleForm();
                    setIsFormOpen(true);
                  } else if (activeTab === 'FACILITIES') {
                    setEditingFacility(null);
                    setFacilityFormData({ name: '', type: 'WAREHOUSE', lat: -1.286, lng: 36.817, address: '' });
                    setIsFacilityFormOpen(true);
                  } else if (activeTab === 'MAINTENANCE') {
                    setIsMaintenanceFormOpen(true);
                  } else {
                    setIsFuelFormOpen(true);
                  }
                }}
                className="bg-brand text-white px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:opacity-90 active:scale-95 transition-all"
              >
                <Plus size={16} /> 
                {activeTab === 'FLEET' ? 'Register Asset' : 
                 activeTab === 'FACILITIES' ? 'Add Facility' : 
                 activeTab === 'MAINTENANCE' ? 'Log Maintenance' : 'Log Fuel'}
              </button>
            </RoleGuard>
          </div>
        </div>

        {activeTab === 'FLEET' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? [1,2,3].map(i => <div key={i} className="h-64 bg-white animate-pulse rounded-[2.5rem] border border-slate-100" />) :
              pagedVehicles.map(v => (
                <div key={v.id} 
                  onClick={() => {
                    setEditingVehicle(v);
                    setFormData({ ...v });
                    setIsFormOpen(true);
                  }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:border-brand-accent hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between h-full cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${v.status === 'ACTIVE' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                      <Truck size={28} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={v.status === 'ACTIVE' ? 'delivered' : 'neutral'}>{v.status}</Badge>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${v.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                        <ShieldCheck size={10} />
                        {v.verificationStatus || 'PENDING'}
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 flex-1">
                    <p className="label-logistics text-slate-400 mb-1">{v.type}</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 group-hover:text-brand-accent transition-colors">{v.plate}</h3>
                    
                    {/* Maintenance Alert */}
                    {(v.nextServiceDate && new Date(v.nextServiceDate) < new Date(Date.now() + 86400000 * 7)) || 
                     (v.nextServiceOdometer && v.currentOdometer && v.nextServiceOdometer - v.currentOdometer < 500) ? (
                      <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-xl text-orange-700">
                        <AlertTriangle size={14} />
                        <span className="label-logistics text-orange-700 !mb-0">Service Due Soon</span>
                      </div>
                    ) : null}

                    {/* Compliance Score Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="label-logistics text-slate-400 !mb-0">Compliance Score</span>
                        <span className="body-value text-brand">{v.complianceScore || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${v.complianceScore && v.complianceScore > 80 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                          style={{ width: `${v.complianceScore || 0}%` }}
                        />
                      </div>
                    </div>
 
                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                       <div className="space-y-1">
                          <p className="label-logistics text-slate-300">Payload cap</p>
                          <div className="flex items-center gap-1.5">
                             <Zap size={14} className="text-orange-500" />
                             <span className="body-value">{v.capacityKg / 1000} Tons</span>
                          </div>
                       </div>
                       <div className="space-y-1">
                          <p className="label-logistics text-slate-300">Ownership</p>
                          <p className="body-value truncate-name">{v.ownerId}</p>
                       </div>
                    </div>
                  </div>
                </div>
              ))
            }
            {!loading && (
              <div className="col-span-full pt-2">
                <Pagination
                  page={vehiclePage}
                  pageSize={VEHICLE_PAGE_SIZE}
                  total={filteredVehicles.length}
                  onPageChange={setVehiclePage}
                />
              </div>
            )}
          </div>
        ) : activeTab === 'FACILITIES' ? (
          <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 label-logistics">Facility Unit</th>
                  <th className="px-8 py-5 label-logistics">Type</th>
                  <th className="px-8 py-5 label-logistics text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {facilities.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><Warehouse size={18} /></div>
                        <div>
                          <span className="body-value truncate-name block">{f.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase truncate-name">{f.address}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <Badge variant="neutral">{f.type}</Badge>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingFacility(f);
                              setFacilityFormData({ ...f });
                              setIsFacilityFormOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-brand bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
                          >
                            <Edit2 size={12} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'MAINTENANCE' ? (
          <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Cost</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {maintenanceLogs.map(log => {
                  const vehicle = vehicles.find(v => v.id === log.vehicleId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight block">{vehicle?.plate || 'Unknown'}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{log.description}</span>
                      </td>
                      <td className="px-8 py-6">
                        <Badge variant="neutral">{log.type}</Badge>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-black text-slate-700">{formatCurrency(log.cost)}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-500">{new Date(log.date).toLocaleDateString()}</span>
                      </td>
                      <td className="px-8 py-6">
                        <Badge variant={log.status === 'COMPLETED' ? 'delivered' : 'neutral'}>{log.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Driver</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount (L)</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Cost</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fuelLogs.map(log => {
                  const vehicle = vehicles.find(v => v.id === log.vehicleId);
                  const driver = drivers.find(d => d.id === log.driverId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight block">{vehicle?.plate || 'Unknown'}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{log.stationName || 'N/A'}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-700">{driver?.name || 'Unknown'}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-black text-slate-700">{log.amount} L</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-black text-slate-700">{formatCurrency(log.cost)}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-500">{new Date(log.date).toLocaleDateString()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] bg-brand/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg">
                       <Box size={20} />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-brand">Asset Enrollment</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{editingVehicle ? 'Update Asset Details' : 'Enroll New Unit'}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-brand transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={handleRegisterAsset} className="p-10 space-y-8 overflow-y-auto no-scrollbar">
                 <div className="space-y-10">
                    {/* Basic Info */}
                    <div className="space-y-6">
                       <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Basic Specifications</p>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Plate Number</label>
                             <input 
                               type="text" required
                               value={formData.plate}
                               onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})}
                               placeholder="KDC 123X"
                               className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all uppercase placeholder:normal-case shadow-sm"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Type</label>
                             <select 
                               value={formData.type}
                               onChange={e => setFormData({...formData, type: e.target.value as VehicleType})}
                               className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                             >
                                {Object.values(VehicleType).map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                             </select>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Payload (KG)</label>
                             <input 
                               type="number" required
                               value={isNaN(formData.capacityKg) ? '' : formData.capacityKg}
                               onChange={e => setFormData({...formData, capacityKg: parseInt(e.target.value) || 0})}
                               className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Color</label>
                             <input 
                               type="text"
                               value={formData.color}
                               onChange={e => setFormData({...formData, color: e.target.value})}
                               placeholder="White"
                               className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                             />
                          </div>
                       </div>
                    </div>

                    {/* Security & Traceability */}
                    <div className="space-y-6">
                       <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Security & Traceability (Kenyan Standard)</p>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Logbook Number</label>
                             <input 
                               type="text"
                               value={formData.logbookNumber}
                               onChange={e => setFormData({...formData, logbookNumber: e.target.value})}
                               className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Chassis Number</label>
                             <input 
                               type="text"
                               value={formData.chassisNumber}
                               onChange={e => setFormData({...formData, chassisNumber: e.target.value})}
                               className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                             />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Engine Number</label>
                             <input 
                               type="text"
                               value={formData.engineNumber}
                               onChange={e => setFormData({...formData, engineNumber: e.target.value})}
                               className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">NTSA Inspection Expiry</label>
                             <input 
                               type="date"
                               value={formData.ntsaInspectionExpiry}
                               onChange={e => setFormData({...formData, ntsaInspectionExpiry: e.target.value})}
                               className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                             />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Speed Governor ID</label>
                             <input 
                               type="text"
                               value={formData.speedGovernorId}
                               onChange={e => setFormData({...formData, speedGovernorId: e.target.value})}
                               className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">GPS Tracker ID</label>
                             <input 
                               type="text"
                               value={formData.trackerId}
                               onChange={e => setFormData({...formData, trackerId: e.target.value})}
                               className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                             />
                          </div>
                       </div>
                    </div>

                    {/* Insurance & Compliance */}
                    <div className="space-y-6">
                       <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Insurance & Compliance</p>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Policy Number</label>
                             <input 
                               type="text"
                               value={formData.insurancePolicyNumber}
                               onChange={e => setFormData({...formData, insurancePolicyNumber: e.target.value})}
                               className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Insurance Expiry</label>
                             <input 
                               type="date"
                               value={formData.insuranceExpiry}
                               onChange={e => setFormData({...formData, insuranceExpiry: e.target.value})}
                               className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                             />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Inspection</label>
                             <input 
                               type="date"
                               value={formData.lastInspectionDate}
                               onChange={e => setFormData({...formData, lastInspectionDate: e.target.value})}
                               className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Inspection</label>
                             <input 
                               type="date"
                               value={formData.nextInspectionDate}
                               onChange={e => setFormData({...formData, nextInspectionDate: e.target.value})}
                               className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-6 sticky bottom-0 bg-white">
                    <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors">Cancel</button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-[2] bg-brand text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-2"
                    >
                       {isSubmitting ? <RotateCw className="animate-spin" size={16} /> : <CheckCircle size={16} />} {editingVehicle ? 'Update Asset' : 'Finalize enrollment'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
      {isFacilityFormOpen && (
        <div className="fixed inset-0 z-[100] bg-brand/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg">
                       <Warehouse size={20} />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-brand">Facility Management</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{editingFacility ? 'Update Facility' : 'Add New Node'}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsFacilityFormOpen(false)} className="text-slate-400 hover:text-brand transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={handleFacilitySubmit} className="p-10 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Facility Name</label>
                       <input 
                         type="text" required
                         value={facilityFormData.name}
                         onChange={e => setFacilityFormData({...facilityFormData, name: e.target.value})}
                         placeholder="e.g. Nairobi Central Hub"
                         className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                       <select 
                         value={facilityFormData.type}
                         onChange={e => setFacilityFormData({...facilityFormData, type: e.target.value as any})}
                         className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                       >
                          <option value="WAREHOUSE">WAREHOUSE</option>
                          <option value="DISTRIBUTION_CENTER">DISTRIBUTION CENTER</option>
                          <option value="PHARMACY">PHARMACY</option>
                          <option value="HOSPITAL">HOSPITAL</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
                       <input 
                         type="text" required
                         value={facilityFormData.address}
                         onChange={e => setFacilityFormData({...facilityFormData, address: e.target.value})}
                         placeholder="Street, Area, City"
                         className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                       />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setIsFacilityFormOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors">Cancel</button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-[2] bg-brand text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-2"
                    >
                       {isSubmitting ? <RotateCw className="animate-spin" size={16} /> : <CheckCircle size={16} />} {editingFacility ? 'Update Facility' : 'Create Facility'}
                    </button>
                 </div>
              </form>
            </div>
        </div>
      )}
      {isFuelFormOpen && (
        <div className="fixed inset-0 z-[100] bg-brand/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg">
                       <Fuel size={20} />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-brand">Fuel Tracking</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Log Refueling Event</p>
                    </div>
                 </div>
                 <button onClick={() => setIsFuelFormOpen(false)} className="text-slate-400 hover:text-brand transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={handleFuelSubmit} className="p-10 space-y-6">
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Vehicle</label>
                         <select 
                           required
                           value={fuelFormData.vehicleId}
                           onChange={e => setFuelFormData({...fuelFormData, vehicleId: e.target.value})}
                           className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                         >
                            <option value="">Select Vehicle</option>
                            {vehicles.map(v => (
                              <option key={v.id} value={v.id}>{v.plate}</option>
                            ))}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Driver</label>
                         <select 
                           required
                           value={fuelFormData.driverId}
                           onChange={e => setFuelFormData({...fuelFormData, driverId: e.target.value})}
                           className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                         >
                            <option value="">Select Driver</option>
                            {drivers.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                         </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (L)</label>
                         <input 
                           type="number" required
                           value={fuelFormData.amount || ''}
                           onChange={e => setFuelFormData({...fuelFormData, amount: parseFloat(e.target.value) || 0})}
                           className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cost (KES)</label>
                         <input 
                           type="number" required
                           value={fuelFormData.cost || ''}
                           onChange={e => setFuelFormData({...fuelFormData, cost: parseFloat(e.target.value) || 0})}
                           className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                         />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Odometer</label>
                         <input 
                           type="number" required
                           value={fuelFormData.odometerReading || ''}
                           onChange={e => setFuelFormData({...fuelFormData, odometerReading: parseInt(e.target.value) || 0})}
                           className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                         <input 
                           type="date" required
                           value={fuelFormData.date}
                           onChange={e => setFuelFormData({...fuelFormData, date: e.target.value})}
                           className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                         />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Station Name</label>
                       <input 
                         type="text"
                         value={fuelFormData.stationName}
                         onChange={e => setFuelFormData({...fuelFormData, stationName: e.target.value})}
                         placeholder="e.g. Shell Westlands"
                         className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                       />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsFuelFormOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors">Cancel</button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-[2] bg-brand text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-2"
                    >
                       {isSubmitting ? <RotateCw className="animate-spin" size={16} /> : <CheckCircle size={16} />} Save Log
                    </button>
                 </div>
              </form>
            </div>
        </div>
      )}
      {isMaintenanceFormOpen && (
        <div className="fixed inset-0 z-[100] bg-brand/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg">
                       <History size={20} />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-brand">Maintenance Log</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Record Service Activity</p>
                    </div>
                 </div>
                 <button onClick={() => setIsMaintenanceFormOpen(false)} className="text-slate-400 hover:text-brand transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={handleMaintenanceSubmit} className="p-10 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Vehicle</label>
                       <select 
                         required
                         value={maintenanceFormData.vehicleId}
                         onChange={e => setMaintenanceFormData({...maintenanceFormData, vehicleId: e.target.value})}
                         className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                       >
                          <option value="">Select Vehicle</option>
                          {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.plate} ({v.type})</option>
                          ))}
                       </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                         <select 
                           value={maintenanceFormData.type}
                           onChange={e => setMaintenanceFormData({...maintenanceFormData, type: e.target.value as any})}
                           className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                         >
                            <option value="ROUTINE">Routine</option>
                            <option value="REPAIR">Repair</option>
                            <option value="INSPECTION">Inspection</option>
                            <option value="EMERGENCY">Emergency</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cost (KES)</label>
                         <input 
                           type="number" required
                           value={isNaN(maintenanceFormData.cost as number) ? '' : maintenanceFormData.cost}
                           onChange={e => setMaintenanceFormData({...maintenanceFormData, cost: parseInt(e.target.value) || 0})}
                           className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                         />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                       <textarea 
                         required
                         value={maintenanceFormData.description}
                         onChange={e => setMaintenanceFormData({...maintenanceFormData, description: e.target.value})}
                         className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm h-24 resize-none"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Service Date</label>
                         <input 
                           type="date"
                           value={maintenanceFormData.nextServiceDate}
                           onChange={e => setMaintenanceFormData({...maintenanceFormData, nextServiceDate: e.target.value})}
                           className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Service Odo</label>
                         <input 
                           type="number"
                           value={maintenanceFormData.nextServiceOdometer || ''}
                           onChange={e => setMaintenanceFormData({...maintenanceFormData, nextServiceOdometer: parseInt(e.target.value) || 0})}
                           className="w-full bg-white border-2 border-slate-100 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all shadow-sm"
                         />
                      </div>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsMaintenanceFormOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors">Cancel</button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-[2] bg-brand text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-2"
                    >
                       {isSubmitting ? <RotateCw className="animate-spin" size={16} /> : <CheckCircle size={16} />} Save Log
                    </button>
                 </div>
              </form>
            </div>
        </div>
      )}
    </Layout>
  );
};

export default FleetManagement;
