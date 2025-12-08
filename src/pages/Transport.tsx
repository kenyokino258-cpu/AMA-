
import React, { useState, useEffect, useRef, useContext } from 'react';
import { MOCK_VEHICLES, MOCK_DRIVERS, MOCK_TRIPS, MOCK_MAINTENANCE } from '../constants';
import { Vehicle, Driver, Trip, MaintenanceLog, UserRole } from '../types';
import { Car, Users, Map as MapIcon, Wrench, Plus, Search, Navigation, MapPin, Activity, X, CheckCircle, Zap, Gauge, Fuel, PlayCircle, Smartphone, FileText, Pencil, Trash2, Check, UserCheck, ShieldCheck, Upload, Eye, Paperclip, FileSignature, AlertCircle, Battery, Satellite, Lock } from 'lucide-react';
import DataControls from '../components/DataControls';
import { AppContext } from '../App';

const Transport: React.FC = () => {
  const { currentUser, addNotification } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers' | 'trips' | 'maintenance' | 'gps'>('vehicles');
  
  // State with LocalStorage Persistence
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
     const saved = localStorage.getItem('transport_vehicles');
     return saved ? JSON.parse(saved) : MOCK_VEHICLES;
  });
  const [drivers, setDrivers] = useState<Driver[]>(() => {
     const saved = localStorage.getItem('transport_drivers');
     return saved ? JSON.parse(saved) : MOCK_DRIVERS;
  });
  const [trips, setTrips] = useState<Trip[]>(() => {
     const saved = localStorage.getItem('transport_trips');
     return saved ? JSON.parse(saved) : MOCK_TRIPS;
  });
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => {
     const saved = localStorage.getItem('transport_maintenance');
     if (saved) {
         // Migration: Ensure old logs have a status
         const logs = JSON.parse(saved);
         return logs.map((log: any) => ({
             ...log,
             status: log.status || 'approved' // Default old logs to approved to avoid stuck state
         }));
     }
     return MOCK_MAINTENANCE;
  });

  const [searchTerm, setSearchTerm] = useState('');
  
  // Vehicle Filters
  const [vehicleFilters, setVehicleFilters] = useState({
      plate: '',
      model: '',
      status: 'all',
      expiry: ''
  });

  // Modals State
  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const [isLinkGpsModalOpen, setIsLinkGpsModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  // GPS State
  const [gpsAuthenticated, setGpsAuthenticated] = useState(false);
  const [isLoggingInGps, setIsLoggingInGps] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const maintenanceFileRef = useRef<HTMLInputElement>(null);

  // Forms
  const [newTrip, setNewTrip] = useState({
     vehicleId: '', driverId: '', startOdometer: 0, endOdometer: 0, route: ''
  });

  const [newVehicleForm, setNewVehicleForm] = useState({
     plateNumber: '', model: '', type: 'سيارة' as any, currentOdometer: 0, licenseExpiry: ''
  });

  const [newDriverForm, setNewDriverForm] = useState({
     employeeName: '',
     licenseNumber: '',
     licenseType: 'درجة أولى',
     licenseExpiry: ''
  });

  const [gpsLinkForm, setGpsLinkForm] = useState({
     vehicleId: '',
     deviceId: '',
     provider: 'Teltonika'
  });

  const [gpsLoginForm, setGpsLoginForm] = useState({
      username: '',
      password: ''
  });

  // Updated Maintenance Form State
  const [newMaint, setNewMaint] = useState<{
      vehicleId: string;
      cost: number;
      desc: string;
      type: string;
      file: File | null;
  }>({ 
      vehicleId: '', 
      cost: 0, 
      desc: '', 
      type: 'دورية', // Default
      file: null 
  });

  const maintenanceTypes = ['دورية', 'إصلاح', 'تغيير زيت', 'إطارات', 'كهرباء', 'سمكرة ودوهان', 'أخرى'];

  const isAdmin = true;

  // Save to LocalStorage
  useEffect(() => { localStorage.setItem('transport_vehicles', JSON.stringify(vehicles)); }, [vehicles]);
  useEffect(() => { localStorage.setItem('transport_drivers', JSON.stringify(drivers)); }, [drivers]);
  useEffect(() => { localStorage.setItem('transport_trips', JSON.stringify(trips)); }, [trips]);
  useEffect(() => { localStorage.setItem('transport_maintenance', JSON.stringify(maintenanceLogs)); }, [maintenanceLogs]);

  // --- Simulation Effect (GPS Movement & Data) ---
  useEffect(() => {
     if (activeTab === 'gps' && gpsAuthenticated) {
        const interval = setInterval(() => {
           setVehicles(prevVehicles => prevVehicles.map(v => {
              if (v.gps) {
                 const isMoving = Math.random() > 0.3; // 70% chance to be moving
                 const latChange = isMoving ? (Math.random() - 0.5) * 0.001 : 0;
                 const lngChange = isMoving ? (Math.random() - 0.5) * 0.001 : 0;
                 
                 // Simulate speed
                 let newSpeed = isMoving ? v.gps.speed + Math.floor((Math.random() - 0.5) * 10) : 0;
                 if (newSpeed < 0) newSpeed = 0;
                 if (newSpeed > 120) newSpeed = 120;

                 // Simulate Fuel (Decrease slightly if moving)
                 let currentFuel = v.gps.fuelLevel || 75;
                 if (newSpeed > 0) currentFuel -= 0.05;
                 if (currentFuel < 5) currentFuel = 100; // Refill simulation

                 // Simulate Battery
                 const battery = newSpeed > 0 ? 14.2 : 12.4; 

                 return {
                    ...v,
                    gps: {
                       ...v.gps,
                       lat: v.gps.lat + latChange,
                       lng: v.gps.lng + lngChange,
                       speed: newSpeed,
                       lastUpdate: new Date().toLocaleTimeString('ar-EG'),
                       fuelLevel: parseFloat(currentFuel.toFixed(1)),
                       ignition: (newSpeed > 0 ? 'on' : 'off') as 'on' | 'off',
                       batteryVoltage: battery
                    }
                 };
              }
              return v;
           }));
        }, 2000);
        return () => clearInterval(interval);
     }
  }, [activeTab, gpsAuthenticated]);

  // --- Handlers ---

  const handleGpsLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoggingInGps(true);
      // Simulate API verification
      setTimeout(() => {
          setIsLoggingInGps(false);
          setGpsAuthenticated(true);
          // Auto-init GPS data for vehicles if missing
          setVehicles(prev => prev.map(v => {
              if (!v.gps && v.status === 'active') {
                  return {
                      ...v,
                      gps: {
                          lat: 30.0444 + (Math.random() * 0.05),
                          lng: 31.2357 + (Math.random() * 0.05),
                          lastUpdate: 'الآن',
                          speed: 0,
                          address: 'القاهرة، وسط البلد',
                          fuelLevel: 85,
                          ignition: 'off',
                          batteryVoltage: 12.5
                      }
                  }
              }
              return v;
          }));
      }, 1500);
  };

  const handleAddTrip = (e: React.FormEvent) => {
     e.preventDefault();
     const vehicle = vehicles.find(v => v.id === newTrip.vehicleId);
     const driver = drivers.find(d => d.id === newTrip.driverId);
     if(vehicle && driver) {
        const trip: Trip = {
           id: `TR-${Date.now()}`,
           date: new Date().toISOString().split('T')[0],
           vehicleId: vehicle.id,
           plateNumber: vehicle.plateNumber,
           driverId: driver.id,
           driverName: driver.employeeName,
           startOdometer: Number(newTrip.startOdometer),
           endOdometer: Number(newTrip.endOdometer),
           distance: Number(newTrip.endOdometer) - Number(newTrip.startOdometer),
           route: newTrip.route,
           status: 'completed'
        };
        setTrips([trip, ...trips]);
        setIsAddTripOpen(false);
        setVehicles(vehicles.map(v => v.id === vehicle.id ? {...v, currentOdometer: Number(newTrip.endOdometer)} : v));
     }
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingVehicleId) {
      setVehicles(vehicles.map(v => v.id === editingVehicleId ? {
        ...v,
        plateNumber: newVehicleForm.plateNumber,
        model: newVehicleForm.model,
        type: newVehicleForm.type,
        currentOdometer: Number(newVehicleForm.currentOdometer),
        licenseExpiry: newVehicleForm.licenseExpiry
      } : v));
      alert('تم تحديث بيانات المركبة بنجاح');
    } else {
      const vehicle: Vehicle = {
        id: `V-${Date.now()}`,
        plateNumber: newVehicleForm.plateNumber,
        model: newVehicleForm.model,
        type: newVehicleForm.type,
        currentOdometer: Number(newVehicleForm.currentOdometer),
        licenseExpiry: newVehicleForm.licenseExpiry,
        status: 'active'
      };
      setVehicles([...vehicles, vehicle]);
      alert('تم إضافة المركبة بنجاح');
    }
    
    setIsAddVehicleModalOpen(false);
    setNewVehicleForm({ plateNumber: '', model: '', type: 'سيارة', currentOdometer: 0, licenseExpiry: '' });
    setEditingVehicleId(null);
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    const newDriver: Driver = {
       id: `D-${Date.now()}`,
       employeeId: `TEMP-${Date.now()}`,
       employeeName: newDriverForm.employeeName,
       licenseNumber: newDriverForm.licenseNumber,
       licenseType: newDriverForm.licenseType,
       licenseExpiry: newDriverForm.licenseExpiry,
       status: 'active'
    };
    setDrivers([...drivers, newDriver]);
    setIsAddDriverModalOpen(false);
    setNewDriverForm({ employeeName: '', licenseNumber: '', licenseType: 'درجة أولى', licenseExpiry: '' });
    alert('تم إضافة السائق بنجاح');
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setNewVehicleForm({
      plateNumber: vehicle.plateNumber,
      model: vehicle.model,
      type: vehicle.type,
      currentOdometer: vehicle.currentOdometer,
      licenseExpiry: vehicle.licenseExpiry
    });
    setEditingVehicleId(vehicle.id);
    setIsAddVehicleModalOpen(true);
  };

  const handleDeleteVehicle = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المركبة؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  const handleLinkGpsDevice = (e: React.FormEvent) => {
     e.preventDefault();
     const updatedVehicles = vehicles.map(v => {
        if (v.id === gpsLinkForm.vehicleId) {
           return {
              ...v,
              gps: { 
                 lat: 30.0444 + (Math.random() * 0.05), 
                 lng: 31.2357 + (Math.random() * 0.05), 
                 lastUpdate: 'الآن', 
                 speed: 0, 
                 address: 'تم ربط الجهاز - جاري تحديد الموقع',
                 fuelLevel: 80,
                 ignition: 'off' as const,
                 batteryVoltage: 12.6
              }
           };
        }
        return v;
     });
     setVehicles(updatedVehicles);
     setIsLinkGpsModalOpen(false);
     setGpsLinkForm({ vehicleId: '', deviceId: '', provider: 'Teltonika' });
     alert('تم ربط جهاز التتبع بنجاح وتشغيل الخدمة');
  };

  // Maintenance File Upload
  const handleMaintenanceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setNewMaint(prev => ({ ...prev, file: file }));
      }
  };

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const log: MaintenanceLog = {
        id: `M-${Date.now()}`,
        vehicleId: newMaint.vehicleId,
        plateNumber: vehicles.find(v => v.id === newMaint.vehicleId)?.plateNumber || 'Unknown',
        date: new Date().toISOString().split('T')[0],
        description: newMaint.desc,
        cost: newMaint.cost,
        type: newMaint.type as any,
        status: 'pending',
        createdBy: currentUser?.fullName || 'موظف',
        invoiceUrl: newMaint.file ? URL.createObjectURL(newMaint.file) : undefined
    };
    setMaintenanceLogs([log, ...maintenanceLogs]);
    setIsAddMaintenanceOpen(false);
    addNotification('طلب صيانة', `طلب صيانة جديد للمركبة ${log.plateNumber} بواسطة ${log.createdBy}`);
    setNewMaint({ vehicleId: '', cost: 0, desc: '', type: 'دورية', file: null });
  };

  const handleImportVehicles = (data: any[]) => {
      setVehicles([...vehicles, ...data.map((d, i) => ({...d, id: `IMP-V-${i}`}))]);
  };

  const jumpToMaintenance = (plateNumber: string) => {
     setSearchTerm(plateNumber);
     setActiveTab('maintenance');
  };

  // --- WORKFLOW ---
  const handleReviewMaintenance = (id: string) => {
      const reviewer = currentUser?.fullName || 'المراجع';
      if(window.confirm(`تأكيد مراجعة الطلب والفاتورة؟\nسيتم تسجيل اسمك: ${reviewer}`)) {
          setMaintenanceLogs(prev => prev.map(l => l.id === id ? { 
              ...l, 
              status: 'reviewed', 
              reviewedBy: reviewer 
          } : l));
          addNotification('مراجعة صيانة', 'تمت مراجعة طلب الصيانة.');
      }
  };

  const handleApproveMaintenance = (id: string) => {
      const approver = currentUser?.fullName || 'المدير';
      if(window.confirm(`اعتماد الصرف النهائي للطلب؟\nسيتم تسجيل اسمك: ${approver}`)) {
          setMaintenanceLogs(prev => prev.map(l => l.id === id ? { 
              ...l, 
              status: 'approved', 
              approvedBy: approver 
          } : l));
          addNotification('اعتماد صيانة', 'تم اعتماد تكاليف الصيانة والصرف.');
      }
  };

  const handleRejectMaintenance = (id: string) => {
      if(window.confirm('هل أنت متأكد من رفض طلب الصيانة هذا؟')) {
          setMaintenanceLogs(prev => prev.map(l => l.id === id ? { 
              ...l, 
              status: 'rejected'
          } : l));
          addNotification('رفض صيانة', 'تم رفض طلب الصيانة.');
      }
  };

  const handleDeleteMaintenance = (id: string) => {
      if(window.confirm('هل أنت متأكد من حذف هذا السجل نهائياً؟')) {
          setMaintenanceLogs(prev => prev.filter(l => l.id !== id));
      }
  };

  const handlePrintMaintenance = () => {
    const filteredLogs = maintenanceLogs.filter(log => log.plateNumber.includes(searchTerm) || log.description.includes(searchTerm));
    const totalCost = filteredLogs.reduce((a,c) => a + c.cost, 0);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير الصيانة</title>
          <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f0f0f0}</style>
        </head>
        <body>
          <h2>تقرير الصيانة</h2>
          <p>التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
          <table>
            <thead><tr><th>المركبة</th><th>التاريخ</th><th>النوع</th><th>التفاصيل</th><th>التكلفة</th><th>الحالة</th></tr></thead>
            <tbody>
              ${filteredLogs.map(log => `
                <tr>
                  <td>${log.plateNumber}</td>
                  <td>${log.date}</td>
                  <td>${log.type}</td>
                  <td>${log.description}</td>
                  <td>${log.cost}</td>
                  <td>${log.status === 'approved' ? 'معتمد' : log.status === 'reviewed' ? 'تمت المراجعة' : 'قيد الانتظار'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <h3>الإجمالي: ${totalCost.toLocaleString()} ج.م</h3>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getMapPosition = (lat: number, lng: number) => {
     const baseLat = 30.0;
     const baseLng = 31.2;
     const y = (lat - baseLat) * 1000; 
     const x = (lng - baseLng) * 1000;
     const top = Math.min(Math.max(50 - y, 5), 95);
     const left = Math.min(Math.max(50 + x, 5), 95);
     return { top: `${top}%`, left: `${left}%` };
  };

  const handleViewInvoice = (url?: string) => {
      if (url) window.open(url, '_blank');
      else alert('لا يوجد مرفق');
  };

  const filteredVehicles = vehicles.filter(v => {
      const globalSearch = v.plateNumber.includes(searchTerm) || v.model.includes(searchTerm);
      const matchPlate = v.plateNumber.includes(vehicleFilters.plate);
      const matchModel = v.model.toLowerCase().includes(vehicleFilters.model.toLowerCase());
      const matchStatus = vehicleFilters.status === 'all' || v.status === vehicleFilters.status;
      const matchExpiry = v.licenseExpiry.includes(vehicleFilters.expiry);
      
      return globalSearch && matchPlate && matchModel && matchStatus && matchExpiry;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">إدارة النقل والحركة</h2>
        <p className="text-sm text-gray-500">إدارة أسطول المركبات، السائقين، الرحلات، والصيانة</p>
      </div>

      <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-xl overflow-x-auto">
        <button onClick={() => setActiveTab('vehicles')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'vehicles' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}><Car className="h-5 w-5" />المركبات</button>
        <button onClick={() => setActiveTab('drivers')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'drivers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}><Users className="h-5 w-5" />السائقين</button>
        <button onClick={() => setActiveTab('trips')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'trips' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}><MapIcon className="h-5 w-5" />الرحلات</button>
        <button onClick={() => setActiveTab('maintenance')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'maintenance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}><Wrench className="h-5 w-5" />طلبات الصيانة</button>
        <button onClick={() => setActiveTab('gps')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'gps' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'}`}><Satellite className="h-5 w-5" />تتبع (GPS)</button>
      </div>

      <div className="bg-white p-6 rounded-b-xl shadow-sm border border-gray-100 border-t-0 min-h-[500px]">
         
         {/* --- VEHICLES TAB --- */}
         {activeTab === 'vehicles' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <div className="relative w-72">
                     <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                     <input type="text" placeholder="بحث برقم اللوحة..." className="w-full rounded-lg border border-gray-200 py-2 pr-9 pl-4 focus:border-indigo-500 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                     <DataControls data={vehicles} fileName="vehicles_list" isAdmin={isAdmin} onImport={handleImportVehicles} />
                     <button 
                        onClick={() => {
                           setEditingVehicleId(null);
                           setNewVehicleForm({ plateNumber: '', model: '', type: 'سيارة', currentOdometer: 0, licenseExpiry: '' });
                           setIsAddVehicleModalOpen(true);
                        }} 
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                     >
                        <Plus className="h-5 w-5" /> إضافة مركبة
                     </button>
                  </div>
               </div>
               <div className="overflow-x-auto border border-gray-100 rounded-lg">
                  <table className="w-full text-right text-sm">
                     <thead className="bg-gray-50 text-gray-500">
                        <tr>
                           <th className="px-6 py-4">المركبة</th>
                           <th className="px-6 py-4">رقم اللوحة</th>
                           <th className="px-6 py-4">الحالة</th>
                           <th className="px-6 py-4">انتهاء الرخصة</th>
                           <th className="px-6 py-4">العداد (كم)</th>
                           <th className="px-6 py-4">إجراءات</th>
                        </tr>
                        {/* Filters */}
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-2"><input className="w-full text-xs p-1 border rounded focus:border-indigo-500 outline-none" placeholder="موديل..." value={vehicleFilters.model} onChange={e => setVehicleFilters({...vehicleFilters, model: e.target.value})} /></th>
                            <th className="px-6 py-2"><input className="w-full text-xs p-1 border rounded focus:border-indigo-500 outline-none" placeholder="لوحة..." value={vehicleFilters.plate} onChange={e => setVehicleFilters({...vehicleFilters, plate: e.target.value})} /></th>
                            <th className="px-6 py-2">
                                <select className="w-full text-xs p-1 border rounded focus:border-indigo-500 outline-none" value={vehicleFilters.status} onChange={e => setVehicleFilters({...vehicleFilters, status: e.target.value})}>
                                    <option value="all">الكل</option>
                                    <option value="active">نشط</option>
                                    <option value="maintenance">صيانة</option>
                                    <option value="broken">معطل</option>
                                </select>
                            </th>
                            <th className="px-6 py-2"><input className="w-full text-xs p-1 border rounded focus:border-indigo-500 outline-none" placeholder="YYYY-MM-DD" value={vehicleFilters.expiry} onChange={e => setVehicleFilters({...vehicleFilters, expiry: e.target.value})} /></th>
                            <th className="px-6 py-2 bg-gray-100"></th>
                            <th className="px-6 py-2 bg-gray-100"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {filteredVehicles.map(v => (
                           <tr key={v.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium">{v.model} <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mr-2">{v.type}</span></td>
                              <td className="px-6 py-4 font-mono">{v.plateNumber}</td>
                              <td className="px-6 py-4">
                                 <span className={`px-2 py-1 rounded-full text-xs ${v.status === 'active' ? 'bg-green-100 text-green-800' : v.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                    {v.status === 'active' ? 'نشط' : v.status === 'maintenance' ? 'في الصيانة' : 'معطل'}
                                 </span>
                              </td>
                              <td className="px-6 py-4 font-mono">{v.licenseExpiry}</td>
                              <td className="px-6 py-4 font-mono">{v.currentOdometer.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-2">
                                    <button 
                                       onClick={() => jumpToMaintenance(v.plateNumber)}
                                       className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded flex items-center gap-1 text-xs font-bold"
                                       title="سجل الصيانة"
                                    >
                                       <Wrench className="h-4 w-4" /> سجل الصيانة
                                    </button>
                                    <button 
                                       onClick={() => handleEditVehicle(v)}
                                       className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded"
                                       title="تعديل"
                                    >
                                       <Pencil className="h-4 w-4" />
                                    </button>
                                    <button 
                                       onClick={() => handleDeleteVehicle(v.id)}
                                       className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded"
                                       title="حذف"
                                    >
                                       <Trash2 className="h-4 w-4" />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* --- DRIVERS TAB --- */}
         {activeTab === 'drivers' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <div className="relative w-72">
                     <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                     <input type="text" placeholder="بحث عن سائق..." className="w-full rounded-lg border border-gray-200 py-2 pr-9 pl-4 focus:border-indigo-500 focus:outline-none" />
                  </div>
                  <button 
                    onClick={() => setIsAddDriverModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                     <Plus className="h-5 w-5" /> تعيين سائق جديد
                  </button>
               </div>
               <div className="overflow-x-auto border border-gray-100 rounded-lg">
                  <table className="w-full text-right text-sm">
                     <thead className="bg-gray-50 text-gray-500">
                        <tr>
                           <th className="px-6 py-4">السائق</th>
                           <th className="px-6 py-4">رقم الرخصة</th>
                           <th className="px-6 py-4">درجة الرخصة</th>
                           <th className="px-6 py-4">انتهاء الصلاحية</th>
                           <th className="px-6 py-4">الحالة</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {drivers.map(d => (
                           <tr key={d.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium">{d.employeeName}</td>
                              <td className="px-6 py-4 font-mono">{d.licenseNumber}</td>
                              <td className="px-6 py-4">{d.licenseType}</td>
                              <td className="px-6 py-4 font-mono">{d.licenseExpiry}</td>
                              <td className="px-6 py-4">
                                 <span className={`px-2 py-1 rounded-full text-xs ${d.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {d.status === 'active' ? 'نشط' : 'موقوف'}
                                 </span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* --- TRIPS TAB --- */}
         {activeTab === 'trips' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <DataControls data={trips} fileName="trips_report" isAdmin={isAdmin} />
                  <button onClick={() => setIsAddTripOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                     <Plus className="h-5 w-5" /> رحلة جديدة
                  </button>
               </div>
               
               {/* New Trip Modal (Simulated inline) */}
               {isAddTripOpen && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-indigo-100 mb-4 animate-in fade-in slide-in-from-top-2">
                     <h4 className="font-bold text-indigo-700 mb-3">تسجيل رحلة جديدة</h4>
                     <form onSubmit={handleAddTrip} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                           <label className="block text-xs text-gray-500 mb-1">المركبة</label>
                           <select className="w-full p-2 rounded border" required onChange={e => setNewTrip({...newTrip, vehicleId: e.target.value})}>
                              <option value="">اختر المركبة</option>
                              {vehicles.filter(v => v.status === 'active').map(v => <option key={v.id} value={v.id}>{v.plateNumber} - {v.model}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs text-gray-500 mb-1">السائق</label>
                           <select className="w-full p-2 rounded border" required onChange={e => setNewTrip({...newTrip, driverId: e.target.value})}>
                              <option value="">اختر السائق</option>
                              {drivers.filter(d => d.status === 'active').map(d => <option key={d.id} value={d.id}>{d.employeeName}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs text-gray-500 mb-1">عداد البداية</label>
                           <input type="number" className="w-full p-2 rounded border" required placeholder="كم" onChange={e => setNewTrip({...newTrip, startOdometer: Number(e.target.value)})} />
                        </div>
                        <div>
                           <label className="block text-xs text-gray-500 mb-1">عداد النهاية</label>
                           <input type="number" className="w-full p-2 rounded border" required placeholder="كم" onChange={e => setNewTrip({...newTrip, endOdometer: Number(e.target.value)})} />
                        </div>
                        <div>
                           <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">حفظ الرحلة</button>
                        </div>
                     </form>
                     <div className="mt-2">
                        <label className="block text-xs text-gray-500 mb-1">خط السير</label>
                        <input type="text" className="w-full p-2 rounded border" placeholder="من ... إلى ..." onChange={e => setNewTrip({...newTrip, route: e.target.value})} />
                     </div>
                  </div>
               )}

               <div className="overflow-x-auto border border-gray-100 rounded-lg">
                  <table className="w-full text-right text-sm">
                     <thead className="bg-gray-50 text-gray-500">
                        <tr>
                           <th className="px-6 py-4">التاريخ</th>
                           <th className="px-6 py-4">المركبة</th>
                           <th className="px-6 py-4">السائق</th>
                           <th className="px-6 py-4">المسافة (كم)</th>
                           <th className="px-6 py-4">خط السير</th>
                           <th className="px-6 py-4">الحالة</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {trips.map(t => (
                           <tr key={t.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-mono">{t.date}</td>
                              <td className="px-6 py-4 font-mono">{t.plateNumber}</td>
                              <td className="px-6 py-4">{t.driverName}</td>
                              <td className="px-6 py-4 font-bold">{t.distance} كم</td>
                              <td className="px-6 py-4">{t.route}</td>
                              <td className="px-6 py-4"><span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">مكتملة</span></td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* --- MAINTENANCE TAB --- */}
         {activeTab === 'maintenance' && (
            <div className="space-y-6">
               <div className="flex justify-between items-start">
                   <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                      <p className="text-orange-600 text-sm">إجمالي تكاليف الصيانة</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{maintenanceLogs.reduce((a,c) => a + c.cost, 0).toLocaleString()} ج.م</p>
                   </div>
                   <div className="flex gap-2 items-center">
                      <div className="relative w-64">
                         <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                         <input 
                           type="text" 
                           placeholder="بحث برقم اللوحة..." 
                           className="w-full rounded-lg border border-gray-200 py-2 pr-9 pl-4 focus:border-indigo-500 focus:outline-none"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                         />
                      </div>
                      <button onClick={handlePrintMaintenance} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"><FileText className="h-4 w-4" /> طباعة تقرير</button>
                      <button onClick={() => setIsAddMaintenanceOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"><Plus className="h-4 w-4" /> تسجيل صيانة</button>
                   </div>
               </div>
               
               {searchTerm && (
                 <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded-lg inline-flex items-center gap-2">
                    <span>نتائج البحث عن: <strong>{searchTerm}</strong></span>
                    <button onClick={() => setSearchTerm('')} className="text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button>
                 </div>
               )}

               <div className="overflow-x-auto border border-gray-100 rounded-lg">
                  <table className="w-full text-right text-sm">
                     <thead className="bg-gray-50 text-gray-500">
                        <tr>
                           <th className="px-6 py-4">المركبة</th>
                           <th className="px-6 py-4">التاريخ</th>
                           <th className="px-6 py-4">نوع الصيانة</th>
                           <th className="px-6 py-4">التفاصيل</th>
                           <th className="px-6 py-4">التكلفة</th>
                           <th className="px-6 py-4">المرفقات</th>
                           <th className="px-6 py-4">الاعتمادات</th>
                           <th className="px-6 py-4">إجراءات</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {maintenanceLogs.filter(log => log.plateNumber.includes(searchTerm) || log.description.includes(searchTerm)).map(log => (
                           <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-mono">{log.plateNumber}</td>
                              <td className="px-6 py-4 font-mono">{log.date}</td>
                              <td className="px-6 py-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{log.type}</span></td>
                              <td className="px-6 py-4">{log.description}</td>
                              <td className="px-6 py-4 font-bold text-red-600">{log.cost.toLocaleString()} ج.م</td>
                              <td className="px-6 py-4 text-center">
                                  {log.invoiceUrl ? (
                                      <button onClick={() => handleViewInvoice(log.invoiceUrl)} className="text-blue-600 hover:underline text-xs flex items-center justify-center gap-1"><Paperclip className="h-3 w-3" /> عرض</button>
                                  ) : '-'}
                              </td>
                              <td className="px-6 py-4 text-center">
                                  <div className="flex flex-col gap-1 items-center">
                                      {log.status === 'pending' && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-[10px]">قيد المراجعة</span>}
                                      {log.status === 'reviewed' && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px]">تمت المراجعة ({log.reviewedBy})</span>}
                                      {log.status === 'approved' && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-[10px]">معتمد ({log.approvedBy})</span>}
                                      {log.status === 'rejected' && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-[10px]">مرفوض</span>}
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex gap-1 justify-center">
                                      {currentUser?.role !== UserRole.EMPLOYEE && (
                                          <>
                                              {log.status === 'pending' && <button onClick={() => handleReviewMaintenance(log.id)} className="p-1 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100" title="مراجعة"><CheckCircle className="h-4 w-4" /></button>}
                                              {log.status === 'reviewed' && <button onClick={() => handleApproveMaintenance(log.id)} className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100" title="اعتماد"><ShieldCheck className="h-4 w-4" /></button>}
                                              {log.status !== 'approved' && <button onClick={() => handleRejectMaintenance(log.id)} className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100" title="رفض"><X className="h-4 w-4" /></button>}
                                              <button onClick={() => handleDeleteMaintenance(log.id)} className="p-1 text-gray-400 hover:text-red-500" title="حذف"><Trash2 className="h-4 w-4" /></button>
                                          </>
                                      )}
                                  </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* --- GPS TRACKING TAB --- */}
         {activeTab === 'gps' && (
            <div className="h-[600px] flex flex-col">
                {!gpsAuthenticated ? (
                    <div className="flex-1 flex items-center justify-center bg-slate-900 rounded-xl relative overflow-hidden">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md z-10">
                            <div className="text-center mb-8">
                                <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/50 animate-pulse">
                                    <Satellite className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">منصة التتبع الذكي</h2>
                                <p className="text-blue-200 text-sm mt-2">تسجيل الدخول للوحة التحكم المباشرة</p>
                            </div>

                            <form onSubmit={handleGpsLogin} className="space-y-5">
                                <div>
                                    <label className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1 block">اسم المستخدم / API Key</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-lg py-3 px-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="User ID"
                                            value={gpsLoginForm.username}
                                            onChange={e => setGpsLoginForm({...gpsLoginForm, username: e.target.value})}
                                        />
                                        <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1 block">كلمة المرور</label>
                                    <div className="relative">
                                        <input 
                                            type="password" 
                                            className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-lg py-3 px-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="•••••••"
                                            value={gpsLoginForm.password}
                                            onChange={e => setGpsLoginForm({...gpsLoginForm, password: e.target.value})}
                                        />
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isLoggingInGps}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg transform transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                                >
                                    {isLoggingInGps ? 'جاري الاتصال بالسيرفر...' : 'تسجيل الدخول'}
                                    {!isLoggingInGps && <Navigation className="h-5 w-5" />}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6 h-full animate-in fade-in duration-500">
                        {/* Vehicles List */}
                        <div className="w-full lg:w-1/3 bg-gray-50 rounded-xl border border-gray-200 p-4 overflow-y-auto flex flex-col">
                            <div className="flex justify-between items-center mb-4 shrink-0">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-green-600" />
                                    حالة الأسطول
                                </h3>
                                <button 
                                    onClick={() => setGpsAuthenticated(false)}
                                    className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                                >
                                    خروج
                                </button>
                            </div>
                            
                            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                                {vehicles.map(v => (
                                    <div 
                                    key={v.id} 
                                    onClick={() => v.gps && setSelectedVehicleId(v.id === selectedVehicleId ? null : v.id)}
                                    className={`
                                        bg-white p-3 rounded-lg shadow-sm border cursor-pointer transition-all relative overflow-hidden
                                        ${v.id === selectedVehicleId ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-300'}
                                        ${!v.gps ? 'opacity-70 grayscale' : ''}
                                    `}
                                    >
                                    <div className="flex justify-between items-start relative z-10">
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{v.model}</p>
                                            <p className="text-xs text-gray-500 font-mono">{v.plateNumber}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {v.gps ? (
                                                <span className={`text-[10px] px-1.5 rounded border ${v.gps.ignition === 'on' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                {v.gps.ignition === 'on' ? 'محرك يعمل' : 'متوقف'}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-red-50 text-red-500 px-1.5 rounded">Offline</span>
                                            )}
                                        </div>
                                    </div>
                                    {v.gps && (
                                        <div className="mt-3 pt-2 border-t border-gray-200/50 text-xs text-gray-600 grid grid-cols-2 gap-2 relative z-10">
                                            <div className="flex items-center gap-1">
                                                <Gauge className="h-3 w-3 text-blue-500" />
                                                <span className="font-mono font-bold">{v.gps.speed} km/h</span>
                                            </div>
                                            <div className="flex items-center gap-1 justify-end">
                                                <Fuel className={`h-3 w-3 ${v.gps.fuelLevel && v.gps.fuelLevel < 20 ? 'text-red-500' : 'text-green-500'}`} />
                                                <span className="font-mono">{v.gps.fuelLevel}%</span>
                                            </div>
                                            <div className="col-span-2 flex items-center gap-1 text-[10px] text-gray-400">
                                                <MapPin className="h-3 w-3" />
                                                <span className="truncate">{v.gps.address}</span>
                                            </div>
                                        </div>
                                    )}
                                    {v.gps && (
                                        <div 
                                            className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-1000" 
                                            style={{ width: `${v.gps.fuelLevel}%`, opacity: 0.3 }}
                                        ></div>
                                    )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Simulated Map Area */}
                        <div className="flex-1 bg-slate-200 rounded-xl border border-gray-200 relative overflow-hidden group shadow-inner" ref={mapRef}>
                            <div className="absolute inset-0 bg-slate-800"></div> {/* Dark Map Base */}
                            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.5 }}></div>
                            <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Cairo_downtown_map.png')] bg-cover bg-center opacity-40 grayscale mix-blend-overlay"></div>
                            
                            {/* Grid Lines */}
                            <div className="absolute inset-0 pointer-events-none border border-slate-700/30 m-4 rounded-lg"></div>

                            {vehicles.map((v, idx) => v.gps && (
                                <div 
                                    key={v.id} 
                                    className={`absolute flex flex-col items-center transition-all duration-1000 ease-linear z-10`}
                                    style={getMapPosition(v.gps.lat, v.gps.lng)}
                                    onClick={() => setSelectedVehicleId(v.id)}
                                >
                                    <div className="relative group/marker cursor-pointer">
                                        {/* Status Ring */}
                                        <div className={`absolute -inset-2 rounded-full opacity-40 animate-pulse ${v.id === selectedVehicleId ? 'bg-blue-500' : v.gps.speed > 0 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                        
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl transform hover:scale-110 transition-transform border-2 border-white ${
                                            v.id === selectedVehicleId ? 'bg-blue-600 scale-110' : 
                                            v.gps.speed > 0 ? 'bg-green-600' : 'bg-slate-600'
                                        }`}>
                                            <Car className="h-5 w-5" />
                                        </div>
                                        
                                        {/* Simple Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/marker:block bg-black/80 backdrop-blur text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg z-20">
                                            {v.plateNumber} | {v.gps.speed} km/h
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Detailed Info Card Overlay */}
                            {selectedVehicleId && (
                                <div className="absolute bottom-6 right-6 left-6 md:left-auto md:w-80 bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-4 z-20 text-white">
                                    {(() => {
                                    const v = vehicles.find(veh => veh.id === selectedVehicleId);
                                    if (!v || !v.gps) return null;
                                    return (
                                        <>
                                            <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3">
                                                <div>
                                                    <h3 className="font-bold text-lg text-white">{v.model}</h3>
                                                    <p className="text-slate-400 font-mono text-sm">{v.plateNumber}</p>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedVehicleId(null); }} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                                                    <div className="flex justify-center mb-1"><Gauge className="h-5 w-5 text-blue-400" /></div>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Speed</p>
                                                    <p className="font-bold font-mono text-lg">{v.gps.speed} <span className="text-xs font-normal">km/h</span></p>
                                                </div>
                                                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center relative overflow-hidden">
                                                    <div className="flex justify-center mb-1"><Fuel className="h-5 w-5 text-orange-400" /></div>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Fuel</p>
                                                    <p className="font-bold font-mono text-lg">{v.gps.fuelLevel}%</p>
                                                    <div className="absolute bottom-0 left-0 h-1 bg-orange-500/50" style={{ width: `${v.gps.fuelLevel}%` }}></div>
                                                </div>
                                                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                                                    <div className="flex justify-center mb-1"><Zap className="h-5 w-5 text-yellow-400" /></div>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Engine</p>
                                                    <p className={`font-bold ${v.gps.ignition === 'on' ? 'text-green-400' : 'text-slate-500'}`}>
                                                        {v.gps.ignition === 'on' ? 'ON' : 'OFF'}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                                                    <div className="flex justify-center mb-1"><Battery className="h-5 w-5 text-purple-400" /></div>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Battery</p>
                                                    <p className="font-bold font-mono text-lg">{v.gps.batteryVoltage} V</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800 p-3 rounded-lg border border-slate-700 mb-3">
                                                <MapPin className="h-4 w-4 text-red-400 flex-shrink-0" />
                                                <span className="truncate">{v.gps.address}</span>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                                                    <PlayCircle className="h-4 w-4" />
                                                    Replay
                                                </button>
                                                <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-xs font-bold transition-colors">
                                                    History
                                                </button>
                                            </div>
                                        </>
                                    );
                                    })()}
                                </div>
                            )}
                            
                            <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur p-2 rounded text-[10px] text-slate-400 border border-slate-700">
                                Live Simulation Mode (Cairo Region)
                            </div>
                        </div>
                    </div>
                )}
            </div>
         )}

      </div>

      {/* Add Vehicle Modal */}
      {isAddVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800">{editingVehicleId ? 'تعديل بيانات المركبة' : 'إضافة مركبة جديدة'}</h3>
                 <button onClick={() => setIsAddVehicleModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">موديل المركبة</label><input type="text" required className="w-full p-2 rounded-lg border border-gray-300" placeholder="مثال: تويوتا كورولا 2024" value={newVehicleForm.model} onChange={e => setNewVehicleForm({...newVehicleForm, model: e.target.value})} /></div>
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">رقم اللوحة</label><input type="text" required className="w-full p-2 rounded-lg border border-gray-300 font-mono text-center" placeholder="أ ب ج 123" value={newVehicleForm.plateNumber} onChange={e => setNewVehicleForm({...newVehicleForm, plateNumber: e.target.value})} /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">النوع</label><select className="w-full p-2 rounded-lg border border-gray-300" value={newVehicleForm.type} onChange={e => setNewVehicleForm({...newVehicleForm, type: e.target.value as any})}><option value="سيارة">سيارة</option><option value="باص">باص</option><option value="شاحنة">شاحنة</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">قراءة العداد</label><input type="number" className="w-full p-2 rounded-lg border border-gray-300" value={newVehicleForm.currentOdometer} onChange={e => setNewVehicleForm({...newVehicleForm, currentOdometer: Number(e.target.value)})} /></div>
                 </div>
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">تاريخ انتهاء الرخصة</label><input type="date" required className="w-full p-2 rounded-lg border border-gray-300" value={newVehicleForm.licenseExpiry} onChange={e => setNewVehicleForm({...newVehicleForm, licenseExpiry: e.target.value})} /></div>
                 <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition mt-2">{editingVehicleId ? 'حفظ التعديلات' : 'حفظ المركبة'}</button>
              </form>
           </div>
        </div>
      )}
      
      {/* Add Driver Modal */}
      {isAddDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800">تعيين سائق جديد</h3>
                 <button onClick={() => setIsAddDriverModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleAddDriver} className="p-6 space-y-4">
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم السائق (الموظف)</label><input type="text" required className="w-full p-2 rounded-lg border border-gray-300" placeholder="الاسم الكامل" value={newDriverForm.employeeName} onChange={e => setNewDriverForm({...newDriverForm, employeeName: e.target.value})} /></div>
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">رقم الرخصة</label><input type="text" required className="w-full p-2 rounded-lg border border-gray-300 font-mono" placeholder="رقم رخصة القيادة" value={newDriverForm.licenseNumber} onChange={e => setNewDriverForm({...newDriverForm, licenseNumber: e.target.value})} /></div>
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">درجة الرخصة</label><select className="w-full p-2 rounded-lg border border-gray-300" value={newDriverForm.licenseType} onChange={e => setNewDriverForm({...newDriverForm, licenseType: e.target.value})}><option value="درجة أولى">درجة أولى</option><option value="درجة ثانية">درجة ثانية</option><option value="درجة ثالثة">درجة ثالثة</option><option value="خاصة">خاصة</option></select></div>
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">تاريخ انتهاء الرخصة</label><input type="date" required className="w-full p-2 rounded-lg border border-gray-300" value={newDriverForm.licenseExpiry} onChange={e => setNewDriverForm({...newDriverForm, licenseExpiry: e.target.value})} /></div>
                 <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition mt-2">حفظ البيانات</button>
              </form>
           </div>
        </div>
      )}

      {/* Add Maintenance Modal */}
      {isAddMaintenanceOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-indigo-600" />
                      طلب صيانة جديد
                  </h3>
                  <button onClick={() => setIsAddMaintenanceOpen(false)}><X className="h-5 w-5" /></button>
               </div>
               
               <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-yellow-800 text-xs mb-4 flex gap-2">
                   <AlertCircle className="h-4 w-4" />
                   <span>سيتم إرسال الطلب للمراجعة والاعتماد قبل الصرف.</span>
               </div>

               <form onSubmit={handleAddMaintenance} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">المركبة</label>
                     <select className="w-full p-2 rounded-lg border border-gray-300" required onChange={e => setNewMaint({...newMaint, vehicleId: e.target.value})}>
                        <option value="">اختر المركبة</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} - {v.model}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">نوع الصيانة</label>
                     <select className="w-full p-2 rounded border" value={newMaint.type} onChange={e => setNewMaint({...newMaint, type: e.target.value})}>
                        {maintenanceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">التكلفة التقديرية</label>
                     <input type="number" required className="w-full p-2 rounded-lg border border-gray-300" placeholder="0.00" onChange={e => setNewMaint({...newMaint, cost: Number(e.target.value)})} />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">وصف العطل / الصيانة</label>
                     <input type="text" required className="w-full p-2 rounded-lg border border-gray-300" placeholder="الوصف" onChange={e => setNewMaint({...newMaint, desc: e.target.value})} />
                  </div>
                  
                  {/* File Attachment */}
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">مرفق (صورة / فاتورة مبدئية)</label>
                      <input 
                          type="file" 
                          ref={maintenanceFileRef} 
                          className="hidden" 
                          accept="image/*,.pdf" 
                          onChange={handleMaintenanceFileChange} 
                      />
                      <button 
                          type="button" 
                          onClick={() => maintenanceFileRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-gray-300 rounded hover:bg-gray-50 text-gray-600 text-sm"
                      >
                          <Paperclip className="h-4 w-4" />
                          {newMaint.file ? newMaint.file.name : 'إرفاق ملف'}
                      </button>
                  </div>

                  <div className="flex gap-2 pt-2">
                      <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-sm">إرسال الطلب</button>
                      <button type="button" onClick={() => setIsAddMaintenanceOpen(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">إلغاء</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default Transport;
