--- START OF FILE src/pages/Transport.tsx ---
(
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
)

--- START OF FILE src/pages/AdminKeyGenerator.tsx ---
(
import React, { useState } from 'react';
import { generateLicenseKey } from '../utils/security';
import { Shield, Lock, Key, Copy, Check, Terminal, CalendarClock } from 'lucide-react';

const AdminKeyGenerator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [clientDeviceId, setClientDeviceId] = useState('');
  const [duration, setDuration] = useState(365); // Default 1 Year
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);

  // Hardcoded Admin Credentials
  const ADMIN_USER = 'master';
  const ADMIN_PASS = 'nizam2030';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('بيانات الدخول غير صحيحة');
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientDeviceId.length < 5) {
      alert('الرجاء إدخال رقم جهاز صحيح');
      return;
    }
    const key = generateLicenseKey(clientDeviceId, Number(duration));
    setGeneratedKey(key);
    setCopied(false);
  };

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(generatedKey).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        // Fallback if clipboard API fails despite being present
        fallbackCopy(generatedKey);
      });
    } else {
      // Fallback for non-secure contexts
      fallbackCopy(generatedKey);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; // Avoid scrolling
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        alert('فشل النسخ تلقائياً');
      }
    } catch (err) {
      alert('فشل النسخ تلقائياً');
    }
    
    document.body.removeChild(textArea);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
          <div className="text-center mb-8">
            <div className="bg-indigo-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">مولد التراخيص</h1>
            <p className="text-slate-400 text-sm mt-2">منطقة محظورة: للمسؤولين فقط</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">اسم المسؤول</label>
              <input 
                type="text" 
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">كلمة المرور</label>
              <input 
                type="password" 
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg">
              دخول للنظام
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans" dir="rtl">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-2 rounded-lg">
               <Terminal className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg">نظام التفعيل المركزي</h2>
              <p className="text-xs text-slate-400">Advanced License Manager</p>
            </div>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="text-sm text-red-400 hover:text-red-300">خروج</button>
        </div>

        {/* Generator Card */}
        <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-6 md:p-8">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-indigo-400 font-medium mb-2">
                <Lock className="h-4 w-4" />
                رقم جهاز العميل (Device ID)
              </label>
              <input 
                type="text" 
                placeholder="XXXX-XXXX-XXXX"
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-lg tracking-wider text-center rounded-xl p-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none uppercase placeholder-slate-600"
                value={clientDeviceId}
                onChange={e => setClientDeviceId(e.target.value)}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-indigo-400 font-medium mb-2">
                <CalendarClock className="h-4 w-4" />
                مدة الصلاحية
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
              >

                <option value={1}>يوم واحد (1 يوم)</option>
                <option value={30}>شهر واحد (30 يوم)</option>
                <option value={90}>3 أشهر (90 يوم)</option>
                <option value={180}>6 أشهر (180 يوم)</option>
                <option value={365}>سنة كاملة (365 يوم)</option>
                <option value={730}>سنتين (730 يوم)</option>
                <option value={3650}>مدى الحياة (10 سنوات)</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/20 transition-all transform active:scale-95"
            >
              توليد كود التفعيل
            </button>
          </form>

          {/* Result Area */}
          {generatedKey && (
            <div className="mt-8 animate-in slide-in-from-bottom-4 duration-300">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
                <div className="relative bg-slate-950 border border-slate-700 rounded-xl p-6 text-center">
                  <p className="text-slate-400 text-sm mb-2">كود التفعيل (License Key)</p>
                  <div className="text-2xl font-mono font-bold text-green-400 tracking-widest break-all mb-4 select-all">
                    {generatedKey}
                  </div>
                  
                  <button onClick={handleCopy} className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg transition-colors text-sm font-medium">
                    {copied ? <><Check className="h-4 w-4 text-green-500" /> تم النسخ</> : <><Copy className="h-4 w-4" /> نسخ الكود</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminKeyGenerator;
)


--- START OF FILE src/pages/Appearance.tsx ---
(import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Palette, Globe, CheckCircle } from 'lucide-react';
import { ThemeColor } from '../translations';

const Appearance: React.FC = () => {
  const { t, language, setLanguage, themeColor, setThemeColor } = useContext(AppContext);

  const colors: {id: ThemeColor, label: string, hex: string}[] = [
      { id: 'indigo', label: t('blue'), hex: '#4f46e5' },
      { id: 'emerald', label: t('green'), hex: '#10b981' },
      { id: 'violet', label: t('purple'), hex: '#8b5cf6' },
      { id: 'rose', label: t('red'), hex: '#f43f5e' },
      { id: 'amber', label: t('orange'), hex: '#f59e0b' },
      { id: 'slate', label: t('black'), hex: '#1e293b' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{t('appearance')}</h2>
        <p className="text-sm text-gray-500">تخصيص ألوان النظام ولغة الواجهة</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Language Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Globe className="h-5 w-5 text-indigo-600" />
                {t('language')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    onClick={() => setLanguage('ar')}
                    className={`relative p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${language === 'ar' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🇪🇬</span>
                        <div className="text-right">
                            <span className={`block font-bold ${language === 'ar' ? 'text-indigo-900' : 'text-gray-700'}`}>العربية</span>
                            <span className="text-xs text-gray-500">الواجهة العربية (RTL)</span>
                        </div>
                    </div>
                    {language === 'ar' && <div className="bg-indigo-600 text-white p-1 rounded-full"><CheckCircle className="h-4 w-4" /></div>}
                </button>

                <button 
                    onClick={() => setLanguage('en')}
                    className={`relative p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${language === 'en' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🇺🇸</span>
                        <div className="text-left">
                            <span className={`block font-bold ${language === 'en' ? 'text-indigo-900' : 'text-gray-700'}`}>English</span>
                            <span className="text-xs text-gray-500">English Interface (LTR)</span>
                        </div>
                    </div>
                    {language === 'en' && <div className="bg-indigo-600 text-white p-1 rounded-full"><CheckCircle className="h-4 w-4" /></div>}
                </button>
            </div>
        </div>

        {/* Theme Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Palette className="h-5 w-5 text-indigo-600" />
                {t('themeColor')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {colors.map(color => (
                    <button
                        key={color.id}
                        onClick={() => setThemeColor(color.id)}
                        className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${themeColor === color.id ? `border-${color.id}-500 bg-gray-50 shadow-md` : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                    >
                        <div className="w-12 h-12 rounded-full mb-3 shadow-sm flex items-center justify-center text-white transition-transform transform" style={{ backgroundColor: color.hex }}>
                            {themeColor === color.id && <CheckCircle className="h-6 w-6" />}
                        </div>
                        <span className={`text-sm font-bold ${themeColor === color.id ? 'text-gray-900' : 'text-gray-500'}`}>{color.label}</span>
                    </button>
                ))}
            </div>
            
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                    سيتم تطبيق اللون المختار على الأزرار، القوائم، والخلفيات في جميع أنحاء النظام فوراً.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Appearance;)


--- START OF FILE src/pages/Attendance.tsx ---
(
import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_ATTENDANCE, MOCK_EMPLOYEES, MOCK_DEVICES, MOCK_SHIFTS } from '../constants';
import { BiometricDevice, AttendanceRecord, Employee, Shift } from '../types';
import { Search, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertTriangle, MapPin, Cpu, RefreshCw, Plus, X, Wifi, WifiOff, Fingerprint, Trash2, Activity, Radar, UserPlus, Server, Eraser } from 'lucide-react';
import DataControls from '../components/DataControls';
import { api } from '../services/api';

const Attendance: React.FC = () => {
  // Always default to today's date dynamically
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('attendance_data');
    if (saved) return JSON.parse(saved);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_ATTENDANCE : [];
  });
  
  const [devices, setDevices] = useState<BiometricDevice[]>(() => {
    const savedDevices = localStorage.getItem('biometric_devices');
    if (savedDevices) return JSON.parse(savedDevices);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_DEVICES : [];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
      const saved = localStorage.getItem('employees_data');
      return saved ? JSON.parse(saved) : MOCK_EMPLOYEES;
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
      const saved = localStorage.getItem('shifts_data');
      return saved ? JSON.parse(saved) : MOCK_SHIFTS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isServerOnline, setIsServerOnline] = useState(false);
  
  const [colFilters, setColFilters] = useState({
    code: '',
    name: '',
    checkIn: '',
    checkOut: '',
    status: 'all'
  });
  
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isAddDeviceMode, setIsAddDeviceMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([]);

  const [newDevice, setNewDevice] = useState({
    name: '',
    ip: '',
    port: '4370',
    type: 'ZK',
    location: ''
  });

  const isAdmin = true;

  // Cache Employee Map for faster lookup
  const employeeMap = useMemo(() => {
      const map = new Map();
      employees.forEach(e => map.set(e.employeeCode, e));
      return map;
  }, [employees]);

  // Check server health locally
  useEffect(() => {
    const checkServer = async () => {
      try {
        await api.checkHealth();
        setIsServerOnline(true);
      } catch (e) {
        setIsServerOnline(false);
      }
    };
    if (isDeviceModalOpen) checkServer();
  }, [isDeviceModalOpen]);

  useEffect(() => {
    localStorage.setItem('biometric_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('attendance_data', JSON.stringify(attendanceData));
  }, [attendanceData]);

  const getEmpCode = (name: string) => employees.find(e => e.name === name)?.employeeCode || '-';

  const filteredData = attendanceData.filter(d => {
     const code = d.employeeCode || getEmpCode(d.employeeName);
     // Loose comparison for date to handle potential whitespace
     const matchesDate = (d.date || '').trim() === date.trim();
     const matchesSearch = d.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || code.toLowerCase().includes(searchTerm.toLowerCase());
     
     // Specific Filters
     const matchesCode = d.employeeCode?.toLowerCase().includes(colFilters.code.toLowerCase()) ?? true;
     const matchesName = d.employeeName.toLowerCase().includes(colFilters.name.toLowerCase());
     const matchesCheckIn = d.checkIn.includes(colFilters.checkIn);
     const matchesCheckOut = d.checkOut.includes(colFilters.checkOut);
     const matchesStatus = colFilters.status === 'all' || d.status === colFilters.status;

     return matchesDate && matchesSearch && matchesCode && matchesName && matchesCheckIn && matchesCheckOut && matchesStatus;
  });

  const handleImport = (data: any[]) => {
    setAttendanceData([...attendanceData, ...data.map((d, i) => ({ ...d, id: `IMP-ATT-${i}` }))]);
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف سجل الحضور هذا؟')) {
      setAttendanceData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleDeleteDay = () => {
      const targetDate = date.trim();
      const recordsToDelete = attendanceData.filter(d => (d.date || '').trim() === targetDate);
      const count = recordsToDelete.length;

      if (count === 0) {
          alert(`لا توجد سجلات بتاريخ (${targetDate}) لحذفها.`);
          return;
      }

      if (window.confirm(`تحذير: سيتم حذف جميع سجلات الحضور والانصراف ليوم (${targetDate}).\nالعدد: ${count} سجل.\n\nهل أنت متأكد؟`)) {
          const newData = attendanceData.filter(d => (d.date || '').trim() !== targetDate);
          setAttendanceData(newData);
          setTimeout(() => alert('تم حذف سجلات اليوم بنجاح.'), 50);
      }
  };

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    addDeviceToList(newDevice);
  };

  const addDeviceToList = (deviceData: any) => {
    const device: BiometricDevice = {
      id: `DEV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: deviceData.name,
      ip: deviceData.ip,
      port: deviceData.port,
      type: deviceData.type as any,
      location: deviceData.location,
      status: 'online', 
      lastSync: 'لم يتم'
    };
    setDevices(prevDevices => [...prevDevices, device]);
    setIsAddDeviceMode(false);
    setNewDevice({ name: '', ip: '', port: '4370', type: 'ZK', location: '' });
    setDiscoveredDevices(prev => prev.filter(d => d.ip !== deviceData.ip));
  };

  const handleDeleteDevice = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف جهاز البصمة هذا؟')) {
      setDevices(prevDevices => prevDevices.filter(d => d.id !== id));
    }
  };

  const handlePingDevice = async (device: BiometricDevice) => {
     if (!isServerOnline) {
         alert('السيرفر غير متصل. يرجى تشغيل server.js أولاً.');
         return;
     }
     try {
       await api.checkHealth();
       alert(`✅ السيرفر متصل.\nجاري التحقق من الجهاز ${device.ip}...`);
     } catch (e) {
       alert(`⚠️ السيرفر غير متصل.`);
     }
  };

  const handleScanNetwork = async () => {
    if (!isServerOnline) {
        alert('لا يمكن البحث. السيرفر غير متصل (Offline).');
        return;
    }
    setIsScanning(true);
    setDiscoveredDevices([]);
    try {
      const response = await api.scanForDevices();
      if (response.success && response.devices.length > 0) {
        setDiscoveredDevices(response.devices);
      } else {
        alert('تم البحث في الشبكة ولم يتم العثور على أجهزة ZK نشطة.');
      }
    } catch (e) {
      alert('خطأ أثناء البحث.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSyncAll = async () => {
    if (!isServerOnline) {
        alert('الخادم غير متصل. لا يمكن سحب البيانات.');
        return;
    }
    setIsSyncing(true);
    const onlineDevices = devices.filter(d => d.status === 'online');
    
    if (onlineDevices.length === 0) {
        alert('لا يوجد أجهزة متصلة (Online) للمزامنة.');
        setIsSyncing(false);
        return;
    }

    let successCount = 0;
    let failCount = 0;
    let reportDetails = [];
    let allLogs: any[] = []; 

    for (const device of onlineDevices) {
        const result = await performSync(device);
        if (result.success && Array.isArray(result.data)) {
            successCount++;
            allLogs = [...allLogs, ...result.data]; 
            reportDetails.push(`✅ ${device.name}: ${result.data.length}`);
        } else {
            failCount++;
            reportDetails.push(`❌ ${device.name}: ${result.message}`);
        }
    }

    if (allLogs.length > 0) {
        // Using optimized processing
        processMergedLogsOptimized(allLogs);
    }

    setIsSyncing(false);
    const reportMsg = `تقرير المزامنة (${date}):\n----------------\n✅ نجاح: ${successCount} | ❌ فشل: ${failCount}\n📥 إجمالي الحركات المجمعة: ${allLogs.length}\n\n${reportDetails.join('\n')}`;
    alert(reportMsg);
  };

  const handleSingleSync = async (device: BiometricDevice) => {
      if (!isServerOnline) {
          alert('الخادم غير متصل.');
          return;
      }
      const btnId = `sync-btn-${device.id}`;
      const btn = document.getElementById(btnId);
      if(btn) btn.classList.add('animate-spin');

      const result = await performSync(device);
      
      if(btn) btn.classList.remove('animate-spin');

      if (result.success && Array.isArray(result.data)) {
          processMergedLogsOptimized(result.data); 
          alert(`✅ تم سحب ${result.data.length} حركة من جهاز ${device.name} ودمجها بنجاح.`);
      } else {
          alert(`❌ فشل السحب من ${device.name}: ${result.message}`);
      }
  };

  const performSync = async (device: BiometricDevice) => {
      try {
          const response = await api.syncAttendance(device.ip, device.port, device.type, date);
          if (response && response.success) {
              const now = new Date().toLocaleString('ar-EG');
              setDevices(prev => prev.map(d => d.id === device.id ? { ...d, lastSync: now } : d));
              return { success: true, data: response.data };
          } else {
              return { success: false, message: response?.message || 'فشل' };
          }
      } catch (error: any) {
          return { success: false, message: error.message };
      }
  };

  // --- OPTIMIZED MERGE LOGIC (Using Map) ---
  const processMergedLogsOptimized = (logs: any[]) => {
    if (!Array.isArray(logs) || logs.length === 0) return;

    // 1. Create a Map of existing records for O(1) lookup
    const recordsMap = new Map<string, AttendanceRecord>();
    attendanceData.forEach(record => {
        const key = `${record.employeeCode}|${record.date}`;
        recordsMap.set(key, record);
    });

    // 2. Process new logs
    logs.forEach((log: any) => {
        const logCodeStr = String(log.employeeCode).trim();
        const logDate = log.date;
        const logTime = log.timestamp; // HH:MM
        const key = `${logCodeStr}|${logDate}`;

        const existingRecord = recordsMap.get(key);
        const employee = employeeMap.get(logCodeStr);
        // Determine Shift Start Time (default to 09:00 if not found)
        let shiftStart = '09:00';
        if (employee && employee.shiftId) {
            const shift = shifts.find(s => s.id === employee.shiftId);
            if (shift) shiftStart = shift.startTime;
        }

        if (existingRecord) {
            // Update logic
            let newCheckIn = existingRecord.checkIn;
            let newCheckOut = existingRecord.checkOut;

            if (newCheckIn === '-' || (logTime < newCheckIn && newCheckIn !== '-')) {
                newCheckIn = logTime;
            }

            if (newCheckOut === '-' || (logTime > newCheckOut && newCheckOut !== '-')) {
                if (newCheckIn !== '-' && logTime > newCheckIn) {
                    newCheckOut = logTime;
                }
            }

            const updatedRecord = {
                ...existingRecord,
                checkIn: newCheckIn,
                checkOut: newCheckOut,
                status: calculateStatus(newCheckIn, shiftStart),
                workHours: calculateWorkHours(newCheckIn, newCheckOut)
            };
            recordsMap.set(key, updatedRecord);

        } else {
            // Create new record
            const newRecord: AttendanceRecord = {
                id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                employeeId: employee ? employee.id : 'UNKNOWN',
                employeeName: employee ? employee.name : `موظف غير مسجل (${logCodeStr})`,
                employeeCode: logCodeStr,
                date: logDate,
                checkIn: logTime,
                checkOut: '-',
                status: calculateStatus(logTime, shiftStart),
                workHours: 0, 
                source: 'Fingerprint'
            };
            recordsMap.set(key, newRecord);
        }
    });

    setAttendanceData(Array.from(recordsMap.values()));
  };

  const calculateStatus = (checkIn: string, threshold: string): 'present' | 'late' | 'absent' | 'excused' => {
      if (checkIn === '-' || !checkIn) return 'absent';
      // Compare HH:MM strings directly works because they are 24-hour format padded
      if (checkIn > threshold) return 'late';
      return 'present';
  };

  const calculateWorkHours = (inTime: string, outTime: string): number => {
      if (inTime === '-' || outTime === '-') return 0;
      const [h1, m1] = inTime.split(':').map(Number);
      const [h2, m2] = outTime.split(':').map(Number);
      const totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
      return totalMinutes > 0 ? parseFloat((totalMinutes / 60).toFixed(1)) : 0;
  };

  // Check late based on employee specific shift
  const isLate = (time: string, employeeCode: string) => {
    if (!time || time === '-') return false;
    const employee = employeeMap.get(employeeCode);
    let shiftStart = '09:00';
    if (employee && employee.shiftId) {
        const shift = shifts.find(s => s.id === employee.shiftId);
        if (shift) shiftStart = shift.startTime;
    }
    return time > shiftStart;
  };

  const stats = [
    { title: 'إجمالي الحضور', value: filteredData.filter(d => d.status === 'present').length.toString(), color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle },
    { title: 'غياب', value: filteredData.filter(d => d.status === 'absent').length.toString(), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
    { title: 'تأخير', value: filteredData.filter(d => d.status === 'late').length.toString(), color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: Clock },
    { title: 'مأموريات', value: filteredData.filter(d => d.status === 'excused').length.toString(), color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: MapPin },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">سجل الحضور والانصراف</h2>
          <p className="text-sm text-gray-500 mt-1">متابعة ساعات العمل، التأخير، والغياب اليومي (يعتمد على الورديات)</p>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setIsDeviceModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-slate-800 text-white px-4 py-2.5 shadow-md hover:bg-slate-900 transition-all">
             <Cpu className="h-5 w-5" /><span>أجهزة البصمة</span>
           </button>
           <DataControls data={filteredData} fileName="attendance_report" isAdmin={isAdmin} onImport={handleImport} headers={[{ key: 'employeeCode', label: 'الكود' }, { key: 'employeeName', label: 'الموظف' }, { key: 'date', label: 'التاريخ' }, { key: 'checkIn', label: 'حضور' }, { key: 'checkOut', label: 'انصراف' }, { key: 'workHours', label: 'الساعات' }, { key: 'status', label: 'الحالة' }]} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
         {stats.map((stat, idx) => (
           <div key={idx} className={`bg-white p-5 rounded-xl shadow-sm border ${stat.border} hover:shadow-md transition-all`}>
              <div className="flex justify-between items-start">
                <div><p className="text-gray-500 text-sm font-medium mb-1">{stat.title}</p><p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p></div>
                <div className={`${stat.bg} p-3 rounded-full`}><stat.icon className={`h-6 w-6 ${stat.color}`} /></div>
              </div>
           </div>
         ))}
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex gap-4 items-center w-full">
              <div className="relative w-full sm:w-64">
                <CalendarIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-3 text-gray-700 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer" />
              </div>
              
              <button 
                type="button"
                onClick={handleDeleteDay}
                className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-100 transition-colors text-sm font-bold whitespace-nowrap"
                title="حذف جميع البيانات لهذا اليوم"
              >
                <Eraser className="h-4 w-4" />
                حذف سجلات اليوم
              </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="بحث سريع..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-4 focus:border-indigo-500 focus:outline-none transition-all" />
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-right text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-semibold bg-gray-50 w-24">الكود</th>
                <th className="px-6 py-4 font-semibold bg-gray-50">الموظف</th>
                <th className="px-6 py-4 font-semibold bg-gray-50">التاريخ</th>
                <th className="px-6 py-4 font-semibold bg-gray-50">حضور</th>
                <th className="px-6 py-4 font-semibold bg-gray-50">انصراف</th>
                <th className="px-6 py-4 font-semibold bg-gray-50">الساعات</th>
                <th className="px-6 py-4 font-semibold bg-gray-50">المصدر</th>
                <th className="px-6 py-4 font-semibold bg-gray-50">الحالة</th>
                <th className="px-6 py-4 font-semibold bg-gray-50 w-16"></th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-2 py-1"><input className="w-full text-xs p-1 border rounded" placeholder="كود..." value={colFilters.code} onChange={e => setColFilters({...colFilters, code: e.target.value})} /></th>
                <th className="px-2 py-1"><input className="w-full text-xs p-1 border rounded" placeholder="اسم..." value={colFilters.name} onChange={e => setColFilters({...colFilters, name: e.target.value})} /></th>
                <th className="px-2 py-1 bg-gray-100"></th>
                <th className="px-2 py-1"><input className="w-full text-xs p-1 border rounded" placeholder="دخول..." value={colFilters.checkIn} onChange={e => setColFilters({...colFilters, checkIn: e.target.value})} /></th>
                <th className="px-2 py-1"><input className="w-full text-xs p-1 border rounded" placeholder="خروج..." value={colFilters.checkOut} onChange={e => setColFilters({...colFilters, checkOut: e.target.value})} /></th>
                <th className="px-2 py-1 bg-gray-100"></th>
                <th className="px-2 py-1 bg-gray-100"></th>
                <th className="px-2 py-1"><select className="w-full text-xs p-1 border rounded" value={colFilters.status} onChange={e => setColFilters({...colFilters, status: e.target.value})}><option value="all">الكل</option><option value="present">حضور</option><option value="absent">غياب</option><option value="late">تأخير</option></select></th>
                <th className="px-2 py-1 bg-gray-100"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.length > 0 ? (
                filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-500">{record.employeeCode || getEmpCode(record.employeeName)}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                        {record.employeeName.includes('غير مسجل') ? (
                            <div className="flex items-center gap-2"><span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100 flex items-center gap-1 font-bold"><AlertTriangle className="h-3 w-3" />غير مسجل</span><button className="text-xs text-indigo-600 hover:underline flex items-center gap-1" title="إضافة الموظف"><UserPlus className="h-3 w-3" />تعريف</button></div>
                        ) : record.employeeName}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono tracking-wide">{record.date}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono relative">{record.checkIn}{isLate(record.checkIn, record.employeeCode || '') && <span className="absolute -top-1 right-2 w-2 h-2 bg-red-500 rounded-full" title="تأخير"></span>}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono relative">{record.checkOut}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{record.workHours}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{record.source === 'Fingerprint' && <span className="flex items-center gap-1"><Fingerprint className="h-3 w-3" /> بصمة</span>}{record.source === 'Manual' && <span className="flex items-center gap-1"> يدوي</span>}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${record.status === 'present' ? 'bg-green-50 text-green-700 border-green-100' : record.status === 'absent' ? 'bg-red-50 text-red-700 border-red-100' : record.status === 'late' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>{record.status === 'present' && <CheckCircle className="h-3 w-3" />}{record.status === 'absent' && <XCircle className="h-3 w-3" />}{record.status === 'late' && <AlertTriangle className="h-3 w-3" />}{record.status === 'excused' && <MapPin className="h-3 w-3" />}{record.status === 'present' ? 'حضور' : record.status === 'absent' ? 'غياب' : record.status === 'late' ? 'تأخير' : 'مأمورية'}</span></td>
                    <td className="px-6 py-4"><button onClick={() => handleDeleteRecord(record.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="حذف السجل"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-400 bg-gray-50"><div className="flex flex-col items-center justify-center gap-2"><Clock className="h-8 w-8 text-gray-300" /><p>لا توجد سجلات مطابقة لهذا اليوم</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDeviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-gray-100 p-6 bg-slate-50 rounded-t-2xl">
                 <div><h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Cpu className="h-6 w-6 text-indigo-600" />إدارة أجهزة البصمة</h3><p className="text-sm text-slate-500 mt-1">ربط وسحب البيانات من أجهزة الحضور (ZK, Timy)</p></div>
                 <button onClick={() => setIsDeviceModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"><X className="h-6 w-6" /></button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                 {!isServerOnline && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-4 flex items-center gap-3">
                        <Server className="h-6 w-6" />
                        <div>
                            <p className="font-bold">الخادم غير متصل</p>
                            <p className="text-sm">لا يمكن سحب البيانات أو البحث عن أجهزة. يرجى تشغيل `node server.js` في مجلد المشروع.</p>
                        </div>
                    </div>
                 )}

                 <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                    <div className="flex items-center gap-3"><h4 className="font-bold text-slate-700">الأجهزة المتصلة</h4><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{devices.length}</span></div>
                    <div className="flex flex-wrap gap-2">
                       <button onClick={handleScanNetwork} disabled={isScanning || !isServerOnline} className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-100 transition text-sm font-medium disabled:opacity-50"><Radar className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />{isScanning ? 'جاري البحث...' : 'بحث عن أجهزة'}</button>
                       <button onClick={handleSyncAll} disabled={isSyncing || !isServerOnline} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition text-sm font-medium disabled:opacity-50" title={`سحب البيانات من جميع الأجهزة ليوم: ${date}`}><RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />{isSyncing ? 'جاري السحب...' : 'سحب ودمج الكل'}</button>
                       <button onClick={() => setIsAddDeviceMode(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"><Plus className="h-4 w-4" />إضافة جهاز</button>
                    </div>
                 </div>

                 {discoveredDevices.length > 0 && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 animate-in slide-in-from-top-2">
                       <h5 className="font-bold text-green-800 text-sm mb-3 flex items-center gap-2"><Wifi className="h-4 w-4" />أجهزة تم اكتشافها على الشبكة</h5>
                       <div className="space-y-2">
                          {discoveredDevices.map((dev, idx) => (
                             <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                                <div><div className="font-bold text-gray-800 text-sm">{dev.name}</div><div className="text-xs text-gray-500 font-mono mt-0.5">{dev.ip}:{dev.port}</div></div>
                                <div className="flex items-center gap-2"><span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{dev.type}</span><button onClick={() => addDeviceToList(dev)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition">إضافة</button></div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {isAddDeviceMode && (
                    <form onSubmit={handleAddDevice} className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                       <div className="md:col-span-1"><label className="block text-xs text-indigo-800 mb-1 font-bold">اسم الجهاز / الموقع</label><input type="text" required className="w-full p-2 rounded border border-indigo-200 text-sm" placeholder="مثال: البوابة الرئيسية" value={newDevice.name} onChange={e => setNewDevice({...newDevice, name: e.target.value})} /></div>
                       <div><label className="block text-xs text-indigo-800 mb-1 font-bold">IP Address</label><input type="text" required className="w-full p-2 rounded border border-indigo-200 text-sm font-mono" placeholder="192.168.1.201" value={newDevice.ip} onChange={e => setNewDevice({...newDevice, ip: e.target.value})} /></div>
                       <div><label className="block text-xs text-indigo-800 mb-1 font-bold">Port</label><input type="text" required className="w-full p-2 rounded border border-indigo-200 text-sm font-mono" placeholder="4370" value={newDevice.port} onChange={e => setNewDevice({...newDevice, port: e.target.value})} /></div>
                       <div><label className="block text-xs text-indigo-800 mb-1 font-bold">النوع (Model)</label><select className="w-full p-2 rounded border border-indigo-200 text-sm" value={newDevice.type} onChange={e => setNewDevice({...newDevice, type: e.target.value})}><option value="ZK">ZK Teco</option><option value="Timy">Timy</option><option value="Hikvision">Hikvision</option><option value="Other">Other (Generic)</option></select></div>
                       <div className="flex gap-2"><button type="submit" className="flex-1 bg-indigo-600 text-white p-2 rounded text-sm hover:bg-indigo-700">حفظ</button><button type="button" onClick={() => setIsAddDeviceMode(false)} className="bg-white text-indigo-600 border border-indigo-200 p-2 rounded text-sm hover:bg-indigo-50">إلغاء</button></div>
                    </form>
                 )}

                 <div className="space-y-3">
                    {devices.map(device => (
                       <div key={device.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors group">
                          <div className="flex items-center gap-4">
                             <div className={`p-3 rounded-full ${device.status === 'online' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{device.status === 'online' ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}</div>
                             <div>
                                <h5 className="font-bold text-slate-800">{device.name}</h5>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1"><span className="font-mono bg-slate-100 px-1.5 rounded">{device.ip}:{device.port}</span><span className="bg-indigo-50 text-indigo-700 px-1.5 rounded font-medium">{device.type}</span><span>{device.location}</span></div>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="text-left hidden sm:block"><div className="text-xs text-slate-400 mb-1">آخر مزامنة</div><div className="font-mono text-sm text-slate-700">{device.lastSync}</div></div>
                             <div className="flex gap-2">
                                <button id={`sync-btn-${device.id}`} onClick={() => handleSingleSync(device)} disabled={!isServerOnline} className={`p-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded transition-colors ${!isServerOnline && 'opacity-50 cursor-not-allowed'}`} title={`سحب البيانات من ${device.name}`}><RefreshCw className="h-4 w-4" /></button>
                                <button onClick={() => handlePingDevice(device)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="اختبار الاتصال"><Activity className="h-4 w-4" /></button>
                                <button onClick={() => handleDeleteDevice(device.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="حذف الجهاز"><Trash2 className="h-4 w-4" /></button>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              
              <div className="p-4 bg-yellow-50 border-t border-yellow-100 text-center rounded-b-2xl">
                 <p className="text-xs text-yellow-800 font-medium flex items-center justify-center gap-2"><AlertTriangle className="h-4 w-4" />ملاحظة: سيقوم النظام بسحب ودمج بيانات الحضور لليوم المحدد ({date}) تلقائياً.</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
)



--- START OF FILE src/pages/Contracts.tsx ---
(import React, { useState, useEffect } from 'react';
import { MOCK_CONTRACTS, MOCK_CONTRACT_HISTORY, MOCK_EMPLOYEES } from '../constants';
import { Contract, ContractHistory, Employee } from '../types';
import { FileText, Plus, AlertTriangle, CheckCircle, Clock, Eye, X, History, FileSignature, Search, Filter, ChevronDown, Download, Trash2, Save } from 'lucide-react';
import DataControls from '../components/DataControls';

const Contracts: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>(() => {
    const saved = localStorage.getItem('contracts_data');
    if (saved) return JSON.parse(saved);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_CONTRACTS : [];
  });
  
  // Dynamic Employee List
  const [employeesList, setEmployeesList] = useState<Employee[]>(() => {
    const savedEmps = localStorage.getItem('employees_data');
    if (savedEmps) return JSON.parse(savedEmps);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_EMPLOYEES : [];
  });

  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  
  // Global Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Column Filters
  const [colFilters, setColFilters] = useState({
    employeeName: '',
    type: 'all',
    startDate: '',
    endDate: '',
    status: 'all'
  });
  
  // Add Contract Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newContract, setNewContract] = useState({
    employeeName: '',
    type: 'محدد المدة',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  const isAdmin = true;

  // Persist contracts
  useEffect(() => {
    localStorage.setItem('contracts_data', JSON.stringify(contracts));
  }, [contracts]);

  const handleImport = (data: any[]) => {
    const newItems = data.map((d, i) => ({ ...MOCK_CONTRACTS[0], ...d, id: `IMP-CON-${i}` }));
    setContracts(prev => [...prev, ...newItems]);
  };

  const getContractHistory = (contractId: string) => {
    const activeDb = localStorage.getItem('active_db_id');
    if (!activeDb || activeDb === 'DB1') {
        return MOCK_CONTRACT_HISTORY.filter(h => h.contractId === contractId).sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }
    return [];
  };

  const handleDownload = (contract: Contract) => {
     const link = document.createElement('a');
     link.href = '#';
     link.download = `Contract_${contract.employeeName}.pdf`;
     document.body.appendChild(link);
     alert(`تم بدء تحميل عقد الموظف: ${contract.employeeName}`);
     document.body.removeChild(link);
  };

  const handleAddContract = (e: React.FormEvent) => {
    e.preventDefault();
    const contract: Contract = {
      id: `CN-${Date.now()}`,
      employeeName: newContract.employeeName,
      type: newContract.type as any,
      startDate: newContract.startDate,
      endDate: newContract.endDate || '-',
      status: 'active'
    };
    setContracts([...contracts, contract]);
    setIsAddModalOpen(false);
    setNewContract({ employeeName: '', type: 'محدد المدة', startDate: '', endDate: '' });
    alert('تم إنشاء العقد بنجاح');
  };

  const handleDeleteContract = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العقد؟')) {
      setContracts(contracts.filter(c => c.id !== id));
    }
  };

  const filteredContracts = contracts.filter(c => {
    // 1. Global Search
    const matchesGlobal = c.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Column Filters
    const matchesName = c.employeeName.toLowerCase().includes(colFilters.employeeName.toLowerCase());
    const matchesType = colFilters.type === 'all' || c.type === colFilters.type;
    const matchesStart = c.startDate.includes(colFilters.startDate);
    const matchesEnd = c.endDate.includes(colFilters.endDate);
    const matchesStatus = colFilters.status === 'all' || c.status === colFilters.status;

    return matchesGlobal && matchesName && matchesType && matchesStart && matchesEnd && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة العقود</h2>
          <p className="text-sm text-gray-500 mt-1">متابعة عقود الموظفين، التجديد، وسجل الملاحق</p>
        </div>
        <div className="flex gap-3">
          <DataControls 
            data={contracts} 
            fileName="contracts_data" 
            isAdmin={isAdmin}
            onImport={handleImport}
            headers={[
              { key: 'employeeName', label: 'الموظف' },
              { key: 'type', label: 'نوع العقد' },
              { key: 'startDate', label: 'تاريخ البدء' },
              { key: 'endDate', label: 'تاريخ الانتهاء' },
              { key: 'status', label: 'الحالة' }
            ]}
          />
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-md hover:bg-indigo-700 transition-all hover:shadow-lg active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span>عقد جديد</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-green-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">عقود سارية</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{contracts.filter(c => c.status === 'active').length}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-yellow-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">أوشكت على الانتهاء</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{contracts.filter(c => c.status === 'expiring').length}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-red-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">منتهية</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{contracts.filter(c => c.status === 'expired').length}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-full">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center bg-gray-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="بحث سريع..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">الموظف</th>
                <th className="px-6 py-4 font-semibold">نوع العقد</th>
                <th className="px-6 py-4 font-semibold">تاريخ البدء</th>
                <th className="px-6 py-4 font-semibold">تاريخ الانتهاء</th>
                <th className="px-6 py-4 font-semibold">الحالة</th>
                <th className="px-6 py-4 font-semibold text-center">إجراءات</th>
              </tr>
              {/* Filter Row */}
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-2">
                  <input 
                    type="text" 
                    placeholder="اسم الموظف..." 
                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                    value={colFilters.employeeName}
                    onChange={(e) => setColFilters({...colFilters, employeeName: e.target.value})}
                  />
                </th>
                <th className="px-6 py-2">
                  <select 
                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                    value={colFilters.type}
                    onChange={(e) => setColFilters({...colFilters, type: e.target.value})}
                  >
                    <option value="all">الكل</option>
                    <option value="محدد المدة">محدد المدة</option>
                    <option value="غير محدد المدة">غير محدد المدة</option>
                    <option value="عمل مؤقت">عمل مؤقت</option>
                  </select>
                </th>
                <th className="px-6 py-2">
                  <input 
                    type="text" 
                    placeholder="YYYY-MM-DD" 
                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                    value={colFilters.startDate}
                    onChange={(e) => setColFilters({...colFilters, startDate: e.target.value})}
                  />
                </th>
                <th className="px-6 py-2">
                  <input 
                    type="text" 
                    placeholder="YYYY-MM-DD" 
                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                    value={colFilters.endDate}
                    onChange={(e) => setColFilters({...colFilters, endDate: e.target.value})}
                  />
                </th>
                <th className="px-6 py-2">
                  <select 
                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                    value={colFilters.status}
                    onChange={(e) => setColFilters({...colFilters, status: e.target.value})}
                  >
                    <option value="all">الكل</option>
                    <option value="active">ساري</option>
                    <option value="expiring">ينتهي قريباً</option>
                    <option value="expired">منتهي</option>
                  </select>
                </th>
                <th className="px-6 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">{contract.employeeName}</td>
                    <td className="px-6 py-4 text-gray-600">{contract.type}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{contract.startDate}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{contract.endDate}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border
                        ${contract.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 
                          contract.status === 'expiring' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-red-50 text-red-700 border-red-100'}
                      `}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          contract.status === 'active' ? 'bg-green-500' : 
                          contract.status === 'expiring' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></span>
                        {contract.status === 'active' ? 'ساري' : contract.status === 'expiring' ? 'ينتهي قريباً' : 'منتهي'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => setSelectedContract(contract)}
                            className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition-colors flex items-center gap-1"
                            title="عرض السجل"
                          >
                            <History className="h-4 w-4" />
                         </button>
                         <button 
                            className="text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700 p-2 rounded-lg transition-colors" 
                            title="تحميل العقد"
                            onClick={() => handleDownload(contract)}
                         >
                            <Download className="h-4 w-4" />
                         </button>
                         <button 
                            onClick={() => handleDeleteContract(contract.id)}
                            className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                            title="حذف العقد"
                         >
                            <Trash2 className="h-4 w-4" />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 bg-gray-50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-gray-300" />
                      <p>لا توجد عقود مطابقة للبحث</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Details & History Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-gray-100 p-6">
                <div>
                   <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FileSignature className="h-6 w-6 text-indigo-600" />
                      تفاصيل العقد والسجل
                   </h3>
                   <p className="text-sm text-gray-500 mt-1">سجل التغييرات والملاحق لـ <span className="font-medium text-gray-700">{selectedContract.employeeName}</span></p>
                </div>
                <button 
                  onClick={() => setSelectedContract(null)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                 {/* Current Contract Info */}
                 <div className="bg-indigo-50/50 rounded-xl p-5 mb-8 border border-indigo-100">
                    <h4 className="text-indigo-800 font-bold text-sm mb-4 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      الوضع الحالي
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <p className="text-xs text-gray-500 mb-1">نوع العقد</p>
                          <p className="font-medium text-gray-900">{selectedContract.type}</p>
                       </div>
                       <div>
                          <p className="text-xs text-gray-500 mb-1">الحالة</p>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                             ${selectedContract.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                             {selectedContract.status === 'active' ? 'ساري' : 'منتهي'}
                          </span>
                       </div>
                       <div>
                          <p className="text-xs text-gray-500 mb-1">تاريخ البداية</p>
                          <p className="font-mono font-medium text-gray-900">{selectedContract.startDate}</p>
                       </div>
                       <div>
                          <p className="text-xs text-gray-500 mb-1">تاريخ النهاية</p>
                          <p className="font-mono font-medium text-gray-900">{selectedContract.endDate}</p>
                       </div>
                    </div>
                 </div>

                 <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                    <History className="h-5 w-5 text-gray-400" />
                    الجدول الزمني للتغييرات
                 </h4>

                 {/* Timeline */}
                 <div className="relative border-r-2 border-gray-200 mr-3 pr-8 space-y-8 pb-4">
                    {getContractHistory(selectedContract.id).length > 0 ? (
                       getContractHistory(selectedContract.id).map((event) => (
                          <div key={event.id} className="relative group">
                             {/* Dot */}
                             <div className="absolute -right-[39px] top-1.5 h-5 w-5 rounded-full border-4 border-white bg-indigo-500 shadow-sm group-hover:scale-110 transition-transform"></div>
                             
                             <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 bg-white p-4 rounded-lg border border-gray-100 shadow-sm group-hover:border-indigo-100 transition-colors">
                                <div>
                                   <p className="font-bold text-gray-800 text-sm">{event.type}</p>
                                   <p className="text-gray-600 text-sm mt-1 leading-relaxed">{event.details}</p>
                                   {event.documentUrl && (
                                      <button className="mt-3 text-indigo-600 text-xs flex items-center gap-1 hover:underline font-medium bg-indigo-50 px-2 py-1 rounded-md w-fit">
                                         <FileText className="h-3 w-3" />
                                         عرض الملحق
                                      </button>
                                   )}
                                </div>
                                <div className="text-left sm:text-left shrink-0">
                                   <span className="text-xs font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded block mb-1">
                                      {event.date}
                                   </span>
                                   <p className="text-[10px] text-gray-400">بواسطة: {event.changedBy}</p>
                                </div>
                             </div>
                          </div>
                       ))
                    ) : (
                       <p className="text-gray-400 text-sm italic">لا يوجد سجل تغييرات سابق لهذا العقد.</p>
                    )}
                 </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                 <button 
                   onClick={() => setSelectedContract(null)}
                   className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium shadow-sm transition-colors"
                 >
                   إغلاق
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Add Contract Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-100 p-6 bg-gray-50 rounded-t-2xl">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-indigo-600" />
                    إنشاء عقد جديد
                 </h3>
                 <button onClick={() => setIsAddModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition">
                    <X className="h-6 w-6" />
                 </button>
              </div>
              
              <form onSubmit={handleAddContract} className="p-6">
                 <div className="space-y-4">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">الموظف</label>
                       <select 
                          required
                          className="w-full p-2 rounded-lg border border-gray-300"
                          value={newContract.employeeName}
                          onChange={(e) => setNewContract({...newContract, employeeName: e.target.value})}
                       >
                          <option value="">اختر الموظف...</option>
                          {employeesList.map(emp => (
                             <option key={emp.id} value={emp.name}>{emp.name}</option>
                          ))}
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">نوع العقد</label>
                       <select 
                          required
                          className="w-full p-2 rounded-lg border border-gray-300"
                          value={newContract.type}
                          onChange={(e) => setNewContract({...newContract, type: e.target.value})}
                       >
                          <option value="محدد المدة">محدد المدة</option>
                          <option value="غير محدد المدة">غير محدد المدة</option>
                          <option value="عمل مؤقت">عمل مؤقت</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البدء</label>
                       <input 
                          type="date" required 
                          className="w-full p-2 rounded-lg border border-gray-300"
                          value={newContract.startDate}
                          onChange={(e) => setNewContract({...newContract, startDate: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
                       <input 
                          type="date" 
                          className="w-full p-2 rounded-lg border border-gray-300"
                          value={newContract.endDate}
                          onChange={(e) => setNewContract({...newContract, endDate: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="mt-6 flex gap-3">
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
                       <Save className="h-4 w-4" />
                       حفظ العقد
                    </button>
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">
                       إلغاء
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;)




--- START OF FILE src/pages/Dashboard.tsx ---
(
import React, { useContext, useEffect, useState } from 'react';
import { Users, UserCheck, AlertCircle, Clock, Calendar, TrendingUp, Wallet, CheckCircle, XCircle, Briefcase, CalendarOff } from 'lucide-react';
import StatCard from '../components/StatCard';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { AppContext } from '../App';
import { UserRole, Employee, AttendanceRecord, PayrollRecord, LeaveRequest, LeaveBalance } from '../types';
import { MOCK_EMPLOYEES, MOCK_ATTENDANCE, MOCK_PAYROLL, MOCK_LEAVES, MOCK_LEAVE_BALANCES } from '../constants';

const Dashboard: React.FC = () => {
  const { currentUser } = useContext(AppContext);
  
  // Real Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);

  // Statistics State
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    totalPayroll: 0,
    pendingLeaves: 0,
    contractsExpiring: 0
  });

  const [deptData, setDeptData] = useState<any[]>([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState<any[]>([]);

  useEffect(() => {
    // 1. Load Data from LocalStorage (Simulating Database Fetch)
    const activeDb = localStorage.getItem('active_db_id');
    const isDefaultDb = !activeDb || activeDb === 'DB1';

    const loadData = (key: string, mock: any) => {
        const saved = localStorage.getItem(key);
        if (saved) return JSON.parse(saved);
        return isDefaultDb ? mock : [];
    };

    const loadedEmps = loadData('employees_data', MOCK_EMPLOYEES);
    const loadedAtt = loadData('attendance_data', MOCK_ATTENDANCE);
    const loadedPay = loadData('payroll_data', MOCK_PAYROLL);
    const loadedLeaves = loadData('leaves_data', MOCK_LEAVES);
    const loadedBalances = loadData('leaves_balances', MOCK_LEAVE_BALANCES);

    setEmployees(loadedEmps);
    setAttendance(loadedAtt);
    setPayroll(loadedPay);
    setLeaves(loadedLeaves);
    setBalances(loadedBalances);

    // 2. Calculate Stats
    const today = new Date().toISOString().split('T')[0];
    
    // Attendance Stats
    const todayAttendance = loadedAtt.filter((a: AttendanceRecord) => a.date === today);
    const presentCount = todayAttendance.filter((a: AttendanceRecord) => a.status === 'present' || a.status === 'late').length;
    const lateCount = todayAttendance.filter((a: AttendanceRecord) => a.status === 'late').length;

    // Payroll Stats
    const totalSalaries = loadedPay.reduce((acc: number, curr: PayrollRecord) => acc + curr.netSalary, 0);

    // Pending Leaves
    const pending = loadedLeaves.filter((l: LeaveRequest) => l.status === 'pending').length;

    setStats({
        totalEmployees: loadedEmps.length,
        presentToday: presentCount,
        lateToday: lateCount,
        totalPayroll: totalSalaries,
        pendingLeaves: pending,
        contractsExpiring: loadedEmps.filter((e: Employee) => e.contractType === 'عقد محدد').length // Simplified
    });

    // 3. Prepare Charts Data
    // Department Distribution
    const departments: Record<string, number> = {};
    loadedEmps.forEach((e: Employee) => {
        departments[e.department] = (departments[e.department] || 0) + 1;
    });
    const pieData = Object.keys(departments).map((dept, idx) => ({
        name: dept,
        value: departments[dept],
        color: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]
    }));
    setDeptData(pieData);

    // Weekly Attendance (Mock logic for graph visualization)
    setWeeklyAttendance([
        { name: 'السبت', hours: 40 },
        { name: 'الأحد', hours: 150 },
        { name: 'الاثنين', hours: 160 },
        { name: 'الثلاثاء', hours: 155 },
        { name: 'الأربعاء', hours: 140 },
        { name: 'الخميس', hours: 130 },
    ]);

  }, []);

  // --- EMPLOYEE VIEW (Self-Service) ---
  if (currentUser?.role === UserRole.EMPLOYEE) {
      const myEmployee = employees.find(e => e.name === currentUser.fullName || e.id === currentUser.linkedEmployeeId);
      const myBalance = balances.find(b => b.employeeName === currentUser.fullName);
      const myAttendance = attendance.filter(a => a.employeeName === currentUser.fullName).sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5);
      const today = new Date().toISOString().split('T')[0];
      const todaysRecord = attendance.find(a => a.employeeName === currentUser.fullName && a.date === today);

      return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">مرحباً، {currentUser.fullName}</h2>
                    <p className="text-sm text-gray-500">بوابة الخدمة الذاتية</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">رصيد الإجازات السنوي</p>
                        <h3 className="text-3xl font-bold text-indigo-600">{myBalance ? (myBalance.annualTotal - myBalance.annualUsed) : 0} يوم</h3>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-full"><CalendarOff className="h-6 w-6 text-indigo-600" /></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">حالة اليوم</p>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${todaysRecord ? 'text-green-600' : 'text-gray-400'}`}>
                            {todaysRecord ? (
                                <><CheckCircle className="h-5 w-5" /> تم الحضور</>
                            ) : (
                                <><XCircle className="h-5 w-5" /> لم يسجل بعد</>
                            )}
                        </h3>
                        {todaysRecord && <p className="text-xs text-gray-400 mt-1">دخول: {todaysRecord.checkIn}</p>}
                    </div>
                    <div className={`p-3 rounded-full ${todaysRecord ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}><Clock className="h-6 w-6" /></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">الوردية الحالية</p>
                        <h3 className="text-xl font-bold text-gray-800">{myEmployee?.shiftName || 'غير محدد'}</h3>
                        <p className="text-xs text-gray-400 mt-1">راجع الجدول</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-full"><Briefcase className="h-6 w-6 text-yellow-600" /></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">آخر حركات الحضور</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr><th className="p-3">التاريخ</th><th className="p-3">دخول</th><th className="p-3">خروج</th><th className="p-3">ساعات العمل</th><th className="p-3">الحالة</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {myAttendance.length > 0 ? myAttendance.map(a => (
                                <tr key={a.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-mono">{a.date}</td>
                                    <td className="p-3 font-mono">{a.checkIn}</td>
                                    <td className="p-3 font-mono">{a.checkOut}</td>
                                    <td className="p-3 font-bold text-gray-700">{a.workHours}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs border ${
                                            a.status === 'present' ? 'bg-green-50 text-green-700 border-green-100' :
                                            a.status === 'late' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                            'bg-red-50 text-red-700 border-red-100'
                                        }`}>
                                            {a.status === 'present' ? 'حضور' : a.status === 'late' ? 'تأخير' : 'غياب'}
                                        </span>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={5} className="p-8 text-center text-gray-400">لا يوجد سجلات حديثة</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
  }

  // --- ADMIN / HR VIEW ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">لوحة التحكم</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="إجمالي الموظفين" 
          value={stats.totalEmployees} 
          icon={<Users className="h-6 w-6" />} 
          color="indigo" 
          trend="نشط"
        />
        <StatCard 
          title="حضور اليوم" 
          value={stats.presentToday} 
          icon={<UserCheck className="h-6 w-6" />} 
          color="green" 
          trend={`${Math.round((stats.presentToday / (stats.totalEmployees || 1)) * 100)}% نسبة الحضور`}
        />
        <StatCard 
          title="تأخير" 
          value={stats.lateToday} 
          icon={<Clock className="h-6 w-6" />} 
          color="yellow" 
        />
        <StatCard 
          title="إجمالي الرواتب" 
          value={`${(stats.totalPayroll / 1000).toFixed(1)}k`} 
          icon={<Wallet className="h-6 w-6" />} 
          color="red" 
          trend="الشهر الحالي"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance Bar Chart */}
        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="mb-4 text-lg font-bold text-gray-800">إحصائيات ساعات العمل الأسبوعية</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAttendance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Pie Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="mb-4 text-lg font-bold text-gray-800">توزيع الموظفين حسب القسم</h3>
          <div className="h-48 w-full">
            {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات</div>
            )}
          </div>
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
             {deptData.map(dept => (
                <div key={dept.name} className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: dept.color}}></div>
                      <span className="text-gray-600 truncate max-w-[150px]">{dept.name}</span>
                   </div>
                   <span className="font-bold text-gray-800">{dept.value}</span>
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Notifications / Quick Alerts */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h3 className="mb-4 text-lg font-bold text-gray-800">تنبيهات النظام</h3>
        <div className="space-y-4">
            {stats.pendingLeaves > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-yellow-800">طلبات إجازة معلقة</p>
                        <p className="text-xs text-yellow-700 mt-1">يوجد {stats.pendingLeaves} طلبات إجازة بانتظار الموافقة.</p>
                    </div>
                </div>
            )}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <Users className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-indigo-800">تحديث النظام</p>
                    <p className="text-xs text-indigo-600 mt-1">النظام يعمل بشكل صحيح. تم التحديث: {new Date().toLocaleTimeString('ar-EG')}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
)



--- START OF FILE src/pages/EmployeeDetails.tsx ---
(
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MOCK_EMPLOYEES, 
  MOCK_ATTENDANCE, 
  MOCK_INSURANCE, 
  MOCK_CONTRACTS, 
  MOCK_PAYROLL,
  MOCK_LEAVE_BALANCES,
  MOCK_LOANS,
  DEPARTMENTS as DEFAULT_DEPTS
} from '../constants';
import { 
  ArrowRight, 
  User, 
  Briefcase, 
  CreditCard, 
  Phone, 
  Mail, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Download, 
  Hash,
  Car,
  Printer,
  Edit,
  X,
  Award,
  Plus,
  Trash2,
  Upload,
  Paperclip,
  Eye
} from 'lucide-react';
import { Employee } from '../types';

const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'job' | 'financial' | 'documents'>('profile');
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isMasterCardOpen, setIsMasterCardOpen] = useState(false); // New State for Master Card
  
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [newCert, setNewCert] = useState({ name: '', date: '' });
  const [certFile, setCertFile] = useState<File | null>(null);
  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPTS);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contractInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedEmployees = localStorage.getItem('employees_data');
    const allEmployees: Employee[] = savedEmployees ? JSON.parse(savedEmployees) : MOCK_EMPLOYEES;
    const found = allEmployees.find(e => e.id === id);
    if (found) {
        if (!found.certificates) found.certificates = [];
        // @ts-ignore
        if (!found.documents) found.documents = [
            { id: 'd1', name: 'صورة البطاقة الشخصية.pdf', type: 'PDF', size: '2.5 MB', date: '2023-01-01' },
            { id: 'd2', name: 'صحيفة الحالة الجنائية.pdf', type: 'PDF', size: '1.2 MB', date: '2023-01-01' }
        ];
        setEmployee(found);
        setEditForm(found);
    }

    const savedDepts = localStorage.getItem('system_departments');
    if (savedDepts) setDepartments(JSON.parse(savedDepts));
  }, [id]);

  if (!employee) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="bg-red-50 p-6 rounded-full mb-4">
           <User className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">الموظف غير موجود</h2>
        <p className="text-gray-500 mt-2">لم يتم العثور على بيانات لهذا الموظف، قد يكون تم حذفه.</p>
        <button 
          onClick={() => navigate('/employees')} 
          className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          العودة لقائمة الموظفين
        </button>
      </div>
    );
  }

  const insurance = MOCK_INSURANCE.find(i => i.employeeName === employee.name);
  const contract = MOCK_CONTRACTS.find(c => c.employeeName === employee.name);
  const payroll = MOCK_PAYROLL.find(p => p.employeeName === employee.name);
  const recentAttendance = MOCK_ATTENDANCE.filter(a => a.employeeName === employee.name).slice(0, 5);
  const leaveBalance = MOCK_LEAVE_BALANCES.find(b => b.employeeName === employee.name);
  const activeLoans = MOCK_LOANS.filter(l => l.employeeName === employee.name && l.status === 'active');

  const calculateDuration = (startDate: string) => {
      const start = new Date(startDate);
      const end = new Date();
      let years = end.getFullYear() - start.getFullYear();
      let months = end.getMonth() - start.getMonth();
      if (months < 0) { years--; months += 12; }
      return { years, months };
  };
  const serviceDuration = calculateDuration(employee.joinDate);

  const handleUpdateEmployee = (updatedData: Partial<Employee>) => {
      const savedEmployees = localStorage.getItem('employees_data');
      let allEmployees: Employee[] = savedEmployees ? JSON.parse(savedEmployees) : MOCK_EMPLOYEES;
      
      const newEmployeeData = { ...employee, ...updatedData } as Employee;
      
      allEmployees = allEmployees.map(e => e.id === employee.id ? newEmployeeData : e);
      
      localStorage.setItem('employees_data', JSON.stringify(allEmployees));
      setEmployee(newEmployeeData);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdateEmployee(editForm);
    setIsEditModalOpen(false);
    alert('تم حفظ بيانات الموظف بنجاح');
  };

  const handleAddCertificate = (e: React.FormEvent) => {
      e.preventDefault();
      
      let fileData = {};
      if (certFile) {
          fileData = {
              fileName: certFile.name,
              fileUrl: URL.createObjectURL(certFile)
          };
      }

      const newCertificate = { 
          id: `CERT-${Date.now()}`,
          name: newCert.name, 
          date: newCert.date,
          ...fileData
      };
      
      const updatedCerts = [...(employee.certificates || []), newCertificate];
      
      handleUpdateEmployee({ certificates: updatedCerts });
      setIsCertModalOpen(false);
      setNewCert({ name: '', date: '' });
      setCertFile(null);
  };

  const handleDeleteCertificate = (index: number) => {
      if(window.confirm('هل أنت متأكد من حذف هذه الشهادة؟')) {
          const updatedCerts = [...(employee.certificates || [])];
          updatedCerts.splice(index, 1);
          handleUpdateEmployee({ certificates: updatedCerts });
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const newDoc = {
              id: `DOC-${Date.now()}`,
              name: file.name,
              type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
              size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
              date: new Date().toISOString().split('T')[0],
              fileUrl: URL.createObjectURL(file)
          };
          // @ts-ignore
          const updatedDocs = [...(employee.documents || []), newDoc];
          // @ts-ignore
          handleUpdateEmployee({ documents: updatedDocs });
          alert('تم رفع المستند بنجاح');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleContractUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          handleUpdateEmployee({
              contractFile: {
                  fileName: file.name,
                  fileUrl: URL.createObjectURL(file)
              }
          });
          alert('تم إرفاق ملف العقد بنجاح');
      }
      if (contractInputRef.current) contractInputRef.current.value = '';
  };

  const handleDeleteDocument = (index: number) => {
      if(window.confirm('هل أنت متأكد من حذف هذا المستند؟')) {
          // @ts-ignore
          const updatedDocs = [...(employee.documents || [])];
          updatedDocs.splice(index, 1);
          // @ts-ignore
          handleUpdateEmployee({ documents: updatedDocs });
      }
  };

  const handleViewFile = (url?: string) => {
      if (url) {
          window.open(url, '_blank');
      } else {
          alert('لا يوجد ملف مرفق');
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/employees')} 
          className="rounded-full bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-50"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">ملف الموظف</h2>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <img 
            src={employee.avatar} 
            alt={employee.name} 
            className="h-24 w-24 rounded-full object-cover border-4 border-indigo-50"
          />
          <div className="flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
                <p className="text-gray-500">{employee.jobTitle} - {employee.department}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.status === 'active' ? 'نشط' : 'غير نشط'}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {employee.contractType}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700 border border-yellow-200">
                     <Clock className="h-3 w-3" />
                     {serviceDuration.years} سنة و {serviceDuration.months} شهر
                  </span>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex gap-3">
                 <button 
                    onClick={() => setIsMasterCardOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm"
                 >
                    <Briefcase className="h-4 w-4" />
                    كارتة الموظف
                 </button>
                 <button 
                    onClick={() => {
                        setEditForm(employee);
                        setIsEditModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors"
                 >
                    <Edit className="h-4 w-4" />
                    تعديل
                 </button>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                 <Hash className="h-4 w-4 text-gray-400" />
                 <span className="font-mono font-bold text-gray-800">{employee.employeeCode}</span>
              </div>
              <div className="flex items-center gap-2">
                 <CreditCard className="h-4 w-4 text-gray-400" />
                 <span className="font-mono">{employee.nationalId}</span>
              </div>
              <div className="flex items-center gap-2">
                 <Mail className="h-4 w-4 text-gray-400" />
                 <span>employee@company.com</span>
              </div>
              <div className="flex items-center gap-2">
                 <Phone className="h-4 w-4 text-gray-400" />
                 <span>+20 123 456 7890</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 space-x-reverse" aria-label="Tabs">
          {[
            { id: 'profile', label: 'البيانات الشخصية', icon: User },
            { id: 'job', label: 'معلومات العمل', icon: Briefcase },
            { id: 'financial', label: 'المالية والتأمين', icon: CreditCard },
            { id: 'documents', label: 'المستندات والشهادات', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
              `}
            >
              <tab.icon className={`-ml-0.5 ml-2 h-5 w-5 ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-2">البيانات الأساسية</h3>
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-gray-500">الاسم الكامل</label><p className="font-medium">{employee.name}</p></div>
                  <div><label className="text-xs text-gray-500">الجنسية</label><p className="font-medium">مصر</p></div>
                  <div><label className="text-xs text-gray-500">تاريخ الميلاد</label><p className="font-medium">01/01/1990</p></div>
                  <div><label className="text-xs text-gray-500">الحالة الاجتماعية</label><p className="font-medium">متزوج</p></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-2">الهوية والمؤهلات</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <CreditCard className="h-6 w-6 text-indigo-500" />
                    <div>
                       <p className="text-xs text-gray-500">الرقم القومي</p>
                       <p className="font-mono font-medium">{employee.nationalId}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    <div>
                       <label className="text-xs text-gray-500">المؤهل الدراسي</label>
                       <p className="font-medium">بكالوريوس حاسبات ومعلومات - جامعة القاهرة</p>
                    </div>
                    <div>
                       <label className="text-xs text-gray-500">سنة التخرج</label>
                       <p className="font-medium">2012</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'job' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                   <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-2">معلومات الوظيفة</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs text-gray-500">المسمى الوظيفي</label><p className="font-medium">{employee.jobTitle}</p></div>
                      <div><label className="text-xs text-gray-500">القسم</label><p className="font-medium">{employee.department}</p></div>
                      <div><label className="text-xs text-gray-500">تاريخ التعيين</label><p className="font-medium font-mono">{employee.joinDate}</p></div>
                      <div><label className="text-xs text-gray-500">موقع العمل</label><p className="font-medium">المقر الرئيسي</p></div>
                      <div><label className="text-xs text-gray-500">نوع الدوام</label><p className="font-medium">{employee.contractType}</p></div>
                      <div><label className="text-xs text-gray-500">تاريخ نهاية الخدمة</label><p className="font-medium font-mono text-gray-800">{employee.endOfServiceDate || '-'}</p></div>
                   </div>
                </div>

                {employee.isDriver && (
                   <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 text-indigo-700">
                         <Car className="h-5 w-5" />
                         <h3 className="font-bold text-lg">بيانات السائق</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs text-gray-500">رقم الرخصة</label>
                            <p className="font-mono font-bold text-gray-800">{employee.driverLicenseNumber}</p>
                         </div>
                         <div>
                            <label className="text-xs text-gray-500">تاريخ انتهاء الرخصة</label>
                            <p className="font-mono font-bold text-gray-800">{employee.driverLicenseExpiry}</p>
                         </div>
                      </div>
                   </div>
                )}

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                   <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-2">بيانات العقد</h3>
                   <div className="space-y-4">
                        {contract ? (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">نوع العقد:</span>
                                    <span className="font-medium">{contract.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">تاريخ البدء:</span>
                                    <span className="font-medium font-mono">{contract.startDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">تاريخ الانتهاء:</span>
                                    <span className="font-medium font-mono">{contract.endDate}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-gray-500">الحالة:</span>
                                    <span className={`px-2 py-1 rounded text-xs ${contract.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {contract.status === 'active' ? 'ساري' : 'منتهي'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-400 text-sm text-center py-2">لا توجد بيانات عقد مسجلة</p>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">نسخة العقد الممسوحة</label>
                            {employee.contractFile ? (
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                                        <span className="text-sm truncate text-gray-700" title={employee.contractFile.fileName}>
                                            {employee.contractFile.fileName}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => handleViewFile(employee.contractFile?.fileUrl)}
                                        className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"
                                        title="عرض العقد"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                                    <input 
                                        type="file" 
                                        accept=".pdf,image/*" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        ref={contractInputRef}
                                        onChange={handleContractUpload}
                                    />
                                    <div className="flex flex-col items-center text-gray-500">
                                        <Upload className="h-6 w-6 mb-1" />
                                        <span className="text-xs">اضغط لرفع نسخة العقد (PDF)</span>
                                    </div>
                                </div>
                            )}
                        </div>
                   </div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">سجل الحضور الأخير</h3>
                {recentAttendance.length > 0 ? (
                   <table className="w-full text-right text-sm">
                      <thead className="bg-gray-50">
                         <tr>
                            <th className="px-4 py-2">التاريخ</th>
                            <th className="px-4 py-2">دخول</th>
                            <th className="px-4 py-2">خروج</th>
                            <th className="px-4 py-2">الحالة</th>
                         </tr>
                      </thead>
                      <tbody>
                         {recentAttendance.map(a => (
                            <tr key={a.id} className="border-b border-gray-50 last:border-0">
                               <td className="px-4 py-3 font-mono text-gray-600">{a.date}</td>
                               <td className="px-4 py-3 font-mono">{a.checkIn}</td>
                               <td className="px-4 py-3 font-mono">{a.checkOut}</td>
                               <td className="px-4 py-3">
                                  <span className={`text-xs px-2 py-1 rounded ${a.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                     {a.status === 'present' ? 'حضور' : a.status}
                                  </span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                ) : (
                   <p className="text-gray-400 text-sm text-center py-4">لا يوجد سجل حضور حديث</p>
                )}
             </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <CreditCard className="h-5 w-5 text-indigo-500" />
                   الراتب والبدلات
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">الراتب الأساسي</span>
                      <span className="font-bold text-lg">{employee.salary.toLocaleString()} ج.م</span>
                   </div>
                   {payroll && (
                      <>
                         <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="text-gray-500">بدلات ثابتة</span>
                            <span className="font-medium text-green-600">+{payroll.allowances.toLocaleString()} ج.م</span>
                         </div>
                         <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="text-gray-500">حوافز ومكافآت</span>
                            <span className="font-medium text-green-600">+{payroll.incentives.toLocaleString()} ج.م</span>
                         </div>
                         {payroll.transportAllowance > 0 && (
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2 bg-blue-50 px-2 rounded">
                               <span className="text-blue-600 text-sm">بدل انتقال / رحلات</span>
                               <span className="font-medium text-blue-600">+{payroll.transportAllowance.toLocaleString()} ج.م</span>
                            </div>
                         )}
                         <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="text-gray-500">استقطاعات (تأمين/ضرائب)</span>
                            <span className="font-medium text-red-600">-{payroll.deductions.toLocaleString()} ج.م</span>
                         </div>
                         <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-gray-800">صافي الراتب المتوقع</span>
                            <span className="font-bold text-xl text-indigo-600">{payroll.netSalary.toLocaleString()} ج.م</span>
                         </div>
                      </>
                   )}
                </div>
             </div>

             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <ShieldCheck className="h-5 w-5 text-indigo-500" />
                   بيانات التأمين
                </h3>
                {insurance ? (
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs text-gray-500">الرقم التأميني</label>
                            <p className="font-mono font-medium">{insurance.insuranceNumber}</p>
                         </div>
                         <div>
                            <label className="text-xs text-gray-500">تاريخ الاشتراك</label>
                            <p className="font-mono font-medium">{employee.joinDate}</p>
                         </div>
                         <div>
                            <label className="text-xs text-gray-500">الأجر التأميني</label>
                            <p className="font-medium">{insurance.salaryInsured.toLocaleString()} ج.م</p>
                         </div>
                         <div>
                            <label className="text-xs text-gray-500">الحالة</label>
                            <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">مؤمن عليه</span>
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="text-center py-8 text-gray-400">
                      <p>لا توجد بيانات تأمينية مرتبطة</p>
                      <button onClick={() => navigate('/insurance')} className="mt-2 text-indigo-600 text-sm hover:underline">إضافة سجل تأميني</button>
                   </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'documents' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                 <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                       <Award className="h-5 w-5 text-yellow-500" />
                       الشهادات والكورسات
                    </h3>
                    <button 
                        onClick={() => setIsCertModalOpen(true)}
                        className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100"
                    >
                       <Plus className="h-3 w-3" /> إضافة شهادة
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employee.certificates && employee.certificates.length > 0 ? (
                        employee.certificates.map((cert, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-indigo-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-yellow-50 p-2 rounded text-yellow-600"><Award className="h-5 w-5" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate" title={cert.name}>{cert.name}</p>
                                        <p className="text-xs text-gray-500">{cert.date}</p>
                                        {cert.fileName && (
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 truncate">
                                                <Paperclip className="h-3 w-3" /> {cert.fileName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {cert.fileUrl && (
                                        <button 
                                            onClick={() => handleViewFile(cert.fileUrl)}
                                            className="text-indigo-500 hover:text-indigo-700 p-1"
                                            title="عرض المرفق"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button onClick={() => handleDeleteCertificate(idx)} className="text-gray-400 hover:text-red-500 p-1">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 text-sm col-span-2 text-center py-4">لا توجد شهادات مسجلة</p>
                    )}
                 </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800">الأوراق الرسمية</h3>
                    <div className="relative">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileUpload}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center gap-1"
                        >
                            <Upload className="h-4 w-4" />
                            رفع مستند جديد
                        </button>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* @ts-ignore */}
                    {employee.documents && employee.documents.map((doc: any, i: number) => (
                       <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-indigo-200 transition-colors">
                          <div className="flex items-center gap-3 overflow-hidden">
                             <div className="p-2 bg-gray-50 rounded-lg text-gray-500 flex-shrink-0">
                                <FileText className="h-5 w-5" />
                             </div>
                             <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate" title={doc.name}>{doc.name}</p>
                                <p className="text-xs text-gray-500">{doc.size || 'Unknown'} • {doc.type}</p>
                             </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button 
                                className="text-gray-400 hover:text-indigo-600"
                                onClick={() => handleViewFile(doc.fileUrl)}
                                title="تحميل / عرض"
                            >
                                <Download className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteDocument(i)} className="text-gray-400 hover:text-red-600" title="حذف">
                                <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-gray-100 p-6 bg-gray-50">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Edit className="h-5 w-5 text-indigo-600" />
                    تعديل بيانات الموظف
                 </h3>
                 <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                 </button>
              </div>
              <div className="p-6 overflow-y-auto">
                 <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm text-gray-600 mb-1">الاسم الكامل</label>
                          <input type="text" className="w-full border rounded p-2" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-sm text-gray-600 mb-1">المسمى الوظيفي</label>
                          <input type="text" className="w-full border rounded p-2" value={editForm.jobTitle || ''} onChange={e => setEditForm({...editForm, jobTitle: e.target.value})} />
                       </div>
                       
                       {/* DEPARTMENT SELECT - UPDATED */}
                       <div>
                          <label className="block text-sm text-gray-600 mb-1">القسم</label>
                          <select 
                            className="w-full border rounded p-2" 
                            value={editForm.department || ''} 
                            onChange={e => setEditForm({...editForm, department: e.target.value})}
                          >
                             <option value="">اختر القسم</option>
                             {departments.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                       </div>

                       <div>
                          <label className="block text-sm text-gray-600 mb-1">الراتب</label>
                          <input type="number" className="w-full border rounded p-2" value={editForm.salary || ''} onChange={e => setEditForm({...editForm, salary: Number(e.target.value)})} />
                       </div>
                       <div>
                          <label className="block text-sm text-gray-600 mb-1">الرقم القومي</label>
                          <input type="text" className="w-full border rounded p-2" value={editForm.nationalId || ''} onChange={e => setEditForm({...editForm, nationalId: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-sm text-gray-600 mb-1">الكود الوظيفي</label>
                          <input type="text" className="w-full border rounded p-2" value={editForm.employeeCode || ''} onChange={e => setEditForm({...editForm, employeeCode: e.target.value})} />
                       </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-2">
                       <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-50">إلغاء</button>
                       <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">حفظ التغييرات</button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}

      {isCertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-gray-800">إضافة شهادة جديدة</h3>
                 <button onClick={() => setIsCertModalOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleAddCertificate} className="space-y-4">
                 <div>
                    <label className="block text-sm text-gray-600 mb-1">اسم الشهادة / الكورس</label>
                    <input type="text" required className="w-full border rounded p-2" value={newCert.name} onChange={e => setNewCert({...newCert, name: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm text-gray-600 mb-1">تاريخ الحصول عليها</label>
                    <input type="date" required className="w-full border rounded p-2" value={newCert.date} onChange={e => setNewCert({...newCert, date: e.target.value})} />
                 </div>
                 
                 <div>
                    <label className="block text-sm text-gray-600 mb-1">مرفق الشهادة (اختياري)</label>
                    <div className="border border-dashed border-gray-300 rounded p-3 text-center bg-gray-50 relative cursor-pointer hover:bg-gray-100">
                        <input 
                            type="file" 
                            accept=".pdf,image/*"
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            onChange={(e) => setCertFile(e.target.files ? e.target.files[0] : null)}
                        />
                        <div className="text-xs text-gray-500 flex flex-col items-center gap-1">
                            <Upload className="h-4 w-4" />
                            {certFile ? <span className="text-indigo-600 font-bold">{certFile.name}</span> : <span>اضغط لرفع ملف الشهادة</span>}
                        </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">إضافة</button>
              </form>
           </div>
        </div>
      )}

      {/* MASTER CARD MODAL */}
      {isMasterCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
           <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
              <div className="flex items-center justify-between border-b border-gray-200 p-4 bg-gray-50 rounded-t-xl no-print">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                    كارتة الموظف (Job Card)
                 </h3>
                 <div className="flex gap-2">
                    <button onClick={() => window.print()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2">
                        <Printer className="h-4 w-4" /> طباعة
                    </button>
                    <button onClick={() => setIsMasterCardOpen(false)} className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50">
                        <X className="h-5 w-5" />
                    </button>
                 </div>
              </div>
              
              {/* PRINTABLE AREA */}
              <div className="p-8 print:p-0 print:m-0 bg-white" id="printable-master-card">
                 <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">شركة النور للتجارة</h1>
                        <p className="text-sm text-gray-600">إدارة الموارد البشرية - سجل الموظفين</p>
                    </div>
                    <div className="text-left">
                        <h2 className="text-xl font-bold text-indigo-900 bg-indigo-50 px-4 py-1 rounded border border-indigo-200">بطاقة وصف وظيفي</h2>
                        <p className="text-xs text-gray-500 mt-1">Date: {new Date().toLocaleDateString('en-GB')}</p>
                    </div>
                 </div>

                 {/* Basic Info Grid */}
                 <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="col-span-1">
                        <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 mx-auto">
                            <img src={employee.avatar} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <div className="col-span-3 grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div className="border-b border-gray-100 pb-1">
                            <span className="text-gray-500 block text-xs">الاسم الرباعي</span>
                            <span className="font-bold text-gray-900 text-base">{employee.name}</span>
                        </div>
                        <div className="border-b border-gray-100 pb-1">
                            <span className="text-gray-500 block text-xs">الكود الوظيفي</span>
                            <span className="font-mono font-bold text-indigo-700 text-base">{employee.employeeCode}</span>
                        </div>
                        <div className="border-b border-gray-100 pb-1">
                            <span className="text-gray-500 block text-xs">المسمى الوظيفي</span>
                            <span className="font-bold text-gray-900">{employee.jobTitle}</span>
                        </div>
                        <div className="border-b border-gray-100 pb-1">
                            <span className="text-gray-500 block text-xs">القسم / الإدارة</span>
                            <span className="font-bold text-gray-900">{employee.department}</span>
                        </div>
                        <div className="border-b border-gray-100 pb-1">
                            <span className="text-gray-500 block text-xs">تاريخ التعيين</span>
                            <span className="font-mono text-gray-900">{employee.joinDate}</span>
                        </div>
                        <div className="border-b border-gray-100 pb-1">
                            <span className="text-gray-500 block text-xs">الرقم القومي</span>
                            <span className="font-mono text-gray-900">{employee.nationalId}</span>
                        </div>
                    </div>
                 </div>

                 {/* Financials & Status */}
                 <div className="mb-8">
                    <h4 className="text-sm font-bold text-gray-700 bg-gray-100 p-2 rounded mb-3">البيانات المالية والتعاقدية</h4>
                    <table className="w-full text-sm text-right border border-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="border border-gray-300 p-2">نوع العقد</th>
                                <th className="border border-gray-300 p-2">الراتب الأساسي</th>
                                <th className="border border-gray-300 p-2">التأمين الاجتماعي</th>
                                <th className="border border-gray-300 p-2">حالة العمل</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 p-2">{employee.contractType}</td>
                                <td className="border border-gray-300 p-2">{employee.salary.toLocaleString()} ج.م</td>
                                <td className="border border-gray-300 p-2">{insurance ? insurance.insuranceNumber : 'غير مؤمن'}</td>
                                <td className="border border-gray-300 p-2">{employee.status === 'active' ? 'على رأس العمل' : 'متوقف/إجازة'}</td>
                            </tr>
                        </tbody>
                    </table>
                 </div>

                 {/* Balances */}
                 <div className="mb-8">
                    <h4 className="text-sm font-bold text-gray-700 bg-gray-100 p-2 rounded mb-3">أرصدة الإجازات (السنة الحالية)</h4>
                    <table className="w-full text-sm text-right border border-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="border border-gray-300 p-2">نوع الرصيد</th>
                                <th className="border border-gray-300 p-2">الإجمالي</th>
                                <th className="border border-gray-300 p-2">المستهلك</th>
                                <th className="border border-gray-300 p-2">المتبقي</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 p-2 font-bold">سنوي</td>
                                <td className="border border-gray-300 p-2">{leaveBalance?.annualTotal || 0}</td>
                                <td className="border border-gray-300 p-2">{leaveBalance?.annualUsed || 0}</td>
                                <td className="border border-gray-300 p-2 font-bold text-indigo-700">{(leaveBalance?.annualTotal || 0) - (leaveBalance?.annualUsed || 0)}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2 font-bold">عارضة</td>
                                <td className="border border-gray-300 p-2">{leaveBalance?.casualTotal || 0}</td>
                                <td className="border border-gray-300 p-2">{leaveBalance?.casualUsed || 0}</td>
                                <td className="border border-gray-300 p-2 font-bold text-indigo-700">{(leaveBalance?.casualTotal || 0) - (leaveBalance?.casualUsed || 0)}</td>
                            </tr>
                        </tbody>
                    </table>
                 </div>

                 {/* Active Loans/Penalties */}
                 <div className="mb-12">
                    <h4 className="text-sm font-bold text-gray-700 bg-gray-100 p-2 rounded mb-3">الجزاءات والسلف النشطة</h4>
                    {activeLoans.length > 0 ? (
                        <table className="w-full text-sm text-right border border-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="border border-gray-300 p-2">النوع</th>
                                    <th className="border border-gray-300 p-2">التاريخ</th>
                                    <th className="border border-gray-300 p-2">المبلغ</th>
                                    <th className="border border-gray-300 p-2">المتبقي</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeLoans.map(l => (
                                    <tr key={l.id}>
                                        <td className="border border-gray-300 p-2">{l.type}</td>
                                        <td className="border border-gray-300 p-2">{l.date}</td>
                                        <td className="border border-gray-300 p-2">{l.amount}</td>
                                        <td className="border border-gray-300 p-2">{l.remainingAmount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-sm text-gray-500 border border-gray-200 p-2 text-center">لا توجد جزاءات أو سلف نشطة حالياً.</p>
                    )}
                 </div>

                 {/* Signatures */}
                 <div className="grid grid-cols-3 gap-8 mt-20 pt-8 border-t border-gray-200 text-center text-sm font-bold text-gray-800">
                    <div>
                        <p className="mb-12">توقيع الموظف</p>
                        <div className="border-t border-dotted border-gray-400 w-2/3 mx-auto"></div>
                    </div>
                    <div>
                        <p className="mb-12">مدير الموارد البشرية</p>
                        <div className="border-t border-dotted border-gray-400 w-2/3 mx-auto"></div>
                    </div>
                    <div>
                        <p className="mb-12">المدير العام</p>
                        <div className="border-t border-dotted border-gray-400 w-2/3 mx-auto"></div>
                    </div>
                 </div>

              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeDetails;
)



--- START OF FILE src/pages/Employees.tsx ---
(
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEPARTMENTS as DEFAULT_DEPTS, MOCK_SHIFTS } from '../constants';
import { Search, Plus, Filter, MoreVertical, FileText, User, CreditCard, CalendarOff, Contact, X, Printer, QrCode, Trash2, Save, Building2, Clock, RefreshCw } from 'lucide-react';
import { Employee, EmploymentType, Shift } from '../types';
import DataControls from '../components/DataControls';
import { api } from '../services/api'; // Import API
import { AppContext } from '../App';

const Employees: React.FC = () => {
  const { isServerOnline } = useContext(AppContext);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('shifts_data');
    return saved ? JSON.parse(saved) : MOCK_SHIFTS;
  });

  // Departments State
  const [departments, setDepartments] = useState<string[]>(() => {
      const saved = localStorage.getItem('system_departments');
      return saved ? JSON.parse(saved) : DEFAULT_DEPTS;
  });
  
  // Global Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Column Filters State
  const [colFilters, setColFilters] = useState({
    code: '',
    name: '',
    department: 'all',
    nationalId: '',
    joinDate: '',
    status: 'all'
  });
  
  // ID Card State
  const [cardEmployee, setCardEmployee] = useState<Employee | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Add Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    nationalId: '',
    jobTitle: '',
    department: '',
    salary: 0,
    contractType: EmploymentType.FULL_TIME,
    status: 'active',
    joinDate: new Date().toISOString().split('T')[0],
    employeeCode: '',
    shiftId: '',
    managerId: '' // Direct Manager
  });

  const navigate = useNavigate();
  const isAdmin = true;

  // --- Fetch Employees from DB ---
  const fetchEmployees = async () => {
      setLoading(true);
      try {
          if (isServerOnline) {
              const data = await api.getEmployees();
              setEmployees(data);
          } else {
              // Fallback for offline (optional, or just show error)
              const saved = localStorage.getItem('employees_data');
              if (saved) setEmployees(JSON.parse(saved));
          }
      } catch (err) {
          console.error("Failed to fetch employees", err);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchEmployees();
  }, [isServerOnline]);

  const filteredEmployees = employees.filter(emp => {
    const matchesGlobal = (emp.name || '').includes(searchTerm) || 
                          (emp.nationalId || '').includes(searchTerm) || 
                          (emp.employeeCode || '').includes(searchTerm);

    const matchesCode = (emp.employeeCode || '').toLowerCase().includes(colFilters.code.toLowerCase());
    const matchesName = (emp.name || '').toLowerCase().includes(colFilters.name.toLowerCase());
    const matchesDept = colFilters.department === 'all' || emp.department === colFilters.department;
    const matchesNID = (emp.nationalId || '').includes(colFilters.nationalId);
    const matchesDate = (emp.joinDate || '').includes(colFilters.joinDate);
    const matchesStatus = colFilters.status === 'all' || emp.status === colFilters.status;
    
    return matchesGlobal && matchesCode && matchesName && matchesDept && matchesNID && matchesDate && matchesStatus;
  });

  const handleImport = (data: any[]) => {
    // For bulk import, we should create a batch API, but for now loop
    // Note: This is simplified
    data.forEach(async (d: any) => {
        const emp = { ...d, id: `E${Date.now()}_${Math.random()}` };
        if(isServerOnline) await api.saveEmployee(emp);
    });
    setTimeout(fetchEmployees, 1000); // Refresh after delay
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedShift = shifts.find(s => s.id === newEmployee.shiftId);

    const employee: Employee = {
      id: `E${Date.now()}`,
      employeeCode: newEmployee.employeeCode || `EMP-${Math.floor(Math.random() * 10000)}`,
      name: newEmployee.name || '',
      nationalId: newEmployee.nationalId || '',
      jobTitle: newEmployee.jobTitle || '',
      department: newEmployee.department || '',
      joinDate: newEmployee.joinDate || '',
      salary: Number(newEmployee.salary) || 0,
      status: 'active',
      avatar: `https://ui-avatars.com/api/?name=${newEmployee.name}&background=random`,
      contractType: newEmployee.contractType as EmploymentType,
      shiftId: newEmployee.shiftId,
      shiftName: selectedShift ? selectedShift.name : '',
      managerId: newEmployee.managerId
    };

    if (isServerOnline) {
        try {
            await api.saveEmployee(employee);
            alert('تم حفظ الموظف في قاعدة البيانات بنجاح');
            fetchEmployees();
        } catch (err) {
            alert('فشل الحفظ في قاعدة البيانات');
        }
    } else {
        // Local Fallback
        const updated = [...employees, employee];
        setEmployees(updated);
        localStorage.setItem('employees_data', JSON.stringify(updated));
    }

    setIsAddModalOpen(false);
    setNewEmployee({
      name: '', nationalId: '', jobTitle: '', department: '', salary: 0, 
      contractType: EmploymentType.FULL_TIME, status: 'active', 
      joinDate: new Date().toISOString().split('T')[0], employeeCode: '', shiftId: '', managerId: ''
    });
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف نهائياً؟')) {
        if (isServerOnline) {
            await api.deleteEmployee(id);
            fetchEmployees();
        } else {
            const updated = employees.filter(e => e.id !== id);
            setEmployees(updated);
            localStorage.setItem('employees_data', JSON.stringify(updated));
        }
    }
    setOpenMenuId(null);
  };

  const handlePrintCard = () => {
    const printContent = document.getElementById('employee-id-card-content');
    if (!printContent) return;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head><title>بطاقة - ${cardEmployee?.name}</title><script src="https://cdn.tailwindcss.com"></script><style>body{font-family:'Arial';display:flex;justify-content:center;align-items:center;min-height:100vh}</style></head>
          <body>${printContent.innerHTML}<script>setTimeout(()=>{window.print();window.close()},500);</script></body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6" onClick={() => setOpenMenuId(null)}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              إدارة الموظفين
              {!isServerOnline && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded border border-red-200">وضع غير متصل (Local Only)</span>}
          </h2>
          <p className="text-sm text-gray-500">عرض وإدارة بيانات العاملين الأساسية (قاعدة بيانات ثابتة)</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchEmployees} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600" title="تحديث البيانات">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <DataControls data={employees} fileName="employees_data" onImport={handleImport} isAdmin={isAdmin} />
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">إضافة موظف</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 lg:flex-row lg:items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="بحث سريع..." className="w-full rounded-lg border border-gray-200 py-2 pr-10 pl-4 focus:border-indigo-500 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium">الكود الوظيفي</th>
                <th className="px-6 py-4 font-medium">الموظف</th>
                <th className="px-6 py-4 font-medium">القسم / الوظيفة</th>
                <th className="px-6 py-4 font-medium">الرقم القومي</th>
                <th className="px-6 py-4 font-medium">تاريخ التعيين</th>
                <th className="px-6 py-4 font-medium">الوردية</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">إجراءات</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-2"><input type="text" className="w-full text-xs p-1.5 border rounded" value={colFilters.code} onChange={(e) => setColFilters({...colFilters, code: e.target.value})} /></th>
                <th className="px-6 py-2"><input type="text" className="w-full text-xs p-1.5 border rounded" value={colFilters.name} onChange={(e) => setColFilters({...colFilters, name: e.target.value})} /></th>
                <th className="px-6 py-2"><select className="w-full text-xs p-1.5 border rounded" value={colFilters.department} onChange={(e) => setColFilters({...colFilters, department: e.target.value})}><option value="all">الكل</option>{departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}</select></th>
                <th className="px-6 py-2"><input type="text" className="w-full text-xs p-1.5 border rounded" value={colFilters.nationalId} onChange={(e) => setColFilters({...colFilters, nationalId: e.target.value})} /></th>
                <th className="px-6 py-2"><input type="text" placeholder="YYYY-MM-DD" className="w-full text-xs p-1.5 border rounded" value={colFilters.joinDate} onChange={(e) => setColFilters({...colFilters, joinDate: e.target.value})} /></th>
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2"><select className="w-full text-xs p-1.5 border rounded" value={colFilters.status} onChange={(e) => setColFilters({...colFilters, status: e.target.value})}><option value="all">الكل</option><option value="active">نشط</option><option value="on_leave">إجازة</option><option value="inactive">متوقف</option></select></th>
                <th className="px-6 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} onClick={() => navigate(`/employees/${emp.id}`)} className="hover:bg-gray-50 transition cursor-pointer">
                  <td className="px-6 py-4"><span className="font-mono font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded">{emp.employeeCode}</span></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><img src={emp.avatar || 'https://via.placeholder.com/40'} alt="" className="h-10 w-10 rounded-full object-cover" /><div><p className="font-semibold text-gray-900">{emp.name}</p></div></div></td>
                  <td className="px-6 py-4"><p className="font-medium text-gray-900">{emp.jobTitle}</p><p className="text-xs text-gray-500">{emp.department}</p></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2 text-gray-600"><CreditCard className="h-4 w-4 text-gray-400" /><span className="font-mono text-sm">{emp.nationalId}</span></div></td>
                  <td className="px-6 py-4"><div className="text-gray-600 font-mono text-sm">{emp.joinDate}</div></td>
                  <td className="px-6 py-4"><span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{emp.shiftName || 'غير محدد'}</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{emp.status === 'active' ? 'نشط' : 'متوقف'}</span></td>
                  <td className="px-6 py-4 relative">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                       <button onClick={(e) => { e.stopPropagation(); setCardEmployee(emp); }} className="text-gray-400 hover:text-indigo-600 bg-gray-50 p-1.5 rounded"><Contact className="h-4 w-4" /></button>
                       <button onClick={() => navigate(`/employees/${emp.id}`)} className="text-gray-400 hover:text-indigo-600 bg-gray-50 p-1.5 rounded"><User className="h-4 w-4" /></button>
                       <div className="relative">
                          <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === emp.id ? null : emp.id); }} className="text-gray-400 hover:text-indigo-600 bg-gray-50 p-1.5 rounded"><MoreVertical className="h-4 w-4" /></button>
                          {openMenuId === emp.id && (
                             <div className="absolute left-0 top-8 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1">
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id); }} className="w-full text-right px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="h-3 w-3" /> حذف</button>
                             </div>
                          )}
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEmployees.length === 0 && <div className="p-8 text-center text-gray-500">لا توجد بيانات موظفين</div>}
        </div>
      </div>

      {/* ID Card Modal (Simplified) */}
      {cardEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
             <div id="employee-id-card-content" className="border-2 border-indigo-600 rounded-xl overflow-hidden">
                <div className="bg-indigo-600 text-white p-4 text-center"><h2 className="font-bold">بطاقة تعريف موظف</h2></div>
                <div className="p-6 text-center">
                    <img src={cardEmployee.avatar} className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg -mt-12 mb-4" />
                    <h3 className="text-xl font-bold">{cardEmployee.name}</h3>
                    <p className="text-gray-500">{cardEmployee.jobTitle}</p>
                    <div className="mt-4 text-left bg-gray-50 p-3 rounded text-sm">
                        <p><strong>الكود:</strong> {cardEmployee.employeeCode}</p>
                        <p><strong>القسم:</strong> {cardEmployee.department}</p>
                        <p><strong>الهوية:</strong> {cardEmployee.nationalId}</p>
                    </div>
                </div>
             </div>
             <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setCardEmployee(null)} className="px-4 py-2 border rounded">إغلاق</button>
                <button onClick={handlePrintCard} className="px-4 py-2 bg-indigo-600 text-white rounded">طباعة</button>
             </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-gray-100 p-6 bg-gray-50 rounded-t-2xl">
                 <h3 className="font-bold text-gray-800">إضافة موظف جديد</h3>
                 <button onClick={() => setIsAddModalOpen(false)}><X className="h-6 w-6" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                 <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2"><label className="text-sm block mb-1">الاسم الكامل</label><input type="text" required className="w-full border rounded p-2" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} /></div>
                    <div><label className="text-sm block mb-1">المسمى الوظيفي</label><input type="text" required className="w-full border rounded p-2" value={newEmployee.jobTitle} onChange={e => setNewEmployee({...newEmployee, jobTitle: e.target.value})} /></div>
                    <div><label className="text-sm block mb-1">القسم</label><select required className="w-full border rounded p-2" value={newEmployee.department} onChange={e => setNewEmployee({...newEmployee, department: e.target.value})}><option value="">اختر القسم</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                    
                    <div>
                        <label className="text-sm block mb-1">الوردية</label>
                        <select required className="w-full border rounded p-2" value={newEmployee.shiftId} onChange={e => setNewEmployee({...newEmployee, shiftId: e.target.value})}>
                            <option value="">اختر الوردية</option>
                            {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm block mb-1">المدير المباشر</label>
                        <select 
                            className="w-full border rounded p-2" 
                            value={newEmployee.managerId || ''} 
                            onChange={e => setNewEmployee({...newEmployee, managerId: e.target.value})}
                        >
                            <option value="">لا يوجد مدير مباشر</option>
                            {employees.filter(e => e.status === 'active').map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name} - {emp.jobTitle}</option>
                            ))}
                        </select>
                    </div>

                    <div><label className="text-sm block mb-1">الراتب</label><input type="number" required className="w-full border rounded p-2" value={newEmployee.salary} onChange={e => setNewEmployee({...newEmployee, salary: Number(e.target.value)})} /></div>
                    <div><label className="text-sm block mb-1">الكود</label><input type="text" required className="w-full border rounded p-2" value={newEmployee.employeeCode} onChange={e => setNewEmployee({...newEmployee, employeeCode: e.target.value})} /></div>
                    
                    <button type="submit" className="md:col-span-2 bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">حفظ الموظف</button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
)



--- START OF FILE src/pages/Insurance.tsx ---
(
import React, { useState, useEffect } from 'react';
import { MOCK_INSURANCE, MOCK_EMPLOYEES } from '../constants';
import { InsuranceRecord, Employee } from '../types';
import { ShieldCheck, Plus, ExternalLink, Search, DollarSign, Users, FileSearch, X, AlertCircle, Save } from 'lucide-react';
import DataControls from '../components/DataControls';

const Insurance: React.FC = () => {
  const [insuranceData, setInsuranceData] = useState<InsuranceRecord[]>(() => {
    const saved = localStorage.getItem('insurance_data');
    if (saved) return JSON.parse(saved);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_INSURANCE : [];
  });

  // Load employees for the dropdown
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('employees_data');
    if (saved) return JSON.parse(saved);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_EMPLOYEES : [];
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Column Filters
  const [colFilters, setColFilters] = useState({
    employeeName: '',
    insuranceNumber: '',
    salaryInsured: '',
    companyShare: '',
    employeeShare: '',
    status: 'all'
  });
  
  // Modals
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<InsuranceRecord | null>(null);
  
  // Add Form State
  const [newRecord, setNewRecord] = useState({
    employeeName: '',
    insuranceNumber: '',
    salaryInsured: 0,
    companyShare: 0,
    employeeShare: 0
  });

  // Query Logic
  const [queryInput, setQueryInput] = useState('');
  const [queryResult, setQueryResult] = useState<InsuranceRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const isAdmin = true;

  // Persist
  useEffect(() => {
    localStorage.setItem('insurance_data', JSON.stringify(insuranceData));
  }, [insuranceData]);

  const handleImport = (data: any[]) => {
    const newItems = data.map((d, i) => ({ ...MOCK_INSURANCE[0], ...d, id: `IMP-INS-${i}` }));
    setInsuranceData(prev => [...prev, ...newItems]);
  };

  const filteredData = insuranceData.filter(item => {
    // 1. Global Search
    const matchesGlobal = item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.insuranceNumber.includes(searchTerm);

    // 2. Column Filters
    const matchesName = item.employeeName.toLowerCase().includes(colFilters.employeeName.toLowerCase());
    const matchesNumber = item.insuranceNumber.includes(colFilters.insuranceNumber);
    const matchesSalary = colFilters.salaryInsured ? item.salaryInsured.toString().includes(colFilters.salaryInsured) : true;
    const matchesCompany = colFilters.companyShare ? item.companyShare.toString().includes(colFilters.companyShare) : true;
    const matchesEmployee = colFilters.employeeShare ? item.employeeShare.toString().includes(colFilters.employeeShare) : true;
    const matchesStatus = colFilters.status === 'all' || item.status === colFilters.status;

    return matchesGlobal && matchesName && matchesNumber && matchesSalary && matchesCompany && matchesEmployee && matchesStatus;
  });

  const totalCompanyShare = insuranceData.reduce((acc, curr) => acc + curr.companyShare, 0);

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = insuranceData.find(r => r.insuranceNumber === queryInput);
    setQueryResult(found || null);
    setHasSearched(true);
  };

  // Calculations for Add Form
  const handleSalaryChange = (value: string) => {
    const salary = Number(value);
    setNewRecord(prev => ({
      ...prev,
      salaryInsured: salary,
      companyShare: Math.round(salary * 0.1875), // Approx 18.75%
      employeeShare: Math.round(salary * 0.11)   // Approx 11%
    }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: InsuranceRecord = {
      id: `INS-${Date.now()}`,
      employeeName: newRecord.employeeName,
      insuranceNumber: newRecord.insuranceNumber,
      salaryInsured: newRecord.salaryInsured,
      companyShare: newRecord.companyShare,
      employeeShare: newRecord.employeeShare,
      status: 'active'
    };
    setInsuranceData([...insuranceData, record]);
    setIsAddModalOpen(false);
    setNewRecord({ employeeName: '', insuranceNumber: '', salaryInsured: 0, companyShare: 0, employeeShare: 0 });
    alert('تم إضافة المؤمن عليه بنجاح');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">التأمينات الاجتماعية</h2>
          <p className="text-sm text-gray-500 mt-1">إدارة الملفات التأمينية وحصص الموظف والشركة</p>
        </div>
        <div className="flex gap-3">
          <DataControls 
            data={insuranceData} 
            fileName="social_insurance_data" 
            isAdmin={isAdmin}
            onImport={handleImport}
            headers={[
              { key: 'employeeName', label: 'الموظف' },
              { key: 'insuranceNumber', label: 'الرقم التأميني' },
              { key: 'salaryInsured', label: 'الأجر التأميني' },
              { key: 'companyShare', label: 'حصة الشركة' },
              { key: 'employeeShare', label: 'حصة الموظف' }
            ]}
          />
          <button 
            onClick={() => {
              setIsQueryModalOpen(true);
              setQueryInput('');
              setHasSearched(false);
              setQueryResult(null);
            }}
            className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <FileSearch className="h-5 w-5 text-gray-500" />
            <span>استعلام</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-md hover:bg-indigo-700 transition-all hover:shadow-lg active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span>إضافة مؤمن عليه</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
             <div>
                 <p className="text-sm font-medium text-blue-600 mb-1">إجمالي المؤمن عليهم</p>
                 <p className="text-4xl font-bold text-gray-800">{insuranceData.length}</p>
             </div>
             <div className="bg-blue-100 p-4 rounded-full shadow-sm">
                 <Users className="h-8 w-8 text-blue-600" />
             </div>
         </div>
         <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-100 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
             <div>
                 <p className="text-sm font-medium text-green-600 mb-1">إجمالي تكلفة الشركة (شهرياً)</p>
                 <p className="text-4xl font-bold text-gray-800">{totalCompanyShare.toLocaleString()} <span className="text-lg text-gray-400 font-medium">ج.م</span></p>
             </div>
             <div className="bg-green-100 p-4 rounded-full shadow-sm">
                 <DollarSign className="h-8 w-8 text-green-600" />
             </div>
         </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center p-5 border-b border-gray-100 bg-gray-50/50">
           <div className="relative w-full sm:w-96">
             <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
             <input 
               type="text" 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="بحث بالاسم أو الرقم التأميني..."
               className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
             />
           </div>
        </div>
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">الموظف</th>
                <th className="px-6 py-4 font-semibold">الرقم التأميني</th>
                <th className="px-6 py-4 font-semibold">الأجر التأميني</th>
                <th className="px-6 py-4 font-semibold">حصة الشركة</th>
                <th className="px-6 py-4 font-semibold">حصة الموظف</th>
                <th className="px-6 py-4 font-semibold">الحالة</th>
                <th className="px-6 py-4 font-semibold text-center">التفاصيل</th>
              </tr>
              {/* Filter Row */}
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-2">
                  <input 
                    type="text" 
                    placeholder="اسم الموظف..." 
                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                    value={colFilters.employeeName}
                    onChange={(e) => setColFilters({...colFilters, employeeName: e.target.value})}
                  />
                </th>
                <th className="px-6 py-2">
                  <input 
                    type="text" 
                    placeholder="الرقم..." 
                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                    value={colFilters.insuranceNumber}
                    onChange={(e) => setColFilters({...colFilters, insuranceNumber: e.target.value})}
                  />
                </th>
                <th className="px-6 py-2">
                  <input 
                    type="text" 
                    placeholder="الأجر..." 
                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                    value={colFilters.salaryInsured}
                    onChange={(e) => setColFilters({...colFilters, salaryInsured: e.target.value})}
                  />
                </th>
                <th className="px-6 py-2">
                  <input 
                    type="text" 
                    placeholder="حصة الشركة..." 
                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                    value={colFilters.companyShare}
                    onChange={(e) => setColFilters({...colFilters, companyShare: e.target.value})}
                  />
                </th>
                <th className="px-6 py-2">
                  <input 
                    type="text" 
                    placeholder="حصة الموظف..." 
                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                    value={colFilters.employeeShare}
                    onChange={(e) => setColFilters({...colFilters, employeeShare: e.target.value})}
                  />
                </th>
                <th className="px-6 py-2">
                  <select 
                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                    value={colFilters.status}
                    onChange={(e) => setColFilters({...colFilters, status: e.target.value})}
                  >
                    <option value="all">الكل</option>
                    <option value="active">مؤمن عليه</option>
                    <option value="pending">قيد التسجيل</option>
                  </select>
                </th>
                <th className="px-6 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.length > 0 ? (
                filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                       <div className="bg-indigo-50 p-1.5 rounded text-indigo-600">
                          <ShieldCheck className="h-4 w-4" />
                       </div>
                       {record.employeeName}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono tracking-wide">{record.insuranceNumber}</td>
                    <td className="px-6 py-4 text-gray-900 font-bold font-mono">{record.salaryInsured.toLocaleString()} ج.م</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{record.companyShare.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{record.employeeShare.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border
                        ${record.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}
                      `}>
                        {record.status === 'active' ? 'مؤمن عليه' : 'قيد التسجيل'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button 
                          onClick={() => setSelectedRecord(record)}
                          className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all"
                       >
                          <ExternalLink className="h-4 w-4" />
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 bg-gray-50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="h-8 w-8 text-gray-300" />
                      <p>لا توجد سجلات مطابقة</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 p-6 bg-gray-50 rounded-t-2xl">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    تفاصيل الملف التأميني
                 </h3>
                 <button onClick={() => setSelectedRecord(null)} className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6">
                 <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600 font-bold text-xl">
                       {selectedRecord.employeeName.charAt(0)}
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">{selectedRecord.employeeName}</h4>
                    <p className="text-gray-500 font-mono text-sm">#{selectedRecord.insuranceNumber}</p>
                 </div>
                 
                 <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 mb-6">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-gray-600">الأجر التأميني الأساسي</span>
                       <span className="font-bold text-lg text-gray-900">{selectedRecord.salaryInsured.toLocaleString()} ج.م</span>
                    </div>
                    <div className="h-px bg-indigo-200 my-2"></div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                          <span className="block text-gray-500 text-xs mb-1">حصة الشركة (18.75%)</span>
                          <span className="font-bold text-indigo-700">{selectedRecord.companyShare} ج.م</span>
                       </div>
                       <div>
                          <span className="block text-gray-500 text-xs mb-1">حصة الموظف (11%)</span>
                          <span className="font-bold text-indigo-700">{selectedRecord.employeeShare} ج.م</span>
                       </div>
                    </div>
                 </div>

                 <div className="flex justify-between items-center text-sm text-gray-500 px-2">
                    <span>إجمالي التوريد الشهري للهيئة:</span>
                    <span className="font-bold text-gray-900">{(selectedRecord.companyShare + selectedRecord.employeeShare).toLocaleString()} ج.م</span>
                 </div>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end rounded-b-2xl">
                 <button onClick={() => setSelectedRecord(null)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-100">إغلاق</button>
              </div>
           </div>
        </div>
      )}

      {/* Add Insured Person Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-gray-100 p-6 bg-gray-50 rounded-t-2xl">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-indigo-600" />
                    إضافة مؤمن عليه جديد
                 </h3>
                 <button onClick={() => setIsAddModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700"><X className="h-5 w-5" /></button>
              </div>
              
              <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto">
                 <div className="space-y-4">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">الموظف</label>
                       <select 
                          required
                          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                          value={newRecord.employeeName}
                          onChange={(e) => setNewRecord({...newRecord, employeeName: e.target.value})}
                       >
                          <option value="">اختر الموظف...</option>
                          {employees.map(emp => (
                             <option key={emp.id} value={emp.name}>{emp.name} - {emp.employeeCode}</option>
                          ))}
                       </select>
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">الرقم التأميني</label>
                       <input 
                          type="text" 
                          required
                          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                          placeholder="xxxxxxxx"
                          value={newRecord.insuranceNumber}
                          onChange={(e) => setNewRecord({...newRecord, insuranceNumber: e.target.value})}
                       />
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">الأجر التأميني</label>
                       <div className="relative">
                          <input 
                             type="number" 
                             required
                             min="0"
                             className="w-full rounded-lg border border-gray-300 p-2.5 pl-10 text-sm focus:border-indigo-500 focus:outline-none font-bold"
                             value={newRecord.salaryInsured}
                             onChange={(e) => handleSalaryChange(e.target.value)}
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">ج.م</span>
                       </div>
                    </div>

                    {/* Auto Calculated Fields */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs text-gray-500 mb-1">حصة الشركة (18.75%)</label>
                          <div className="font-bold text-indigo-700">{newRecord.companyShare.toLocaleString()} ج.م</div>
                       </div>
                       <div>
                          <label className="block text-xs text-gray-500 mb-1">حصة الموظف (11%)</label>
                          <div className="font-bold text-indigo-700">{newRecord.employeeShare.toLocaleString()} ج.م</div>
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 flex gap-3">
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
                       <Save className="h-4 w-4" />
                       حفظ البيانات
                    </button>
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">
                       إلغاء
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Query Modal */}
      {isQueryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800">استعلام عن الرقم التأميني</h3>
              <button 
                onClick={() => setIsQueryModalOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleQuerySubmit} className="relative mb-6">
                <input
                  type="text"
                  required
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="أدخل الرقم التأميني للبحث..."
                  className="w-full rounded-xl border border-gray-300 p-3 pr-12 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <button 
                  type="submit"
                  className="absolute left-2 top-1.5 bottom-1.5 bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                >
                  بحث
                </button>
                <FileSearch className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </form>

              {hasSearched && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  {queryResult ? (
                    <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-green-200/50 text-green-800 font-bold">
                        <div className="bg-white p-1 rounded-full shadow-sm">
                           <ShieldCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <span>بيانات تأمينية نشطة</span>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">الاسم:</span>
                          <span className="font-bold text-gray-900">{queryResult.employeeName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">الرقم التأميني:</span>
                          <span className="font-mono font-medium bg-white px-2 py-0.5 rounded border border-green-100">{queryResult.insuranceNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">الأجر التأميني:</span>
                          <span className="font-medium">{queryResult.salaryInsured.toLocaleString()} ج.م</span>
                        </div>
                         <div className="flex justify-between">
                          <span className="text-gray-600">حصة الشركة:</span>
                          <span className="font-medium">{queryResult.companyShare.toLocaleString()} ج.م</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 rounded-xl p-6 border border-red-100 text-center">
                      <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                         <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <p className="font-bold text-red-800 mb-1">لم يتم العثور على بيانات</p>
                      <p className="text-sm text-red-600 opacity-80">تأكد من صحة الرقم التأميني وحاول مرة أخرى.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insurance;
)


--- START OF FILE src/pages/Leaves.tsx ---
(
import React, { useState, useEffect, useContext } from 'react';
import { MOCK_LEAVES, MOCK_LEAVE_BALANCES, MOCK_EMPLOYEES } from '../constants';
import { LeaveRequest, LeaveBalance, UserRole } from '../types';
import { Calendar, Check, X, Clock, PlusCircle, Settings, X as CloseIcon, Search, Filter, PieChart, ShieldCheck, UserCheck } from 'lucide-react';
import DataControls from '../components/DataControls';
import { AppContext } from '../App';

const Leaves: React.FC = () => {
  const { currentUser, addNotification } = useContext(AppContext);

  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('leaves_data');
    if (saved) return JSON.parse(saved);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_LEAVES : [];
  });
  
  const [balances, setBalances] = useState<LeaveBalance[]>(() => {
    const saved = localStorage.getItem('leaves_balances');
    if (saved) return JSON.parse(saved);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_LEAVE_BALANCES : [];
  });
  
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [requestForm, setRequestForm] = useState({
    employeeName: '',
    type: 'سنوي',
    startDate: '',
    endDate: '',
    days: 1
  });

  const isAdmin = true;
  const leaveTypes = ['سنوي', 'مرضي', 'عارضة', 'بدون راتب', 'إجازة وضع', 'إجازة أبوة'];

  useEffect(() => { localStorage.setItem('leaves_data', JSON.stringify(leaves)); }, [leaves]);
  useEffect(() => { localStorage.setItem('leaves_balances', JSON.stringify(balances)); }, [balances]);

  const handleImport = (data: any[]) => {
    const newItems = data.map((d, i) => ({ ...MOCK_LEAVES[0], ...d, id: `IMP-LV-${i}` }));
    setLeaves(prev => [...prev, ...newItems]);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLeave: LeaveRequest = {
      id: `LR-${Date.now()}`,
      employeeName: currentUser?.role === UserRole.EMPLOYEE ? currentUser.fullName : requestForm.employeeName,
      type: requestForm.type as any,
      startDate: requestForm.startDate,
      endDate: requestForm.endDate,
      days: Number(requestForm.days),
      status: 'pending' 
    };
    setLeaves([newLeave, ...leaves]);
    addNotification('طلب إجازة جديد', `قام ${newLeave.employeeName} بتقديم طلب إجازة.`);
    setIsRequestModalOpen(false);
    setRequestForm({ employeeName: '', type: 'سنوي', startDate: '', endDate: '', days: 1 });
  };

  // --- WORKFLOW HANDLERS ---

  const handleReview = (id: string) => {
      const reviewer = currentUser?.fullName || 'المراجع';
      if (window.confirm(`تأكيد مراجعة الطلب؟\nبواسطة: ${reviewer}`)) {
          setLeaves(prev => prev.map(l => l.id === id ? { 
              ...l, 
              status: 'reviewed', 
              reviewedBy: reviewer 
          } : l));
          addNotification('تمت مراجعة طلب إجازة', `قام ${reviewer} بمراجعة طلب.`);
      }
  };

  const handleApprove = (id: string) => {
      const approver = currentUser?.fullName || 'المدير';
      if (window.confirm(`تأكيد الاعتماد النهائي؟\nبواسطة: ${approver}`)) {
          setLeaves(prev => prev.map(l => l.id === id ? { 
              ...l, 
              status: 'approved', 
              approvedBy: approver 
          } : l));
          addNotification('تم اعتماد إجازة', `وافق ${approver} على طلب الإجازة.`);
      }
  };

  const handleReject = (id: string) => {
      if (window.confirm('هل أنت متأكد من رفض الطلب؟')) {
          setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' } : l));
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
       <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div><h2 className="text-2xl font-bold text-gray-800">إدارة الإجازات</h2><p className="text-sm text-gray-500 mt-1">طلبات الإجازات، الأرصدة المتبقية، وسجل الغياب</p></div>
        <div className="flex gap-3">
          {currentUser?.role !== UserRole.EMPLOYEE && <DataControls data={leaves} fileName="leaves_requests" isAdmin={isAdmin} onImport={handleImport} />}
          <button onClick={() => setIsBalanceModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-gray-700 shadow-sm hover:bg-gray-50 transition-all"><Settings className="h-5 w-5 text-gray-500" /><span>{currentUser?.role === UserRole.EMPLOYEE ? 'رصيدي' : 'إدارة الأرصدة'}</span></button>
          <button onClick={() => setIsRequestModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-md hover:bg-indigo-700 transition-all"><PlusCircle className="h-5 w-5" /><span>طلب إجازة</span></button>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center bg-gray-50/50">
          <div className="relative flex-1"><Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="بحث باسم الموظف..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-4 focus:border-indigo-500 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">الموظف</th>
                <th className="px-6 py-4 font-semibold">النوع</th>
                <th className="px-6 py-4 font-semibold">من</th>
                <th className="px-6 py-4 font-semibold">إلى</th>
                <th className="px-6 py-4 font-semibold">الأيام</th>
                <th className="px-6 py-4 font-semibold text-center">الاعتمادات</th>
                <th className="px-6 py-4 font-semibold text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leaves.filter(l => l.employeeName.toLowerCase().includes(searchTerm.toLowerCase())).map((leave) => (
                  <tr key={leave.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{leave.employeeName}</td>
                    <td className="px-6 py-4"><span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{leave.type}</span></td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{leave.startDate}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{leave.endDate}</td>
                    <td className="px-6 py-4 font-bold text-indigo-600">{leave.days}</td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex flex-col gap-1 items-center">
                            {leave.status === 'pending' && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs border border-yellow-200">انتظار المراجعة</span>}
                            
                            {(leave.status === 'reviewed' || leave.status === 'approved') && (
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] border border-blue-200 flex items-center gap-1">
                                    <UserCheck className="h-3 w-3" /> مراجعة: {leave.reviewedBy}
                                </span>
                            )}
                            
                            {leave.status === 'approved' && (
                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-[10px] border border-green-200 flex items-center gap-1 font-bold">
                                    <ShieldCheck className="h-3 w-3" /> اعتماد: {leave.approvedBy}
                                </span>
                            )}
                            
                            {leave.status === 'rejected' && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs flex items-center gap-1 w-fit border border-red-200"><X className="h-3 w-3" /> مرفوض</span>}
                        </div>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                        {currentUser?.role !== UserRole.EMPLOYEE && (
                            <div className="flex items-center justify-center gap-2">
                                {leave.status === 'pending' && (
                                    <button onClick={() => handleReview(leave.id)} className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded hover:bg-yellow-100 transition">مراجعة</button>
                                )}
                                {leave.status === 'reviewed' && (
                                    <button onClick={() => handleApprove(leave.id)} className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition font-bold">اعتماد</button>
                                )}
                                {(leave.status !== 'approved' && leave.status !== 'rejected') && (
                                    <button onClick={() => handleReject(leave.id)} className="p-1 rounded text-red-500 hover:bg-red-50" title="رفض"><X className="h-4 w-4" /></button>
                                )}
                            </div>
                        )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex justify-between mb-4"><h3 className="text-lg font-bold">طلب إجازة</h3><button onClick={() => setIsRequestModalOpen(false)}><CloseIcon className="h-5 w-5" /></button></div>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {currentUser?.role !== UserRole.EMPLOYEE && (
                  <div>
                    <label className="block text-sm font-medium mb-1">الموظف</label>
                    <select className="w-full border rounded p-2" value={requestForm.employeeName} onChange={e => setRequestForm({...requestForm, employeeName: e.target.value})}>
                      <option value="">اختر الموظف</option>
                      {MOCK_EMPLOYEES.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                  </div>
              )}
              <div><label className="block text-sm font-medium mb-1">النوع</label><select className="w-full border rounded p-2" value={requestForm.type} onChange={e => setRequestForm({...requestForm, type: e.target.value})}>{leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">من</label><input type="date" className="w-full border rounded p-2" value={requestForm.startDate} onChange={e => setRequestForm({...requestForm, startDate: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">إلى</label><input type="date" className="w-full border rounded p-2" value={requestForm.endDate} onChange={e => setRequestForm({...requestForm, endDate: e.target.value})} /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">الأيام</label><input type="number" className="w-full border rounded p-2" value={requestForm.days} onChange={e => setRequestForm({...requestForm, days: Number(e.target.value)})} /></div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">إرسال الطلب</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
)


--- START OF FILE src/pages/Loans.tsx ---
(
import React, { useState, useEffect, useContext } from 'react';
import { MOCK_LOANS, MOCK_EMPLOYEES } from '../constants';
import { LoanRecord, UserRole } from '../types';
import { Wallet, Plus, AlertCircle, X, Search, CheckCircle, XCircle, UserCheck, ShieldCheck, FileText } from 'lucide-react';
import DataControls from '../components/DataControls';
import { AppContext } from '../App';

const Loans: React.FC = () => {
  const { currentUser, addNotification } = useContext(AppContext);

  const [loans, setLoans] = useState<LoanRecord[]>(() => {
    const saved = localStorage.getItem('loans_data');
    if (saved) return JSON.parse(saved);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_LOANS : [];
  });
  
  const [activeTab, setActiveTab] = useState<'requests' | 'penalties' | 'active'>('requests');
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Column Filters
  const [colFilters, setColFilters] = useState({
    employeeName: '',
    type: 'all',
    amount: '',
    date: '',
    status: 'all'
  });
  
  const [formData, setFormData] = useState({
    employeeName: '',
    amount: '',
    installments: '',
    reason: ''
  });
  
  const isAdmin = true;

  useEffect(() => { localStorage.setItem('loans_data', JSON.stringify(loans)); }, [loans]);

  const handleImport = (data: any[]) => {
    const newItems = data.map((d, i) => ({ ...MOCK_LOANS[0], ...d, id: `IMP-LN-${i}` }));
    setLoans(prev => [...prev, ...newItems]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const newLoan: LoanRecord = {
      id: `LN-${Date.now()}`,
      employeeName: currentUser?.role === UserRole.EMPLOYEE ? currentUser.fullName : formData.employeeName,
      type: 'سلفة',
      amount: Number(formData.amount),
      date: new Date().toISOString().split('T')[0],
      remainingAmount: Number(formData.amount),
      status: 'pending',
      requestStatus: 'pending',
      installments: Number(formData.installments),
      reason: formData.reason
    };
    setLoans([newLoan, ...loans]);
    setIsLoanModalOpen(false);
    addNotification('طلب سلفة', `طلب سلفة جديد من ${newLoan.employeeName}`);
    setFormData({ employeeName: '', amount: '', installments: '', reason: '' });
  };

  const handleSubmitPenalty = (e: React.FormEvent) => {
    e.preventDefault();
    const newPenalty: LoanRecord = {
      id: `PN-${Date.now()}`,
      employeeName: formData.employeeName,
      type: 'جزاء',
      amount: Number(formData.amount),
      date: new Date().toISOString().split('T')[0],
      remainingAmount: Number(formData.amount),
      status: 'active', // Penalties usually active immediately
      requestStatus: 'approved', // Auto approved if added by Admin
      approvedBy: currentUser?.fullName,
      reason: formData.reason
    };
    setLoans([newPenalty, ...loans]);
    setIsPenaltyModalOpen(false);
    addNotification('تسجيل جزاء', `تم تسجيل جزاء على الموظف ${newPenalty.employeeName}`);
    setFormData({ employeeName: '', amount: '', installments: '', reason: '' });
  };

  // --- WORKFLOW ---
  const handleReview = (id: string) => {
      const reviewer = currentUser?.fullName || 'المراجع';
      setLoans(prev => prev.map(loan => loan.id === id ? { ...loan, requestStatus: 'reviewed', reviewedBy: reviewer } : loan));
      addNotification('مراجعة سلفة', 'تم مراجعة طلب السلفة.');
  };

  const handleApprove = (id: string) => {
      const approver = currentUser?.fullName || 'المدير';
      setLoans(prev => prev.map(loan => loan.id === id ? { 
          ...loan, 
          requestStatus: 'approved', 
          status: 'active', 
          approvedBy: approver 
      } : loan));
      addNotification('اعتماد سلفة', 'تمت الموافقة النهائية على السلفة.');
  };

  const handleReject = (id: string) => {
    setLoans(prev => prev.map(loan => loan.id === id ? { ...loan, requestStatus: 'rejected', status: 'completed' } : loan));
  };

  const filteredRecords = loans.filter(l => {
     if (currentUser?.role === UserRole.EMPLOYEE) {
         if (l.employeeName !== currentUser.fullName) return false;
     }
     
     let matchesTab = false;
     if (activeTab === 'requests') {
         matchesTab = l.type === 'سلفة' && (l.requestStatus === 'pending' || l.requestStatus === 'reviewed');
     } else if (activeTab === 'penalties') {
         matchesTab = l.type === 'جزاء' || l.type === 'خصم إداري'; 
     } else {
         matchesTab = l.type === 'سلفة' && l.requestStatus === 'approved';
     }

     // Filters
     const matchesSearch = l.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesName = l.employeeName.toLowerCase().includes(colFilters.employeeName.toLowerCase());
     const matchesType = colFilters.type === 'all' || l.type === colFilters.type;
     const matchesAmount = colFilters.amount ? l.amount.toString().includes(colFilters.amount) : true;
     const matchesDate = l.date.includes(colFilters.date);
     
     return matchesTab && matchesSearch && matchesName && matchesType && matchesAmount && matchesDate;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div><h2 className="text-2xl font-bold text-gray-800">السلف والجزاءات</h2><p className="text-sm text-gray-500 mt-1">إدارة طلبات السلف، الموافقات، وتسجيل الجزاءات</p></div>
        <div className="flex gap-3">
          {currentUser?.role !== UserRole.EMPLOYEE && <DataControls data={loans} fileName="loans_deductions" isAdmin={isAdmin} onImport={handleImport} />}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-200 pb-1">
        <div className="flex gap-8 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('requests')} className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'requests' ? 'text-indigo-600' : 'text-gray-500'}`}>طلبات السلف {activeTab === 'requests' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}</button>
          <button onClick={() => setActiveTab('penalties')} className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'penalties' ? 'text-red-600' : 'text-gray-500'}`}>الجزاءات والخصومات {activeTab === 'penalties' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full"></span>}</button>
          <button onClick={() => setActiveTab('active')} className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'active' ? 'text-green-600' : 'text-gray-500'}`}>السلف الجارية {activeTab === 'active' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-full"></span>}</button>
        </div>
        <div className="flex gap-3 w-full sm:w-auto justify-end">
          {activeTab === 'requests' && (
             <button onClick={() => setIsLoanModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 transition text-sm font-medium"><Plus className="h-4 w-4" /><span>طلب سلفة</span></button>
          )}
          {activeTab === 'penalties' && (
             <button onClick={() => setIsPenaltyModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white shadow-sm hover:bg-red-700 transition text-sm font-medium"><AlertCircle className="h-4 w-4" /><span>تسجيل جزاء</span></button>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">الموظف</th>
                <th className="px-6 py-4 font-semibold">النوع</th>
                <th className="px-6 py-4 font-semibold">القيمة</th>
                <th className="px-6 py-4 font-semibold">التاريخ</th>
                <th className="px-6 py-4 font-semibold">التفاصيل</th>
                <th className="px-6 py-4 font-semibold">الاعتمادات</th>
                <th className="px-6 py-4 font-semibold text-center">الإجراءات</th>
              </tr>
              {/* Filter Row */}
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-2"><input className="w-full text-xs p-1.5 border rounded focus:border-indigo-500 outline-none" placeholder="بحث باسم الموظف..." value={colFilters.employeeName} onChange={e => setColFilters({...colFilters, employeeName: e.target.value})} /></th>
                <th className="px-6 py-2">
                    <select className="w-full text-xs p-1.5 border rounded focus:border-indigo-500 outline-none" value={colFilters.type} onChange={e => setColFilters({...colFilters, type: e.target.value})}>
                        <option value="all">الكل</option>
                        <option value="سلفة">سلفة</option>
                        <option value="جزاء">جزاء</option>
                    </select>
                </th>
                <th className="px-6 py-2"><input type="number" className="w-full text-xs p-1.5 border rounded focus:border-indigo-500 outline-none" placeholder="المبلغ..." value={colFilters.amount} onChange={e => setColFilters({...colFilters, amount: e.target.value})} /></th>
                <th className="px-6 py-2"><input type="text" className="w-full text-xs p-1.5 border rounded focus:border-indigo-500 outline-none" placeholder="YYYY-MM-DD" value={colFilters.date} onChange={e => setColFilters({...colFilters, date: e.target.value})} /></th>
                <th className="px-6 py-2 bg-gray-100"></th>
                <th className="px-6 py-2 bg-gray-100"></th>
                <th className="px-6 py-2 bg-gray-100"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{record.employeeName}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs ${record.type === 'جزاء' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>{record.type}</span></td>
                    <td className="px-6 py-4 font-bold">{record.amount.toLocaleString()} ج.م</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{record.date}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px]">{record.reason}</td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-[10px]">
                            {record.requestStatus === 'pending' && <span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded w-fit">انتظار المراجعة</span>}
                            {record.reviewedBy && <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit flex items-center gap-1"><UserCheck className="h-3 w-3" /> مراجعة: {record.reviewedBy}</span>}
                            {record.approvedBy && <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded w-fit flex items-center gap-1 font-bold"><ShieldCheck className="h-3 w-3" /> اعتماد: {record.approvedBy}</span>}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {currentUser?.role !== UserRole.EMPLOYEE && activeTab === 'requests' && (
                         <div className="flex justify-center gap-2">
                            {record.requestStatus === 'pending' && (
                                <button onClick={() => handleReview(record.id)} className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded text-xs hover:bg-yellow-100">مراجعة</button>
                            )}
                            {record.requestStatus === 'reviewed' && (
                                <button onClick={() => handleApprove(record.id)} className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs hover:bg-green-100 font-bold">اعتماد</button>
                            )}
                            {(record.requestStatus === 'pending' || record.requestStatus === 'reviewed') && (
                                <button onClick={() => handleReject(record.id)} className="p-1 rounded text-red-500 hover:bg-red-50"><XCircle className="h-4 w-4" /></button>
                            )}
                         </div>
                      )}
                    </td>
                  </tr>
                )) : (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 bg-gray-50"><div className="flex flex-col items-center justify-center gap-2"><FileText className="h-8 w-8 text-gray-300" /><p>لا توجد سجلات</p></div></td></tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Loan Modal */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex justify-between mb-4"><h3 className="text-lg font-bold">طلب سلفة</h3><button onClick={() => setIsLoanModalOpen(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmitLoan} className="space-y-4">
                {currentUser?.role !== UserRole.EMPLOYEE && (
                    <select className="w-full border rounded p-2" value={formData.employeeName} onChange={handleInputChange} name="employeeName">
                        <option value="">اختر الموظف</option>
                        {MOCK_EMPLOYEES.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                )}
                <input type="number" className="w-full border rounded p-2" placeholder="المبلغ" value={formData.amount} onChange={handleInputChange} name="amount" />
                <input type="number" className="w-full border rounded p-2" placeholder="عدد الأقساط" value={formData.installments} onChange={handleInputChange} name="installments" />
                <textarea className="w-full border rounded p-2" placeholder="السبب" value={formData.reason} onChange={handleInputChange} name="reason" />
                <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded">تقديم</button>
                    <button type="button" onClick={() => setIsLoanModalOpen(false)} className="flex-1 border py-2 rounded">إلغاء</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* New Penalty Modal */}
      {isPenaltyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex justify-between mb-4"><h3 className="text-lg font-bold text-red-700">تسجيل جزاء / خصم</h3><button onClick={() => setIsPenaltyModalOpen(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmitPenalty} className="space-y-4">
                <select className="w-full border rounded p-2" value={formData.employeeName} onChange={handleInputChange} name="employeeName">
                    <option value="">اختر الموظف</option>
                    {MOCK_EMPLOYEES.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
                <input type="number" className="w-full border rounded p-2" placeholder="قيمة الخصم" value={formData.amount} onChange={handleInputChange} name="amount" />
                <textarea className="w-full border rounded p-2" placeholder="سبب الجزاء" value={formData.reason} onChange={handleInputChange} name="reason" />
                <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded">تسجيل</button>
                    <button type="button" onClick={() => setIsPenaltyModalOpen(false)} className="flex-1 border py-2 rounded">إلغاء</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;
)

--- START OF FILE src/pages/Login.tsx ---
(
import React, { useState } from 'react';
import { Users, ArrowLeft, CheckCircle, PlayCircle, Lock, User } from 'lucide-react';
import { MOCK_USERS } from '../constants';
import { SystemUser } from '../types';

interface LoginProps {
  onLogin: (user: SystemUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call delay
    setTimeout(() => {
      // 1. Get all users (Default + Created ones stored in LocalStorage)
      const storedUsers = localStorage.getItem('system_users');
      const allUsers: SystemUser[] = storedUsers ? JSON.parse(storedUsers) : MOCK_USERS;

      // 2. Find the user
      const foundUser = allUsers.find(u => 
        u.username.toLowerCase() === username.toLowerCase()
      );

      // 3. Validation (Simple check for demo purposes, in real app check password hash)
      if (foundUser && foundUser.active) {
        // Successful Login with ACTUAL user data (Role & Permissions)
        onLogin(foundUser);
      } else if (foundUser && !foundUser.active) {
        setError('هذا الحساب موقوف، يرجى مراجعة المسؤول.');
        setIsLoading(false);
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white" dir="rtl">
      {/* Right Side - Branding */}
      <div className="md:w-1/2 bg-indigo-600 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
           <Users className="w-96 h-96 absolute -bottom-20 -left-20" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">نـظـام HR</h1>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            بوابة الدخول الموحدة
          </h2>
          <p className="text-indigo-100 text-lg mb-8 leading-relaxed max-w-md">
            نظام سحابي متطور لإدارة الموظفين والرواتب. سجل الدخول لمتابعة أعمالك.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span>نظام آمن ومشفر بالكامل</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span>يدعم تعدد اللغات والفروع</span>
          </div>
        </div>
      </div>

      {/* Left Side - Login Form */}
      <div className="md:w-1/2 p-8 md:p-12 flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900">تسجيل الدخول</h3>
            <p className="text-gray-500 mt-2">مرحباً بك، أدخل بيانات الحساب للمتابعة</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:outline-none transition-all"
                  placeholder="username"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:outline-none transition-all"
                  placeholder="••••••"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded border border-red-100">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>دخول</span>
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-2">للحسابات التجريبية استخدم: admin / 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
)

--- START OF FILE src/pages/OrgChart.tsx ---
(
import React, { useState, useEffect } from 'react';
import { Download, Users, ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react';
import { MOCK_EMPLOYEES } from '../constants';
import { Employee } from '../types';

interface TreeNode {
  employee: Employee;
  children: TreeNode[];
}

const OrgChart: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  // 1. Load Employees
  useEffect(() => {
    const saved = localStorage.getItem('employees_data');
    if (saved) {
        setEmployees(JSON.parse(saved));
    } else {
        setEmployees(MOCK_EMPLOYEES);
    }
  }, []);

  // 2. Build Tree Hierarchy
  useEffect(() => {
    if (employees.length === 0) return;

    const buildTree = (): TreeNode[] => {
        const nodes: Record<string, TreeNode> = {};
        const roots: TreeNode[] = [];

        // Create a node for each employee
        employees.forEach(emp => {
            nodes[emp.id] = { employee: emp, children: [] };
        });

        // Link nodes
        employees.forEach(emp => {
            if (emp.managerId && nodes[emp.managerId]) {
                // If has manager, add to manager's children
                nodes[emp.managerId].children.push(nodes[emp.id]);
            } else {
                // If no manager (or manager not found), it's a root
                roots.push(nodes[emp.id]);
            }
        });

        return roots;
    };

    setTreeData(buildTree());
  }, [employees]);

  // Render a single tree node recursively
  const renderNode = (node: TreeNode) => (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div className="relative flex flex-col items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all w-52 z-10 cursor-pointer group">
        <div className="relative">
            <img 
            src={node.employee.avatar} 
            alt={node.employee.name} 
            className="w-14 h-14 rounded-full object-cover border-4 border-indigo-50 mb-2 group-hover:border-indigo-100 transition-colors"
            />
            {/* Active Status Dot */}
            <div className={`absolute bottom-2 right-0 w-3 h-3 rounded-full border-2 border-white ${node.employee.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        </div>
        <h4 className="font-bold text-gray-800 text-sm text-center truncate w-full" title={node.employee.name}>{node.employee.name}</h4>
        <p className="text-xs text-indigo-600 font-medium truncate w-full text-center">{node.employee.jobTitle}</p>
        <p className="text-[10px] text-gray-400 mt-1">{node.employee.department}</p>
      </div>
      
      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
          {/* Vertical Line Down */}
          <div className="h-8 w-px bg-gray-300"></div>
          
          <div className="flex gap-8 relative">
             {/* Horizontal Connector Line */}
             {node.children.length > 1 && (
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-13rem)] h-px bg-gray-300 hidden md:block"></div>
             )}
             
             {node.children.map((child: TreeNode, index: number) => (
               <div key={child.employee.id} className="flex flex-col items-center relative">
                  {/* Small screen connector fallback */}
                  {index > 0 && index < node.children.length - 1 && <div className="absolute top-0 w-full h-px bg-gray-300 md:hidden"></div>}
                  
                  {/* Vertical Line to Child */}
                  <div className="h-6 w-px bg-gray-300"></div>
                  {renderNode(child)}
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">الهيكل التنظيمي</h2>
           <p className="text-sm text-gray-500 mt-1">
               يتم بناء الهيكل تلقائياً بناءً على "المدير المباشر" في ملف الموظف.
           </p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ZoomOut className="h-5 w-5" /></button>
            <button onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ZoomIn className="h-5 w-5" /></button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2 shadow-sm">
                <Download className="h-4 w-4" />
                <span>تصدير صورة</span>
            </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-50/50 border border-gray-200 rounded-xl p-8 overflow-auto flex justify-center items-start shadow-inner relative">
         {/* Background Grid Pattern */}
         <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

         <div 
            className="min-w-fit pt-8 transition-transform duration-200 origin-top"
            style={{ transform: `scale(${zoomLevel})` }}
         >
            {treeData.length > 0 ? (
                <div className="flex gap-16">
                    {treeData.map(root => (
                        <div key={root.employee.id} className="flex flex-col items-center">
                            {/* If multiple roots, label them */}
                            {treeData.length > 1 && <span className="mb-4 text-xs font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded">مسار مستقل</span>}
                            {renderNode(root)}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Users className="h-12 w-12 mb-4 opacity-50" />
                    <p>لا يوجد موظفين لعرض الهيكل التنظيمي.</p>
                </div>
            )}
         </div>
      </div>
      
      {treeData.length > 1 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm text-sm text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>ملاحظة: يوجد أكثر من رأس للهرم الوظيفي ({treeData.length}). تأكد من تعيين "المدير المباشر" لجميع الموظفين لربطهم في شجرة واحدة.</span>
          </div>
      )}
    </div>
  );
};

export default OrgChart;
)


--- START OF FILE src/pages/Payroll.tsx ---
(
import React, { useState, useEffect, useContext } from 'react';
import { MOCK_PAYROLL, MOCK_EMPLOYEES, DEFAULT_PAYROLL_CONFIG, MOCK_ATTENDANCE } from '../constants';
import { PayrollRecord, Employee, PayrollConfig, AttendanceRecord } from '../types';
import { DollarSign, Printer, Send, Search, Filter, Calendar, ChevronDown, CheckCircle, ShieldCheck, FileCheck, XCircle, Calculator, Settings, DownloadCloud } from 'lucide-react';
import DataControls from '../components/DataControls';
import { AppContext } from '../App';
import { useNavigate } from 'react-router-dom';

const Payroll: React.FC = () => {
  const { currentUser, addNotification } = useContext(AppContext);
  const navigate = useNavigate();

  // Set Default Date to Today's Month/Year
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  const [payroll, setPayroll] = useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem('payroll_data');
    if (saved) return JSON.parse(saved);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_PAYROLL : [];
  });
  
  // Payroll Config
  const [config, setConfig] = useState<PayrollConfig>(() => {
      const saved = localStorage.getItem('payroll_config');
      return saved ? JSON.parse(saved) : DEFAULT_PAYROLL_CONFIG;
  });

  // Global Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Column Filters
  const [colFilters, setColFilters] = useState({
    employeeName: '',
    basic: '',
    net: '',
    status: 'all'
  });
  
  const isAdmin = true;

  // Persist Data
  useEffect(() => {
    localStorage.setItem('payroll_data', JSON.stringify(payroll));
  }, [payroll]);

  const months = [
    { value: 1, label: 'يناير' }, { value: 2, label: 'فبراير' }, { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' }, { value: 5, label: 'مايو' }, { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' }, { value: 8, label: 'أغسطس' }, { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' }, { value: 11, label: 'نوفمبر' }, { value: 12, label: 'ديسمبر' },
  ];

  const years = [2022, 2023, 2024, 2025, 2026];

  const handleImport = (data: any[]) => {
      const newItems = data.map((d, i) => ({ ...MOCK_PAYROLL[0], ...d, id: `IMP-PAY-${i}` }));
      setPayroll(prev => [...prev, ...newItems]);
  };

  // --- SMART PAYROLL CALCULATION ---
  const calculateDeductionsFromAttendance = (employeeCode: string, basicSalary: number): number => {
      // 1. Get Attendance Data
      const savedAttendance = localStorage.getItem('attendance_data');
      const allAttendance: AttendanceRecord[] = savedAttendance ? JSON.parse(savedAttendance) : MOCK_ATTENDANCE;

      // 2. Filter for specific month/year and employee
      const relevantRecords = allAttendance.filter(r => {
          const d = new Date(r.date);
          // Check Month/Year
          const matchDate = (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
          // Check Employee (using code is safer than name)
          const matchEmp = r.employeeCode === employeeCode;
          return matchDate && matchEmp;
      });

      // 3. Logic
      // - Count Absences
      const absentDays = relevantRecords.filter(r => r.status === 'absent').length;
      
      // - Count Late (Assume each late = 0.25 day deduction for MVP)
      const lateCount = relevantRecords.filter(r => r.status === 'late').length;

      // 4. Calculate Financials
      const dailyRate = basicSalary / 30;
      const absenceDeduction = absentDays * dailyRate;
      const lateDeduction = lateCount * (dailyRate * 0.25);

      return Math.round(absenceDeduction + lateDeduction);
  };

  const handleSyncAttendance = () => {
      if (payroll.length === 0) {
          alert('يرجى إنشاء مسير الرواتب أولاً.');
          return;
      }

      if(!window.confirm(`هل تريد تحديث الخصومات بناءً على سجلات الحضور لشهر ${selectedMonth}/${selectedYear}؟\nسيتم استبدال الخصومات اليدوية.`)) return;

      const savedEmps = localStorage.getItem('employees_data');
      const allEmployees: Employee[] = savedEmps ? JSON.parse(savedEmps) : MOCK_EMPLOYEES;

      let updatedCount = 0;

      const updatedPayroll = payroll.map(record => {
          // Find employee to get code
          const emp = allEmployees.find(e => e.name === record.employeeName); // Fallback to name match for MVP
          
          // Check if this record belongs to the selected month
          const d = new Date(record.paymentDate);
          const isTargetMonth = (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;

          if (emp && isTargetMonth && record.status === 'pending') {
              const attendanceDeduction = calculateDeductionsFromAttendance(emp.employeeCode, record.basicSalary);
              
              // Recalculate Fixed Deductions (Tax + Insurance) to preserve them
              const socialInsurance = (record.basicSalary * config.insuranceEmployeePercentage) / 100;
              const taxes = (record.basicSalary * config.taxPercentage) / 100;
              const fixedDeductions = Math.round(socialInsurance + taxes);

              const totalDeductions = fixedDeductions + attendanceDeduction;
              
              updatedCount++;
              
              return {
                  ...record,
                  deductions: totalDeductions,
                  netSalary: Math.round(record.basicSalary + record.allowances + record.incentives - totalDeductions)
              };
          }
          return record;
      });

      setPayroll(updatedPayroll);
      alert(`تم تحديث الخصومات لـ ${updatedCount} سجل بناءً على الغياب والتأخير.`);
  };

  // --- GENERATE PAYROLL (Advanced) ---
  const handleGeneratePayroll = () => {
    const exists = payroll.some(p => {
        const d = new Date(p.paymentDate);
        return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });

    if (exists) {
        if(!window.confirm('يوجد بالفعل مسير رواتب لهذا الشهر. هل تريد إعادة الإنشاء (قد يسبب تكرار)؟')) return;
    }

    const savedEmps = localStorage.getItem('employees_data');
    const allEmployees: Employee[] = savedEmps ? JSON.parse(savedEmps) : MOCK_EMPLOYEES;
    const activeEmployees = allEmployees.filter(e => e.status === 'active');

    if (activeEmployees.length === 0) {
        alert('لا يوجد موظفين نشطين لإنشاء الرواتب لهم.');
        return;
    }

    const newRecords: PayrollRecord[] = activeEmployees.map((emp, i) => {
        // Advanced Calculations based on Config
        const basic = emp.salary;
        
        // 1. Calculate Additions
        // This is simplified. In real app, we might check if employee is eligible for housing/transport
        const housing = (basic * config.housingAllowancePercentage) / 100;
        const transport = (basic * config.transportAllowancePercentage) / 100;
        const allowances = Math.round(housing + transport); 
        const incentives = 0; // Placeholder for now

        // 2. Calculate Deductions (Fixed)
        const socialInsurance = (basic * config.insuranceEmployeePercentage) / 100;
        const taxes = (basic * config.taxPercentage) / 100;
        const deductions = Math.round(socialInsurance + taxes);

        // Attendance deductions are NOT calculated here initially, user must click "Sync"
        // This gives control to HR to review before applying auto-deductions.

        const net = Math.round(basic + allowances + incentives - deductions);

        return {
            id: `PAY-${selectedYear}-${selectedMonth}-${emp.id}`,
            employeeName: emp.name,
            basicSalary: basic,
            allowances: allowances,
            transportAllowance: transport,
            incentives: incentives,
            deductions: deductions,
            netSalary: net,
            paymentDate: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-30`,
            status: 'pending'
        };
    });

    setPayroll(prev => [...prev, ...newRecords]);
    addNotification('إنشاء مسير', `تم إنشاء مسير رواتب شهر ${selectedMonth}/${selectedYear} لـ ${newRecords.length} موظف.`);
  };

  // --- BATCH APPROVAL ---
  const handleApproveAll = () => {
      const recordsToApprove = payroll.filter(p => {
          const d = new Date(p.paymentDate);
          return (d.getMonth() + 1 === selectedMonth) && (d.getFullYear() === selectedYear) && (p.status !== 'paid');
      });

      if (recordsToApprove.length === 0) {
          alert('لا توجد سجلات معلقة لهذا الشهر للاعتماد.');
          return;
      }

      if (window.confirm(`هل أنت متأكد من اعتماد ${recordsToApprove.length} سجل راتب لهذا الشهر؟\nسيتم تحويل الحالة إلى "تم الصرف".`)) {
          const approverName = currentUser?.fullName || 'المدير العام';
          
          setPayroll(prev => prev.map(p => {
              const d = new Date(p.paymentDate);
              if ((d.getMonth() + 1 === selectedMonth) && (d.getFullYear() === selectedYear) && (p.status !== 'paid')) {
                  return { ...p, status: 'paid', approvedBy: approverName };
              }
              return p;
          }));
          
          addNotification('اعتماد جماعي', `تم اعتماد مسير رواتب شهر ${selectedMonth} بالكامل.`);
      }
  };

  // --- WORKFLOW ACTIONS ---

  const handleReview = (recordId: string) => {
      const reviewerName = currentUser?.fullName || 'المراجع';
      if(window.confirm(`هل أنت متأكد من مراجعة هذا الراتب؟\nسيظهر اسمك: ${reviewerName}`)) {
          setPayroll(prev => prev.map(p => p.id === recordId ? { 
              ...p, 
              status: 'reviewed',
              auditedBy: reviewerName 
          } : p));
          addNotification('مراجعة راتب', `قام ${reviewerName} بمراجعة راتب الموظف.`);
      }
  };

  const handleApprove = (recordId: string) => {
      const managerName = currentUser?.fullName || 'المدير';
      if(window.confirm(`هل أنت متأكد من الاعتماد النهائي للصرف؟\nسيظهر اسمك: ${managerName}`)) {
          setPayroll(prev => prev.map(p => p.id === recordId ? { 
              ...p, 
              status: 'paid',
              approvedBy: managerName 
          } : p));
          addNotification('اعتماد راتب', `قام ${managerName} باعتماد صرف راتب.`);
      }
  };

  const handleReject = (recordId: string) => {
      if(window.confirm('هل أنت متأكد من رفض هذا الراتب وإعادته للمراجعة؟')) {
          setPayroll(prev => prev.map(p => p.id === recordId ? { 
              ...p, 
              status: 'pending',
              auditedBy: undefined,
              approvedBy: undefined 
          } : p));
      }
  };

  const handlePrintSlip = (record: PayrollRecord) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const monthName = months.find(m => m.value === selectedMonth)?.label;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>قسيمة راتب - ${record.employeeName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f9f9f9; }
            .slip-container { background: white; padding: 30px; border: 1px solid #ddd; max-width: 700px; margin: 0 auto; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .salary-details { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .salary-details th { text-align: right; padding: 10px; border-bottom: 1px solid #ddd; color: #555; }
            .salary-details td { padding: 10px; border-bottom: 1px solid #eee; }
            .amount { text-align: left; font-family: monospace; font-size: 14px; }
            .total-row { background: #eef2ff; font-weight: bold; font-size: 16px; }
            .approvals { margin-top: 20px; font-size: 12px; color: #555; border: 1px dashed #ccc; padding: 15px; display: flex; justify-content: space-between; }
            .stamp { border: 2px solid #4f46e5; color: #4f46e5; padding: 5px 15px; border-radius: 4px; transform: rotate(-5deg); display: inline-block; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="slip-container">
            <div class="header">
              <h2>شركة النور للتجارة</h2>
              <p>قسيمة راتب شهر ${monthName} ${selectedYear}</p>
            </div>
            <div style="margin-bottom: 20px">
               <strong>الموظف:</strong> ${record.employeeName}
            </div>
            <table class="salary-details">
              <tr><th>البند</th><th style="text-align:left">القيمة</th></tr>
              <tr><td>الراتب الأساسي</td><td class="amount">${record.basicSalary.toLocaleString()} ج.م</td></tr>
              <tr><td>بدلات</td><td class="amount text-green-600">+ ${record.allowances.toLocaleString()} ج.م</td></tr>
              <tr><td>حوافز</td><td class="amount text-green-600">+ ${record.incentives.toLocaleString()} ج.م</td></tr>
              <tr><td>خصومات</td><td class="amount" style="color: #ef4444">- ${record.deductions.toLocaleString()} ج.م</td></tr>
              <tr class="total-row"><td>صافي الراتب</td><td class="amount">${record.netSalary.toLocaleString()} ج.م</td></tr>
            </table>
            
            <div class="approvals">
               <div><p>تمت المراجعة بواسطة:</p><strong>${record.auditedBy || '_________________'}</strong></div>
               <div><p>اعتماد المدير المالي:</p><strong>${record.approvedBy || '_________________'}</strong></div>
               ${record.status === 'paid' ? '<div class="stamp">تم الصرف</div>' : ''}
            </div>
          </div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredPayroll = payroll.filter(p => {
    const recordDate = new Date(p.paymentDate);
    const matchesDate = (recordDate.getMonth() + 1) === Number(selectedMonth) && 
                        recordDate.getFullYear() === Number(selectedYear);
    
    // Global Search
    const matchesSearch = p.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Column Filters
    const matchesName = p.employeeName.toLowerCase().includes(colFilters.employeeName.toLowerCase());
    const matchesBasic = colFilters.basic ? p.basicSalary.toString().includes(colFilters.basic) : true;
    const matchesNet = colFilters.net ? p.netSalary.toString().includes(colFilters.net) : true;
    
    // Status Logic
    const matchesStatus = colFilters.status === 'all' || p.status === colFilters.status;
    
    return matchesDate && matchesSearch && matchesName && matchesBasic && matchesNet && matchesStatus;
  });

  const totalSalaries = filteredPayroll.reduce((acc, curr) => acc + curr.netSalary, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div><h2 className="text-2xl font-bold text-gray-800">مسيرات الرواتب</h2><p className="text-sm text-gray-500 mt-1">إعداد واعتماد رواتب الموظفين الشهرية</p></div>
        <div className="flex gap-3">
          <DataControls data={filteredPayroll} fileName={`payroll_${selectedYear}_${selectedMonth}`} isAdmin={isAdmin} onImport={handleImport} />
          
          <button 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 rounded-lg bg-gray-100 border border-gray-300 px-3 py-2.5 text-gray-700 hover:bg-gray-200 transition"
            title="إعدادات الضرائب والتأمينات"
          >
            <Settings className="h-5 w-5" />
          </button>

          <button 
            onClick={handleApproveAll}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-white shadow-md hover:bg-green-700 transition-all hover:shadow-lg active:scale-95"
          >
            <Send className="h-5 w-5" />
            <span>اعتماد الكل</span>
          </button>

          <button 
            onClick={handleGeneratePayroll}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-md hover:bg-indigo-700 transition-all hover:shadow-lg active:scale-95"
          >
            <Calculator className="h-5 w-5" />
            <span>إنشاء المسير</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-3 text-gray-700 font-medium whitespace-nowrap">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><Calendar className="h-6 w-6" /></div><span>تحديد الفترة:</span>
          </div>
          <div className="flex flex-1 gap-4 w-full">
            <div className="relative flex-1">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 pr-8 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer transition-all">
                {months.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative flex-1">
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 pr-8 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer transition-all">
                {years.map(y => (<option key={y} value={y}>{y}</option>))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 text-white shadow-lg flex items-center justify-between relative overflow-hidden">
           <div className="relative z-10"><p className="text-indigo-100 text-sm mb-1 font-medium">إجمالي الرواتب</p><h3 className="text-4xl font-bold tracking-tight">{totalSalaries.toLocaleString()} <span className="text-xl font-normal opacity-80">ج.م</span></h3></div>
           <div className="bg-white/20 p-3 rounded-xl relative z-10 backdrop-blur-sm"><DollarSign className="h-8 w-8 text-white" /></div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center bg-gray-50/50 justify-between">
          <div className="relative w-full sm:w-80"><Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="بحث باسم الموظف..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-4 focus:border-indigo-500 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          
          {/* SYNC ATTENDANCE BUTTON */}
          <button 
            onClick={handleSyncAttendance}
            className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2.5 rounded-lg hover:bg-orange-100 transition shadow-sm font-medium"
            title="حساب الخصومات من الغياب والتأخير"
          >
            <DownloadCloud className="h-5 w-5" />
            استيراد خصومات الحضور
          </button>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">الموظف</th>
                <th className="px-6 py-4 font-semibold">الأساسي</th>
                <th className="px-6 py-4 font-semibold text-green-600">بدلات</th>
                <th className="px-6 py-4 font-semibold text-green-600">حوافز</th>
                <th className="px-6 py-4 font-semibold text-red-600">خصومات</th>
                <th className="px-6 py-4 font-semibold">الصافي</th>
                <th className="px-6 py-4 font-semibold text-center">دورة الاعتماد</th>
                <th className="px-6 py-4 font-semibold text-center">أدوات</th>
              </tr>
              {/* Added Filter Row Here */}
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-2">
                    <input 
                        type="text" 
                        placeholder="اسم الموظف..." 
                        className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                        value={colFilters.employeeName}
                        onChange={(e) => setColFilters({...colFilters, employeeName: e.target.value})}
                    />
                </th>
                <th className="px-6 py-2">
                    <input 
                        type="text" 
                        placeholder="الأساسي..." 
                        className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                        value={colFilters.basic}
                        onChange={(e) => setColFilters({...colFilters, basic: e.target.value})}
                    />
                </th>
                <th className="px-6 py-2 bg-gray-100"></th>
                <th className="px-6 py-2 bg-gray-100"></th>
                <th className="px-6 py-2 bg-gray-100"></th>
                <th className="px-6 py-2">
                    <input 
                        type="text" 
                        placeholder="الصافي..." 
                        className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                        value={colFilters.net}
                        onChange={(e) => setColFilters({...colFilters, net: e.target.value})}
                    />
                </th>
                <th className="px-6 py-2">
                    <select 
                        className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                        value={colFilters.status}
                        onChange={(e) => setColFilters({...colFilters, status: e.target.value})}
                    >
                        <option value="all">الكل</option>
                        <option value="pending">معلق</option>
                        <option value="reviewed">تمت المراجعة</option>
                        <option value="paid">تم الصرف</option>
                    </select>
                </th>
                <th className="px-6 py-2 bg-gray-100"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayroll.length > 0 ? (
                filteredPayroll.map((record) => (
                  <tr key={record.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{record.employeeName}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{record.basicSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-green-600 font-mono">+{record.allowances.toLocaleString()}</td>
                    <td className="px-6 py-4 text-green-600 font-mono">+{record.incentives.toLocaleString()}</td>
                    <td className="px-6 py-4 text-red-600 font-mono">-{record.deductions.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 font-mono bg-gray-50/50">{record.netSalary.toLocaleString()} ج.م</td>
                    
                    {/* APPROVAL WORKFLOW COLUMN */}
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-2 items-center w-full">
                            {/* Step 1: Review */}
                            {record.status === 'pending' && (
                                <button onClick={() => handleReview(record.id)} className="w-full bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded text-xs hover:bg-yellow-100 transition flex items-center justify-center gap-1">
                                    <FileCheck className="h-3 w-3" /> مراجعة
                                </button>
                            )}
                            
                            {/* Step 2: Approve (After Review) */}
                            {record.status === 'reviewed' && (
                                <div className="w-full">
                                    <div className="text-[10px] text-gray-500 mb-1 flex items-center justify-center gap-1">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        <span>تمت المراجعة: {record.auditedBy}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleApprove(record.id)} className="flex-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1.5 rounded text-xs hover:bg-indigo-100 transition font-bold">
                                            اعتماد
                                        </button>
                                        <button onClick={() => handleReject(record.id)} className="px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100" title="رفض">
                                            <XCircle className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Final: Paid */}
                            {record.status === 'paid' && (
                                <div className="text-center w-full">
                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold border border-green-200 w-full justify-center">
                                        <ShieldCheck className="h-3 w-3" /> معتمد نهائي
                                    </span>
                                    <div className="text-[10px] text-gray-400 mt-1">بواسطة: {record.approvedBy}</div>
                                </div>
                            )}
                        </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                       <button onClick={() => handlePrintSlip(record)} className="text-gray-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-all" title="طباعة الإيصال">
                          <Printer className="h-4 w-4" />
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={8} className="px-6 py-12 text-center bg-gray-50">
                        <div className="flex flex-col items-center gap-3">
                            <DollarSign className="h-10 w-10 text-gray-300" />
                            <p className="text-gray-500 font-medium">لا توجد سجلات رواتب لشهر {selectedMonth}/{selectedYear}</p>
                            <button 
                                onClick={handleGeneratePayroll}
                                className="text-indigo-600 text-sm hover:underline font-bold"
                            >
                                اضغط هنا لإنشاء مسير الرواتب الآن
                            </button>
                        </div>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
)



--- START OF FILE src/pages/Performance.tsx ---
(
import React, { useState, useEffect, useContext } from 'react';
import { MOCK_PERFORMANCE_REVIEWS, MOCK_EMPLOYEES } from '../constants';
import { PerformanceReview, KPI, Employee, UserRole } from '../types';
import { TrendingUp, Plus, Search, Star, Award, Trash2, Edit, Save, X, CheckCircle, BarChart3 } from 'lucide-react';
import DataControls from '../components/DataControls';
import { AppContext } from '../App';

const Performance: React.FC = () => {
  const { currentUser, addNotification } = useContext(AppContext);
  const [reviews, setReviews] = useState<PerformanceReview[]>(() => {
    const saved = localStorage.getItem('performance_data');
    return saved ? JSON.parse(saved) : MOCK_PERFORMANCE_REVIEWS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('employees_data');
    return saved ? JSON.parse(saved) : MOCK_EMPLOYEES;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentReview, setCurrentReview] = useState<Partial<PerformanceReview>>({
    kpis: []
  });

  useEffect(() => {
    localStorage.setItem('performance_data', JSON.stringify(reviews));
  }, [reviews]);

  const handleOpenModal = (review?: PerformanceReview) => {
    if (review) {
      setCurrentReview(review);
    } else {
      setCurrentReview({
        id: `PR-${Date.now()}`,
        period: `Q${Math.floor((new Date().getMonth() + 3) / 3)} ${new Date().getFullYear()}`,
        kpis: [
            { id: `K-${Date.now()}-1`, name: 'جودة العمل', targetValue: 100, actualValue: 0, weight: 40, score: 0, unit: '%' },
            { id: `K-${Date.now()}-2`, name: 'الانضباط والالتزام', targetValue: 10, actualValue: 0, weight: 30, score: 0, unit: 'Rating' },
            { id: `K-${Date.now()}-3`, name: 'العمل الجماعي', targetValue: 10, actualValue: 0, weight: 30, score: 0, unit: 'Rating' }
        ],
        status: 'draft',
        totalScore: 0,
        evaluationDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleUpdateKPI = (kpiId: string, field: keyof KPI, value: any) => {
    const updatedKPIs = currentReview.kpis?.map(k => {
      if (k.id === kpiId) {
        const updated = { ...k, [field]: value };
        // Recalculate score: (Actual / Target) * Weight
        if (field === 'actualValue' || field === 'targetValue' || field === 'weight') {
            const actual = field === 'actualValue' ? Number(value) : k.actualValue;
            const target = field === 'targetValue' ? Number(value) : k.targetValue;
            const weight = field === 'weight' ? Number(value) : k.weight;
            updated.score = target > 0 ? Math.min((actual / target) * weight, weight) : 0;
        }
        return updated;
      }
      return k;
    });

    const total = updatedKPIs?.reduce((acc, curr) => acc + curr.score, 0) || 0;
    setCurrentReview(prev => ({ ...prev, kpis: updatedKPIs, totalScore: Math.round(total) }));
  };

  const handleSaveReview = () => {
    if (!currentReview.employeeId) {
        alert('الرجاء اختيار موظف');
        return;
    }
    
    // Find employee name if not set
    const empName = employees.find(e => e.id === currentReview.employeeId)?.name;
    const finalReview = { ...currentReview, employeeName: empName || '' } as PerformanceReview;

    if (reviews.find(r => r.id === finalReview.id)) {
        setReviews(prev => prev.map(r => r.id === finalReview.id ? finalReview : r));
    } else {
        setReviews(prev => [...prev, finalReview]);
    }
    
    setIsModalOpen(false);
    addNotification('تقييم أداء', `تم حفظ تقييم الأداء للموظف ${finalReview.employeeName}`);
  };

  const handleDelete = (id: string) => {
      if(window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) {
          setReviews(prev => prev.filter(r => r.id !== id));
      }
  };

  const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-600 bg-green-50';
      if (score >= 75) return 'text-indigo-600 bg-indigo-50';
      if (score >= 50) return 'text-yellow-600 bg-yellow-50';
      return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة الأداء والتقييم</h2>
          <p className="text-sm text-gray-500 mt-1">متابعة مؤشرات الأداء (KPIs) وتقييم الموظفين</p>
        </div>
        <div className="flex gap-3">
          <DataControls data={reviews} fileName="performance_reviews" isAdmin={true} />
          {currentUser?.role !== UserRole.EMPLOYEE && (
            <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-md hover:bg-indigo-700 transition-all hover:shadow-lg active:scale-95"
            >
                <Plus className="h-5 w-5" />
                <span>تقييم جديد</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm">متوسط أداء الشركة</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">
                      {reviews.length > 0 ? Math.round(reviews.reduce((a,b) => a + b.totalScore, 0) / reviews.length) : 0}%
                  </h3>
              </div>
              <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                  <BarChart3 className="h-8 w-8" />
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm">أعلى تقييم (هذا الربع)</p>
                  <h3 className="text-3xl font-bold text-green-600 mt-2">
                      {reviews.length > 0 ? Math.max(...reviews.map(r => r.totalScore)) : 0}%
                  </h3>
              </div>
              <div className="bg-green-50 p-3 rounded-full text-green-600">
                  <Award className="h-8 w-8" />
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-sm">إجمالي التقييمات</p>
                  <h3 className="text-3xl font-bold text-indigo-600 mt-2">{reviews.length}</h3>
              </div>
              <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
                  <Star className="h-8 w-8" />
              </div>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative w-full max-w-md">
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="بحث باسم الموظف..." 
                    className="w-full rounded-lg border border-gray-200 py-2.5 pr-10 pl-4 focus:border-indigo-500 focus:outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
         </div>
         <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                    <th className="px-6 py-4">الموظف</th>
                    <th className="px-6 py-4">الفترة</th>
                    <th className="px-6 py-4">تاريخ التقييم</th>
                    <th className="px-6 py-4">النتيجة النهائية</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4">إجراءات</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {reviews.filter(r => r.employeeName.toLowerCase().includes(searchTerm.toLowerCase())).map(review => (
                    <tr key={review.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium">{review.employeeName}</td>
                        <td className="px-6 py-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{review.period}</span></td>
                        <td className="px-6 py-4 font-mono text-gray-500">{review.evaluationDate}</td>
                        <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full font-bold text-xs ${getScoreColor(review.totalScore)}`}>
                                {review.totalScore}%
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            {review.status === 'approved' 
                                ? <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> معتمد</span>
                                : <span className="text-yellow-600 flex items-center gap-1"> مسودة</span>}
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                            <button onClick={() => handleOpenModal(review)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => handleDelete(review.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 className="h-4 w-4" /></button>
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100">
                      <h3 className="text-xl font-bold text-gray-800">تقييم أداء موظف</h3>
                      <button onClick={() => setIsModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                              <label className="block text-sm font-medium mb-1">الموظف</label>
                              <select 
                                className="w-full border rounded p-2"
                                value={currentReview.employeeId || ''}
                                onChange={e => setCurrentReview({...currentReview, employeeId: e.target.value})}
                                disabled={!!currentReview.id && reviews.some(r => r.id === currentReview.id)}
                              >
                                  <option value="">اختر موظف...</option>
                                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1">فترة التقييم</label>
                              <input 
                                type="text" 
                                className="w-full border rounded p-2" 
                                value={currentReview.period}
                                onChange={e => setCurrentReview({...currentReview, period: e.target.value})}
                              />
                          </div>
                      </div>

                      <div className="mb-4">
                          <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">مؤشرات الأداء (KPIs)</h4>
                          <table className="w-full text-sm text-right">
                              <thead className="bg-gray-50 text-gray-500">
                                  <tr>
                                      <th className="p-2">المؤشر</th>
                                      <th className="p-2 w-20">المستهدف</th>
                                      <th className="p-2 w-20">الفعلي</th>
                                      <th className="p-2 w-20">الوزن %</th>
                                      <th className="p-2 w-20">الدرجة</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {currentReview.kpis?.map((kpi, idx) => (
                                      <tr key={idx} className="border-b">
                                          <td className="p-2">
                                              <input className="w-full border-none bg-transparent focus:ring-0" value={kpi.name} onChange={e => handleUpdateKPI(kpi.id, 'name', e.target.value)} />
                                          </td>
                                          <td className="p-2">
                                              <input type="number" className="w-full border rounded p-1 text-center" value={kpi.targetValue} onChange={e => handleUpdateKPI(kpi.id, 'targetValue', e.target.value)} />
                                          </td>
                                          <td className="p-2">
                                              <input type="number" className="w-full border rounded p-1 text-center bg-indigo-50" value={kpi.actualValue} onChange={e => handleUpdateKPI(kpi.id, 'actualValue', e.target.value)} />
                                          </td>
                                          <td className="p-2">
                                              <input type="number" className="w-full border rounded p-1 text-center" value={kpi.weight} onChange={e => handleUpdateKPI(kpi.id, 'weight', e.target.value)} />
                                          </td>
                                          <td className="p-2 text-center font-bold text-indigo-700">{kpi.score.toFixed(1)}</td>
                                      </tr>
                                  ))}
                              </tbody>
                              <tfoot className="bg-gray-50 font-bold">
                                  <tr>
                                      <td colSpan={4} className="p-2 text-left">النتيجة النهائية</td>
                                      <td className="p-2 text-center text-lg">{currentReview.totalScore}</td>
                                  </tr>
                              </tfoot>
                          </table>
                      </div>

                      <div>
                          <label className="block text-sm font-medium mb-1">ملاحظات عامة</label>
                          <textarea 
                            className="w-full border rounded p-2" 
                            rows={3}
                            value={currentReview.feedback || ''}
                            onChange={e => setCurrentReview({...currentReview, feedback: e.target.value})}
                          ></textarea>
                      </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded bg-white hover:bg-gray-50">إلغاء</button>
                      <button onClick={handleSaveReview} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2">
                          <Save className="h-4 w-4" /> حفظ التقييم
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Performance;
)


--- START OF FILE src/pages/Recruitment.tsx ---
(
import React, { useState, useEffect } from 'react';
import { MOCK_CANDIDATES } from '../constants';
import { ApplicationStatus, Candidate } from '../types';
import { MoreHorizontal, Plus, Star, X, Trash2 } from 'lucide-react';
import DataControls from '../components/DataControls';

const Recruitment: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('recruitment_candidates');
    if (saved) return JSON.parse(saved);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_CANDIDATES : [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  // Simulated Admin Status
  const isAdmin = true;
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    experience: '',
    status: ApplicationStatus.APPLIED,
  });

  // Persist Changes
  useEffect(() => {
    localStorage.setItem('recruitment_candidates', JSON.stringify(candidates));
  }, [candidates]);

  const columns = [
    { title: 'جديد', status: ApplicationStatus.APPLIED, color: 'border-blue-500' },
    { title: 'فرز أولي', status: ApplicationStatus.SCREENING, color: 'border-purple-500' },
    { title: 'مقابلات', status: ApplicationStatus.INTERVIEW, color: 'border-yellow-500' },
    { title: 'عروض عمل', status: ApplicationStatus.OFFER, color: 'border-green-500' },
  ];

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: ApplicationStatus) => {
    e.preventDefault();
    if (!draggedId) return;

    setCandidates((prev) =>
      prev.map((c) => (c.id === draggedId ? { ...c, status: newStatus } : c))
    );
    setDraggedId(null);
  };

  // Delete Candidate
  const handleDeleteCandidate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا المرشح؟')) {
      setCandidates(candidates.filter(c => c.id !== id));
    }
  };

  // Form Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCandidate: Candidate = {
      id: `C${Date.now()}`,
      name: formData.name,
      position: formData.position,
      experience: formData.experience,
      status: formData.status as ApplicationStatus,
      rating: 0,
    };
    setCandidates([...candidates, newCandidate]);
    setIsModalOpen(false);
    setFormData({ name: '', position: '', experience: '', status: ApplicationStatus.APPLIED }); // Reset form
  };

  const handleImport = (data: any[]) => {
    const newCandidates = data.map((d: any, idx) => ({
      ...d,
      id: `IMP-C${Date.now()}-${idx}`,
      status: d.status || ApplicationStatus.APPLIED,
      rating: Number(d.rating) || 0
    }));
    setCandidates([...candidates, ...newCandidates]);
  };

  return (
    <div className="h-[calc(100vh-8rem)] relative">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">التوظيف</h2>
          <p className="text-sm text-gray-500">تتبع المرشحين ومراحل التعيين (اسحب وأفلت لتغيير الحالة)</p>
        </div>
        <div className="flex gap-3">
          <DataControls
            data={candidates}
            fileName="recruitment_candidates"
            onImport={handleImport}
            isAdmin={isAdmin}
            headers={[
              { key: 'name', label: 'الاسم' },
              { key: 'position', label: 'الوظيفة' },
              { key: 'experience', label: 'الخبرة' },
              { key: 'status', label: 'الحالة' },
              { key: 'rating', label: 'التقييم' }
            ]}
          />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">إضافة مرشح</span>
          </button>
        </div>
      </div>

      <div className="flex h-full gap-6 overflow-x-auto pb-4">
        {columns.map((col) => {
          const items = candidates.filter((c) => c.status === col.status);
          
          return (
            <div 
              key={col.title} 
              className="flex h-full min-w-[300px] flex-col rounded-xl bg-gray-50 border border-gray-200 transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div className={`border-t-4 bg-white p-4 rounded-t-xl ${col.color} border-b border-gray-100`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">{col.title}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {items.length}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {items.map((candidate) => (
                  <div 
                    key={candidate.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, candidate.id)}
                    className="group relative rounded-lg bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md cursor-grab active:cursor-grabbing transition-all active:scale-95"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800">{candidate.name}</h4>
                      <button 
                        onClick={(e) => handleDeleteCandidate(candidate.id, e)}
                        className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{candidate.position}</p>
                    
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{candidate.experience}</span>
                      {candidate.rating > 0 && (
                        <div className="flex items-center gap-1 text-yellow-500">
                          <span className="text-xs font-medium text-gray-600">{candidate.rating}</span>
                          <Star className="h-3 w-3 fill-current" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {items.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
                    اسحب هنا
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Candidate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800">إضافة مرشح جديد</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">الاسم</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="اسم المرشح"
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">الوظيفة</label>
                  <input
                    type="text"
                    name="position"
                    required
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="المسمى الوظيفي"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">الخبرة</label>
                    <input
                      type="text"
                      name="experience"
                      required
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="مثال: 3 سنوات"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">الحالة الأولية</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {(Object.values(ApplicationStatus) as string[]).map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recruitment;
)




--- START OF FILE src/pages/Reports.tsx ---
(
import React from 'react';
import { FileBarChart, Users, Clock, DollarSign, PieChart, Briefcase, Download, ArrowLeft, FileSpreadsheet } from 'lucide-react';

const Reports: React.FC = () => {
  // Helper to load data
  const loadData = (key: string) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  };

  const generateCSV = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
      alert('لا توجد بيانات متاحة لتصدير هذا التقرير.');
      return;
    }
    
    // Get headers
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const val = row[header] ? String(row[header]).replace(/"/g, '""') : '';
          return `"${val}"`;
        }).join(',')
      )
    ];
    
    const csvString = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadReport = (reportId: number) => {
    switch (reportId) {
      case 1: // Attendance
        const attendance = loadData('attendance_data');
        generateCSV(attendance, 'Attendance_Report');
        break;
      case 2: // Payroll
        const payroll = loadData('payroll_data');
        generateCSV(payroll, 'Payroll_Report');
        break;
      case 3: // Employees
        const employees = loadData('employees_data');
        generateCSV(employees, 'Employees_Master_List');
        break;
      case 4: // Recruitment
        const candidates = loadData('recruitment_candidates');
        generateCSV(candidates, 'Recruitment_Report');
        break;
      case 5: // Leaves
        const leaves = loadData('leaves_data');
        generateCSV(leaves, 'Leaves_Report');
        break;
      case 6: // Contracts (Simulating "End of Service" by filtering expiring contracts)
        const allEmps = loadData('employees_data');
        // Filter mock logic for end of service (if they have an end date)
        const endOfService = allEmps.filter((e: any) => e.endOfServiceDate).map((e: any) => ({
            Name: e.name,
            JoinDate: e.joinDate,
            EndOfService: e.endOfServiceDate,
            Status: e.status
        }));
        generateCSV(endOfService, 'End_Of_Service_Report');
        break;
      default:
        alert('التقرير قيد التطوير');
    }
  };

  const reports = [
    { id: 1, title: 'تقرير الحضور والغياب', desc: 'تفاصيل الحضور، التأخير، والغياب الشهري (بيانات فعلية)', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 2, title: 'كشف الرواتب الشهري', desc: 'ملخص الرواتب، البدلات، والخصومات (بيانات فعلية)', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 3, title: 'تقرير بيانات الموظفين', desc: 'قائمة شاملة ببيانات الموظفين وتواريخ التعيين', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 4, title: 'حركة التوظيف', desc: 'إحصائيات المتقدمين، المقابلات، والتعيينات', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 5, title: 'رصيد الإجازات والطلبات', desc: 'سجل طلبات الإجازات وحالاتها', icon: PieChart, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 6, title: 'نهاية الخدمة', desc: 'تقرير الموظفين وتواريخ نهاية الخدمة', icon: FileBarChart, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">التقارير والإحصائيات</h2>
        <p className="text-sm text-gray-500 mt-1">استخراج تقارير تفصيلية عن أداء المنشأة والموظفين (Excel / CSV)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div 
            key={report.id} 
            onClick={() => handleDownloadReport(report.id)}
            className="group relative bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
               <div className={`w-14 h-14 ${report.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                 <report.icon className={`h-7 w-7 ${report.color}`} />
               </div>
               <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                 <div className="bg-gray-50 p-2 rounded-full">
                    <Download className="h-5 w-5 text-gray-600" />
                 </div>
               </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-indigo-700 transition-colors">{report.title}</h3>
            <p className="text-sm text-gray-500 mb-6 min-h-[40px] leading-relaxed">{report.desc}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
               <span className="text-xs font-medium text-gray-400 group-hover:text-indigo-500 transition-colors flex items-center gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  Excel / CSV
               </span>
               <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium opacity-80 group-hover:opacity-100">
                  <span>تحميل</span>
                  <ArrowLeft className="h-4 w-4" />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
)




--- START OF FILE src/pages/Settings.tsx ---
(
import React, { useState, useEffect, useRef, useContext } from 'react';
import { MOCK_USERS, MOCK_DATABASES, MOCK_EMPLOYEES, DEFAULT_ROLES, DEPARTMENTS as DEFAULT_DEPTS, DEFAULT_PAYROLL_CONFIG } from '../constants';
import { SystemUser, SystemDatabase, UserRole, Employee, RoleDefinition, PayrollConfig } from '../types';
import { getDeviceId, validateLicenseKey } from '../utils/security';
import { 
  Users, Database, Lock, Plus, Trash2, CheckCircle, XCircle, Search, Key, Shield, Save, Server, CreditCard, RotateCcw, Copy, HardDrive, Download, Upload, FileJson, AlertTriangle, Building2, Image as ImageIcon, CheckSquare, Square, Edit, Star, Wifi, Power, Loader, UserCheck, Briefcase, Network, DollarSign
} from 'lucide-react';
import { AppContext } from '../App';

interface SettingsProps {
  onSubscriptionChange?: () => void;
  isExpired?: boolean;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'employees', label: 'إدارة الموظفين' },
  { id: 'org-chart', label: 'الهيكل التنظيمي' },
  { id: 'shifts', label: 'إدارة الورديات' },
  { id: 'recruitment', label: 'التوظيف' },
  { id: 'transport', label: 'إدارة النقل' },
  { id: 'performance', label: 'إدارة الأداء' },
  { id: 'contracts', label: 'العقود' },
  { id: 'insurance', label: 'التأمينات' },
  { id: 'attendance', label: 'الحضور والانصراف' },
  { id: 'leaves', label: 'الإجازات' },
  { id: 'payroll', label: 'الرواتب' },
  { id: 'loans', label: 'السلف والخصومات' },
  { id: 'reports', label: 'التقارير' },
  { id: 'settings', label: 'الإعدادات' },
];

const DATA_KEYS = ['employees_data', 'attendance_data', 'contracts_data', 'insurance_data', 'leaves_data', 'leaves_balances', 'payroll_data', 'loans_data', 'biometric_devices', 'transport_vehicles', 'transport_drivers', 'transport_trips', 'transport_maintenance', 'recruitment_candidates', 'shifts_data', 'system_departments', 'performance_data'];

const Settings: React.FC<SettingsProps> = ({ onSubscriptionChange, isExpired }) => {
  const { t } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState<'general' | 'departments' | 'users' | 'roles' | 'payroll' | 'databases' | 'security' | 'subscription' | 'backup'>('general');
  const [users, setUsers] = useState<SystemUser[]>(MOCK_USERS);
  const [employeesList, setEmployeesList] = useState<Employee[]>(MOCK_EMPLOYEES);
  
  // Departments State
  const [departments, setDepartments] = useState<string[]>(() => {
      const saved = localStorage.getItem('system_departments');
      return saved ? JSON.parse(saved) : DEFAULT_DEPTS;
  });
  const [newDept, setNewDept] = useState('');

  // Roles State
  const [roles, setRoles] = useState<RoleDefinition[]>(() => {
      const savedRoles = localStorage.getItem('system_roles');
      return savedRoles ? JSON.parse(savedRoles) : DEFAULT_ROLES;
  });

  // Payroll Config State
  const [payrollConfig, setPayrollConfig] = useState<PayrollConfig>(() => {
      const saved = localStorage.getItem('payroll_config');
      return saved ? JSON.parse(saved) : DEFAULT_PAYROLL_CONFIG;
  });

  const [databases, setDatabases] = useState<SystemDatabase[]>(() => {
    const saved = localStorage.getItem('system_databases');
    return saved ? JSON.parse(saved) : MOCK_DATABASES;
  });
  const [activeDatabaseId, setActiveDatabaseId] = useState<string>(() => {
    return localStorage.getItem('active_db_id') || 'DB1';
  });
  const [editingDbId, setEditingDbId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState({ name: 'اسم الشركة', address: '', phone: '', email: '', website: '', taxNumber: '', logo: '' });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [backupName, setBackupName] = useState(`Nizam_Backup_${new Date().toISOString().split('T')[0]}`);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDBModalOpen, setIsDBModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); 
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  
  // Forms
  const [userForm, setUserForm] = useState({ id: '', username: '', fullName: '', email: '', role: UserRole.EMPLOYEE as string, password: '', permissions: [] as string[], linkedEmployeeId: '' });
  const [roleForm, setRoleForm] = useState<Partial<RoleDefinition>>({ name: '', permissions: [] });
  const [dbForm, setDbForm] = useState({ name: '', companyName: '' });
  const [adminPasswordForm, setAdminPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [userPasswordForm, setUserPasswordForm] = useState('');

  // Enforce Subscription Tab if Expired
  useEffect(() => {
      if (isExpired) {
          setActiveTab('subscription');
      }
  }, [isExpired]);

  useEffect(() => { localStorage.setItem('system_databases', JSON.stringify(databases)); }, [databases]);
  useEffect(() => { localStorage.setItem('system_roles', JSON.stringify(roles)); }, [roles]);
  useEffect(() => { localStorage.setItem('system_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('payroll_config', JSON.stringify(payrollConfig)); }, [payrollConfig]);

  useEffect(() => {
    const savedCompany = localStorage.getItem('company_settings');
    if (savedCompany) setCompanyForm(JSON.parse(savedCompany));
    const storedUsers = localStorage.getItem('system_users');
    if (storedUsers) setUsers(JSON.parse(storedUsers));
    const storedEmployees = localStorage.getItem('employees_data');
    if (storedEmployees) setEmployeesList(JSON.parse(storedEmployees));
    const currentDeviceId = getDeviceId();
    setDeviceId(currentDeviceId);
    const storedKey = localStorage.getItem('licenseKey');
    if (storedKey) {
        const validation = validateLicenseKey(storedKey, currentDeviceId);
        if (validation.isValid) {
            setIsPaid(true);
            setExpiryDate(validation.expiryDate || 'Unknown');
        } else {
            setIsPaid(false);
        }
    }
  }, []);

  const handleCompanySave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('company_settings', JSON.stringify(companyForm));
    alert('تم حفظ بيانات الشركة بنجاح');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setCompanyForm(prev => ({ ...prev, logo: reader.result as string })); };
      reader.readAsDataURL(file);
    }
  };

  const handlePayrollConfigSave = (e: React.FormEvent) => {
      e.preventDefault();
      localStorage.setItem('payroll_config', JSON.stringify(payrollConfig));
      alert('تم حفظ إعدادات الرواتب بنجاح');
  };

  // Departments Handlers
  const handleAddDepartment = (e: React.FormEvent) => {
      e.preventDefault();
      if (newDept && !departments.includes(newDept)) {
          setDepartments([...departments, newDept]);
          setNewDept('');
      } else {
          alert('القسم موجود بالفعل أو الحقل فارغ');
      }
  };

  const handleDeleteDepartment = (dept: string) => {
      if (window.confirm(`هل أنت متأكد من حذف قسم "${dept}"؟`)) {
          setDepartments(departments.filter(d => d !== dept));
      }
  };

  // User Handlers
  const handleOpenUserModal = (user?: SystemUser) => {
    if (user) {
      setUserForm({
        id: user.id, username: user.username, fullName: user.fullName, email: user.email, role: user.role, password: '', permissions: user.permissions || [], linkedEmployeeId: user.linkedEmployeeId || ''
      });
    } else {
      setUserForm({ id: '', username: '', fullName: '', email: '', role: UserRole.EMPLOYEE, password: '', permissions: [], linkedEmployeeId: '' });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (userForm.id) {
      const updatedUsers = users.map(u => u.id === userForm.id ? { ...u, username: userForm.username, fullName: userForm.fullName, email: userForm.email, role: userForm.role, permissions: userForm.permissions, linkedEmployeeId: userForm.linkedEmployeeId } : u);
      setUsers(updatedUsers);
      localStorage.setItem('system_users', JSON.stringify(updatedUsers));
    } else {
      const newUser: SystemUser = { id: `U${Date.now()}`, username: userForm.username, fullName: userForm.fullName, email: userForm.email, role: userForm.role, active: true, lastLogin: '-', permissions: userForm.permissions, linkedEmployeeId: userForm.linkedEmployeeId };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('system_users', JSON.stringify(updatedUsers));
    }
    setIsUserModalOpen(false);
  };

  // Role Handlers
  const handleOpenRoleModal = (role?: RoleDefinition) => {
      if (role) {
          setRoleForm(role);
      } else {
          setRoleForm({ id: '', name: '', permissions: [] });
      }
      setIsRoleModalOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
      e.preventDefault();
      if (roleForm.id) {
          setRoles(prev => prev.map(r => r.id === roleForm.id ? { ...r, name: roleForm.name!, permissions: roleForm.permissions! } : r));
      } else {
          const newRole: RoleDefinition = {
              id: `R-${Date.now()}`,
              name: roleForm.name!,
              permissions: roleForm.permissions!,
              isSystem: false
          };
          setRoles([...roles, newRole]);
      }
      setIsRoleModalOpen(false);
  };

  const handleDeleteRole = (id: string) => {
      if (window.confirm('هل أنت متأكد من حذف هذا الدور؟')) {
          setRoles(prev => prev.filter(r => r.id !== id));
      }
  };

  const toggleRolePermission = (permId: string) => {
      setRoleForm(prev => {
          const current = prev.permissions || [];
          if (current.includes(permId)) {
              return { ...prev, permissions: current.filter(p => p !== permId) };
          } else {
              return { ...prev, permissions: [...current, permId] };
          }
      });
  };

  // Role selection on user form change - auto populate permissions
  const handleUserRoleChange = (roleName: string) => {
      const roleDef = roles.find(r => r.name === roleName);
      setUserForm(prev => ({
          ...prev,
          role: roleName,
          permissions: roleDef ? roleDef.permissions : []
      }));
  };

  const togglePermission = (permId: string) => {
    setUserForm(prev => {
      const exists = prev.permissions.includes(permId);
      return exists ? { ...prev, permissions: prev.permissions.filter(p => p !== permId) } : { ...prev, permissions: [...prev.permissions, permId] };
    });
  };

  const toggleUserStatus = (id: string) => {
    const updated = users.map(u => u.id === id ? { ...u, active: !u.active } : u);
    setUsers(updated);
    localStorage.setItem('system_users', JSON.stringify(updated));
  };

  const handleChangeUserPassword = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`تم تغيير كلمة المرور للمستخدم ${selectedUser?.username} بنجاح`);
    setIsPasswordModalOpen(false);
    setUserPasswordForm('');
    setSelectedUser(null);
  };

  const handleActivateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateLicenseKey(licenseKey, deviceId);
    if (validation.isValid) {
      localStorage.setItem('subscriptionStatus', 'paid');
      localStorage.setItem('licenseKey', licenseKey); 
      if (validation.expiryDate) {
          localStorage.setItem('subscriptionExpiry', validation.expiryDate);
          setExpiryDate(validation.expiryDate);
      }
      setIsPaid(true);
      alert(`تم التفعيل بنجاح! \nصلاحية النسخة حتى: ${validation.expiryDate}`);
      if (onSubscriptionChange) onSubscriptionChange();
      window.location.reload();
    } else {
      alert(validation.message);
    }
  };

  const handleResetTrial = () => {
    if (window.confirm('هل أنت متأكد من العودة للنسخة التجريبية؟')) {
      localStorage.removeItem('subscriptionStatus');
      localStorage.removeItem('subscriptionExpiry');
      localStorage.removeItem('licenseKey');
      setIsPaid(false);
      setLicenseKey('');
      setExpiryDate(null);
      if (onSubscriptionChange) onSubscriptionChange();
      alert('تمت العودة للنسخة التجريبية');
      window.location.reload();
    }
  };

  const copyDeviceId = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(deviceId)
        .then(() => alert('تم نسخ رقم الجهاز'))
        .catch(() => alert('فشل النسخ التلقائي، يرجى النسخ يدوياً'));
    } else {
      // Fallback
      alert('فشل النسخ التلقائي. الجهاز: ' + deviceId);
    }
  };

  const handleCreateBackup = () => {
    const backupData = { meta: { version: '1.0.0', date: new Date().toISOString(), type: 'full_backup', system: 'Nizam HR' }, data: { localStorage: { ...localStorage }, runtime: { users, databases } } };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${backupName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.meta && parsed.meta.system === 'Nizam HR') {
          if (window.confirm(`سيتم استعادة نسخة احتياطية بتاريخ ${parsed.meta.date}.\nسيتم إعادة تحميل النظام، هل أنت متأكد؟`)) {
            localStorage.clear();
            if (parsed.data && parsed.data.localStorage) {
              Object.entries(parsed.data.localStorage).forEach(([key, value]) => { localStorage.setItem(key, value as string); });
            }
            alert('تمت استعادة البيانات بنجاح. سيتم إعادة التشغيل.');
            window.location.reload();
          }
        } else {
          alert('ملف النسخة الاحتياطية غير صالح أو تالف.');
        }
      } catch (error) { console.error(error); alert('حدث خطأ أثناء قراءة الملف.'); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConnectDatabase = (id: string) => {
    const dbName = databases.find(d => d.id === id)?.companyName;
    const confirmed = window.confirm(`هل أنت متأكد من الانتقال إلى قاعدة البيانات: ${dbName}؟`);
    if(confirmed) {
        setIsConnecting(id);
        setTimeout(() => {
            const oldDbId = activeDatabaseId;
            DATA_KEYS.forEach(key => {
                const currentData = localStorage.getItem(key);
                if (currentData) localStorage.setItem(`${oldDbId}_${key}`, currentData);
            });
            DATA_KEYS.forEach(key => {
                const savedData = localStorage.getItem(`${id}_${key}`);
                if (savedData) localStorage.setItem(key, savedData);
                else localStorage.setItem(key, '[]'); 
            });
            localStorage.setItem('active_db_id', id);
            setActiveDatabaseId(id);
            window.location.reload(); 
        }, 1000); 
    }
  };

  const handleEditDatabase = (db: SystemDatabase) => { setDbForm({ name: db.name, companyName: db.companyName }); setEditingDbId(db.id); setIsDBModalOpen(true); };

  const handleDeleteDatabase = (id: string) => {
    if (id === activeDatabaseId) { alert('لا يمكن حذف قاعدة البيانات النشطة حالياً.'); return; }
    if (window.confirm('هل أنت متأكد من حذف قاعدة البيانات هذه نهائياً؟')) {
      setDatabases(databases.filter(d => d.id !== id));
      DATA_KEYS.forEach(key => { localStorage.removeItem(`${id}_${key}`); });
      alert('تم حذف قاعدة البيانات بنجاح.');
    }
  };

  const handleSaveDatabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDbId) {
      const updatedDBs = databases.map(db => db.id === editingDbId ? { ...db, name: dbForm.name, companyName: dbForm.companyName } : db);
      setDatabases(updatedDBs);
      alert('تم تحديث بيانات قاعدة البيانات بنجاح');
    } else {
      const newDB: SystemDatabase = { id: `DB${Date.now()}`, name: dbForm.name, companyName: dbForm.companyName, status: 'active', createdAt: new Date().toISOString().split('T')[0], usersCount: 0 };
      setDatabases([...databases, newDB]);
      alert('تم إنشاء قاعدة البيانات بنجاح.');
    }
    setIsDBModalOpen(false);
    setDbForm({ name: '', companyName: '' });
    setEditingDbId(null);
  };

  const handleChangeAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordForm.new !== adminPasswordForm.confirm) { alert('كلمات المرور غير متطابقة'); return; }
    alert('تم تحديث كلمة المرور الخاصة بك بنجاح');
    setAdminPasswordForm({ current: '', new: '', confirm: '' });
  };

  const handleLinkEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const empId = e.target.value;
      const emp = employeesList.find(emp => emp.id === empId);
      if (emp && !userForm.id) {
          setUserForm(prev => ({ ...prev, linkedEmployeeId: empId, fullName: emp.name, username: emp.employeeCode.toLowerCase().replace(/[^a-z0-9]/g, ''), role: UserRole.EMPLOYEE }));
      } else {
          setUserForm(prev => ({ ...prev, linkedEmployeeId: empId }));
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div><h2 className="text-2xl font-bold text-gray-800">{t('systemSettings')}</h2><p className="text-sm text-gray-500">إدارة المستخدمين، الصلاحيات، والنسخ الاحتياطي</p></div>
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-xl overflow-x-auto">
        <button disabled={isExpired} onClick={() => setActiveTab('general')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><Building2 className="h-5 w-5" />{t('companyInfo')}</button>
        <button disabled={isExpired} onClick={() => setActiveTab('departments')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'departments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><Network className="h-5 w-5" />الأقسام</button>
        <button disabled={isExpired} onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><Users className="h-5 w-5" />{t('users')}</button>
        <button disabled={isExpired} onClick={() => setActiveTab('roles')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'roles' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><Shield className="h-5 w-5" />الأدوار</button>
        <button disabled={isExpired} onClick={() => setActiveTab('payroll')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'payroll' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><DollarSign className="h-5 w-5" />{t('payrollConfig')}</button>
        <button disabled={isExpired} onClick={() => setActiveTab('databases')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'databases' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><Database className="h-5 w-5" />{t('databases')}</button>
        <button disabled={isExpired} onClick={() => setActiveTab('security')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'security' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><Lock className="h-5 w-5" />{t('security')}</button>
        <button disabled={isExpired} onClick={() => setActiveTab('backup')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'backup' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><HardDrive className="h-5 w-5" />{t('backup')}</button>
        <button onClick={() => setActiveTab('subscription')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'subscription' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><CreditCard className="h-5 w-5" />{t('subscription')}</button>
      </div>

      <div className="bg-white p-6 rounded-b-xl shadow-sm border border-gray-100 border-t-0 min-h-[500px]">
        
        {/* PAYROLL CONFIG TAB */}
        {!isExpired && activeTab === 'payroll' && (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <div>
                        <h4 className="font-bold text-sm text-green-800">إعدادات محرك الرواتب</h4>
                        <p className="text-xs text-green-700 mt-1">تحديد النسب المئوية للضرائب والتأمينات التي سيتم استخدامها عند حساب الرواتب تلقائياً.</p>
                    </div>
                </div>

                <form onSubmit={handlePayrollConfigSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <h5 className="font-bold text-gray-700 mb-3 border-b pb-2">الاستقطاعات الإلزامية</h5>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">نسبة الضرائب (%)</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={payrollConfig.taxPercentage} onChange={e => setPayrollConfig({...payrollConfig, taxPercentage: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">تأمين اجتماعي (حصة الموظف %)</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={payrollConfig.insuranceEmployeePercentage} onChange={e => setPayrollConfig({...payrollConfig, insuranceEmployeePercentage: Number(e.target.value)})} />
                    </div>
                    
                    <div className="md:col-span-2">
                        <h5 className="font-bold text-gray-700 mb-3 border-b pb-2 mt-4">البدلات والحصص</h5>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">تأمين اجتماعي (حصة الشركة %)</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={payrollConfig.insuranceCompanyPercentage} onChange={e => setPayrollConfig({...payrollConfig, insuranceCompanyPercentage: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">بدل سكن (نسبة من الأساسي)</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={payrollConfig.housingAllowancePercentage} onChange={e => setPayrollConfig({...payrollConfig, housingAllowancePercentage: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">بدل انتقال (نسبة من الأساسي)</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={payrollConfig.transportAllowancePercentage} onChange={e => setPayrollConfig({...payrollConfig, transportAllowancePercentage: Number(e.target.value)})} />
                    </div>

                    <div className="md:col-span-2 flex justify-end pt-4">
                        <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition">
                            <Save className="h-5 w-5" /> حفظ الإعدادات
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === 'subscription' && (
           <div className="max-w-2xl mx-auto text-center animate-in fade-in duration-300">
              {isExpired && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-xl font-bold text-red-700 flex items-center justify-center gap-2">
                          <Lock className="h-6 w-6" />
                          النظام معطل (منتهي الصلاحية)
                      </h3>
                      <p className="text-red-600 mt-2">يرجى إدخال كود تفعيل جديد لاستعادة الوصول إلى بياناتك.</p>
                  </div>
              )}

              {isPaid ? (
                 <div className="py-10">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><CheckCircle className="h-12 w-12 text-green-600" /></div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">النسخة الأصلية مفعلة</h3>
                    <p className="text-gray-500 mb-8">شكراً لاشتراكك في نظام HR المتكامل.</p>
                    <div className="bg-gray-50 rounded-xl p-6 text-right max-w-md mx-auto mb-8 border border-gray-200">
                       <div className="flex justify-between mb-3 border-b border-gray-200 pb-2"><span className="text-gray-600 text-sm">نوع الترخيص</span><span className="font-bold text-gray-800 text-sm">جهاز واحد (Single Device)</span></div>
                       <div className="flex justify-between mb-3 border-b border-gray-200 pb-2"><span className="text-gray-600 text-sm">رقم الجهاز</span><span className="font-mono text-gray-800 text-xs">{deviceId}</span></div>
                       <div className="flex justify-between mb-3 border-b border-gray-200 pb-2"><span className="text-gray-600 text-sm">ينتهي في</span><span className="font-mono text-indigo-600 font-bold">{expiryDate || 'غير محدود'}</span></div>
                       <div className="flex justify-between items-center"><span className="text-gray-600 text-sm">الحالة</span><span className="inline-flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-2 py-0.5 rounded"><CheckCircle className="h-3 w-3" />نشط</span></div>
                    </div>
                    <button onClick={handleResetTrial} className="flex items-center gap-2 mx-auto text-xs text-gray-400 hover:text-red-500 hover:underline transition-colors"><RotateCcw className="h-3 w-3" />إلغاء التفعيل والعودة للنسخة التجريبية</button>
                 </div>
              ) : (
                 <div className="py-6">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Star className="h-10 w-10 text-indigo-600" /></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">تفعيل النسخة الكاملة</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm leading-relaxed">لتفعيل النظام، يرجى إرسال "رقم الجهاز" إلى الدعم الفني للحصول على كود التفعيل.</p>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-8 text-right max-w-md mx-auto">
                        <p className="text-xs text-gray-500 mb-1">رقم الجهاز (Device ID):</p>
                        <div className="flex gap-2"><code className="flex-1 bg-white border border-gray-200 p-2 rounded text-center font-mono font-bold text-gray-700 tracking-widest select-all">{deviceId}</code><button onClick={copyDeviceId} className="bg-white border border-gray-200 p-2 rounded text-gray-500 hover:text-indigo-600 hover:border-indigo-300" title="نسخ"><Copy className="h-5 w-5" /></button></div>
                    </div>
                    <form onSubmit={handleActivateLicense} className="max-w-sm mx-auto space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                       <div className="text-right">
                          <label className="block text-sm font-bold text-gray-700 mb-2">كود التفعيل (License Key)</label>
                          <div className="relative"><Key className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><input type="text" placeholder="NZM-XXXX-XXXX" className="w-full text-center font-mono tracking-widest rounded-lg border border-gray-300 p-3 pr-10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none uppercase bg-white shadow-sm" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} /></div>
                       </div>
                       <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:opacity-90 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"><CheckCircle className="h-5 w-5" />تفعيل الآن</button>
                    </form>
                 </div>
              )}
           </div>
        )}

        {/* GENERAL / COMPANY SETTINGS TAB */}
        {!isExpired && activeTab === 'general' && (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">التفاصيل الأساسية</h3>
                <form onSubmit={handleCompanySave} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">اسم المنشأة</label><input type="text" value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label><input type="text" value={companyForm.phone} onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300" dir="ltr" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label><input type="email" value={companyForm.email} onChange={e => setCompanyForm({...companyForm, email: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300" dir="ltr" /></div>
                    </div>
                    <div className="pt-4 flex justify-end"><button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700"><Save className="h-5 w-5" /> حفظ البيانات</button></div>
                </form>
                </div>
                <div className="w-full md:w-80 shrink-0">
                <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">شعار الشركة</h3>
                <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center">
                    {companyForm.logo ? <img src={companyForm.logo} alt="Logo" className="w-40 h-40 object-contain mb-4" /> : <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4"><ImageIcon className="h-12 w-12 text-gray-400" /></div>}
                    <button onClick={() => logoInputRef.current?.click()} className="text-indigo-600 text-sm font-bold hover:underline">رفع شعار جديد</button>
                    <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
                </div>
                </div>
            </div>
        </div>
        )}

        {/* DEPARTMENTS TAB */}
        {!isExpired && activeTab === 'departments' && (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-center gap-3">
                    <Network className="h-6 w-6 text-indigo-600" />
                    <div>
                        <h4 className="font-bold text-sm text-indigo-800">الهيكل الإداري للشركة</h4>
                        <p className="text-xs text-indigo-700 mt-1">قم بإضافة وتعديل أقسام الشركة لتظهر في قوائم الموظفين.</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="اسم القسم الجديد..." 
                        className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none"
                        value={newDept}
                        onChange={e => setNewDept(e.target.value)}
                    />
                    <button 
                        onClick={handleAddDepartment}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" /> إضافة
                    </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-700 text-sm">
                        الأقسام الحالية ({departments.length})
                    </div>
                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {departments.map((dept, index) => (
                            <div key={index} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group">
                                <span className="text-gray-800 font-medium">{dept}</span>
                                <button 
                                    onClick={() => handleDeleteDepartment(dept)}
                                    className="text-gray-400 hover:text-red-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="حذف"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {departments.length === 0 && (
                            <div className="p-6 text-center text-gray-400 text-sm">
                                لا توجد أقسام مضافة حالياً.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* USERS TAB */}
        {!isExpired && activeTab === 'users' && (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
            <button onClick={() => handleOpenUserModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"><Plus className="h-5 w-5" /> مستخدم جديد</button>
            </div>
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-gray-500"><tr><th className="px-6 py-4">المستخدم</th><th className="px-6 py-4">الدور</th><th className="px-6 py-4">ارتباط بموظف</th><th className="px-6 py-4">الحالة</th><th className="px-6 py-4">إجراءات</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{user.fullName} ({user.username})</td>
                    <td className="px-6 py-4"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs border border-indigo-100">{user.role}</span></td>
                    <td className="px-6 py-4">{user.linkedEmployeeId ? <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded w-fit"><UserCheck className="h-3 w-3" /> تم الربط</span> : '-'}</td>
                    <td className="px-6 py-4"><button onClick={() => toggleUserStatus(user.id)} className={`px-2 py-1 rounded text-xs ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.active ? 'نشط' : 'موقف'}</button></td>
                    <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => handleOpenUserModal(user)}><Edit className="h-4 w-4 text-blue-600" /></button><button onClick={() => { setSelectedUser(user); setIsPasswordModalOpen(true); }}><Key className="h-4 w-4 text-indigo-600" /></button></div></td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
        )}

        {/* ROLES TAB */}
        {!isExpired && activeTab === 'roles' && (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="text-gray-600 text-sm">قم بإنشاء أدوار مخصصة وتحديد الصلاحيات لكل دور.</div>
                    <button onClick={() => handleOpenRoleModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"><Plus className="h-5 w-5" /> دور جديد</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map(role => (
                        <div key={role.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-indigo-600" />
                                    {role.name}
                                </h4>
                                {!role.isSystem && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenRoleModal(role)} className="text-gray-400 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => handleDeleteRole(role.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                )}
                                {role.isSystem && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded">نظام</span>}
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                                {role.permissions.slice(0, 5).map(perm => (
                                    <span key={perm} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{AVAILABLE_PERMISSIONS.find(p => p.id === perm)?.label || perm}</span>
                                ))}
                                {role.permissions.length > 5 && <span className="text-[10px] text-gray-500">+{role.permissions.length - 5} المزيد</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* DATABASES TAB */}
        {!isExpired && activeTab === 'databases' && (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-lg flex items-start gap-3 max-w-2xl">
                <Server className="h-5 w-5 mt-0.5" />
                <div><h4 className="font-bold text-sm">نظام تعدد الشركات (Multi-Tenancy)</h4><p className="text-xs mt-1 opacity-90">يمكنك إنشاء قواعد بيانات منفصلة لكل فرع أو شركة شقيقة.</p></div>
                </div>
                <button onClick={() => setIsDBModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"><Plus className="h-5 w-5" /> قاعدة بيانات جديدة</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {databases.map(db => (
                <div key={db.id} className={`border rounded-xl p-5 hover:shadow-md transition-all ${db.id === activeDatabaseId ? 'border-green-500 ring-2 ring-green-100 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg border ${db.id === activeDatabaseId ? 'bg-green-100 border-green-200' : 'bg-white border-gray-200'}`}>
                            <Database className={`h-6 w-6 ${db.id === activeDatabaseId ? 'text-green-600' : 'text-indigo-600'}`} />
                        </div>
                        {db.id === activeDatabaseId && <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded-full">نشط الآن</span>}
                    </div>
                    <h3 className="font-bold text-gray-800">{db.companyName}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1 mb-4">{db.name}</p>
                    <div className="mt-4 flex gap-2">
                        <button onClick={() => handleConnectDatabase(db.id)} disabled={db.id === activeDatabaseId} className="flex-1 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isConnecting === db.id ? 'جاري الاتصال...' : (db.id === activeDatabaseId ? 'متصل' : 'اتصال')}
                        </button>
                        <button onClick={() => handleEditDatabase(db)} className="px-3 py-1.5 text-xs font-medium border border-gray-300 bg-white rounded hover:bg-gray-50"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteDatabase(db.id)} disabled={db.id === activeDatabaseId} className="px-3 py-1.5 text-xs font-medium border border-red-200 bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                </div>
                ))}
            </div>
        </div>
        )}

        {/* SECURITY TAB */}
        {!isExpired && activeTab === 'security' && (
        <div className="max-w-2xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg mb-8 flex gap-3">
                <Lock className="h-5 w-5 text-yellow-600" />
                <div><h4 className="font-bold text-sm text-yellow-800">حماية حساب المسؤول</h4><p className="text-xs text-yellow-700 mt-1">يُنصح بتغيير كلمة المرور بشكل دوري.</p></div>
            </div>
            <form onSubmit={handleChangeAdminPassword} className="space-y-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الحالية</label><input type="password" required className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={adminPasswordForm.current} onChange={(e) => setAdminPasswordForm({...adminPasswordForm, current: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الجديدة</label><input type="password" required className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={adminPasswordForm.new} onChange={(e) => setAdminPasswordForm({...adminPasswordForm, new: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور الجديدة</label><input type="password" required className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={adminPasswordForm.confirm} onChange={(e) => setAdminPasswordForm({...adminPasswordForm, confirm: e.target.value})} /></div>
                <div className="pt-4 flex justify-end"><button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition"><Save className="h-5 w-5" />حفظ التغييرات</button></div>
            </form>
        </div>
        )}

        {/* BACKUP TAB */}
        {!isExpired && activeTab === 'backup' && (
        <div className="max-w-3xl mx-auto">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-8 flex gap-3">
                <HardDrive className="h-6 w-6 text-indigo-600" />
                <div><h4 className="font-bold text-sm text-indigo-800">النسخ الاحتياطي واستعادة النظام</h4><p className="text-xs text-indigo-700 mt-1">قم بحفظ نسخة من بيانات النظام الحالية لاستعادتها لاحقاً.</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-indigo-300 transition-all">
                <div className="flex items-center gap-2 mb-4"><div className="bg-blue-50 p-2 rounded-full"><Download className="h-6 w-6 text-blue-600" /></div><h3 className="font-bold text-gray-800">إنشاء نسخة احتياطية</h3></div>
                <div className="space-y-4">
                    <div><label className="block text-xs text-gray-500 mb-1">اسم ملف النسخة</label><div className="relative"><input type="text" className="w-full border border-gray-300 rounded-lg p-2 pl-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={backupName} onChange={(e) => setBackupName(e.target.value)} /><FileJson className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /></div></div>
                    <button onClick={handleCreateBackup} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"><Download className="h-4 w-4" />تحميل النسخة</button>
                </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-orange-300 transition-all">
                <div className="flex items-center gap-2 mb-4"><div className="bg-orange-50 p-2 rounded-full"><Upload className="h-6 w-6 text-orange-600" /></div><h3 className="font-bold text-gray-800">استعادة نسخة سابقة</h3></div>
                <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg"><div className="flex items-center gap-2 text-orange-800 mb-1"><AlertTriangle className="h-4 w-4" /><span className="text-xs font-bold">تنبيه هام</span></div><p className="text-xs text-orange-700">استعادة النسخة ستقوم بمسح البيانات الحالية.</p></div>
                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestoreBackup} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2 dashed-border"><Upload className="h-4 w-4" />اختيار ملف النسخة (.json)</button>
                </div>
                </div>
            </div>
        </div>
        )}
      </div>

      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                 <h3 className="font-bold text-gray-800">{userForm.id ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</h3>
                 <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSaveUser} className="p-6 space-y-6">
                   <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <label className="block text-sm font-medium text-blue-800 mb-2">ربط بموظف (للخدمة الذاتية)</label>
                        <select className="w-full border border-blue-200 rounded-lg p-2 text-sm bg-white" value={userForm.linkedEmployeeId} onChange={handleLinkEmployeeChange}>
                            <option value="">-- حساب إداري (غير مرتبط) --</option>
                            {employeesList.map(emp => (<option key={emp.id} value={emp.id}>{emp.name} - {emp.employeeCode}</option>))}
                        </select>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="text-sm block mb-1">اسم المستخدم</label><input type="text" required className="w-full border rounded p-2" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} /></div>
                      <div><label className="text-sm block mb-1">الاسم الكامل</label><input type="text" required className="w-full border rounded p-2" value={userForm.fullName} onChange={e => setUserForm({...userForm, fullName: e.target.value})} /></div>
                      <div><label className="text-sm block mb-1">البريد الإلكتروني</label><input type="email" required className="w-full border rounded p-2" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} /></div>
                      
                      <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">الدور (Role)</label>
                          <select 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-indigo-500 outline-none" 
                            value={userForm.role} 
                            onChange={e => handleUserRoleChange(e.target.value)}
                          >
                             {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                          </select>
                      </div>

                      {!userForm.id && <div className="md:col-span-2"><label className="text-sm block mb-1">كلمة المرور</label><input type="password" required className="w-full border rounded p-2" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} /></div>}
                   </div>
                   
                   <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-gray-700">صلاحيات الوصول</h4>
                            <span className="text-xs text-gray-500">تم تحديدها تلقائياً بناءً على الدور</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {AVAILABLE_PERMISSIONS.map(p => (
                                <div key={p.id} onClick={() => togglePermission(p.id)} className={`p-2 border rounded cursor-pointer ${userForm.permissions.includes(p.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''}`}>
                                    {userForm.permissions.includes(p.id) ? <CheckSquare className="h-3 w-3 inline mr-1" /> : <Square className="h-3 w-3 inline mr-1" />}
                                    {p.label}
                                </div>
                            ))}
                        </div>
                   </div>
                </form>
              </div>
              <div className="p-4 border-t flex justify-end gap-2"><button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 border rounded">إلغاء</button><button onClick={handleSaveUser} className="px-4 py-2 bg-indigo-600 text-white rounded">حفظ</button></div>
           </div>
        </div>
      )}

      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                 <h3 className="font-bold text-gray-800">{roleForm.id ? 'تعديل الدور' : 'إنشاء دور جديد'}</h3>
                 <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                 <form onSubmit={handleSaveRole} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم الدور</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:border-indigo-500 outline-none" 
                            placeholder="مثال: مشرف مبيعات"
                            value={roleForm.name} 
                            onChange={e => setRoleForm({...roleForm, name: e.target.value})} 
                            disabled={roleForm.isSystem} 
                        />
                        {roleForm.isSystem && <p className="text-xs text-orange-600 mt-1">هذا دور أساسي في النظام.</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">الصلاحيات الافتراضية</label>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                            {AVAILABLE_PERMISSIONS.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => toggleRolePermission(p.id)} 
                                    className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${roleForm.permissions?.includes(p.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200'}`}
                                >
                                    {roleForm.permissions?.includes(p.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-gray-400" />}
                                    <span className="text-sm">{p.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                 </form>
              </div>
              <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
                 <button onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">إلغاء</button>
                 <button onClick={handleSaveRole} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">حفظ الدور</button>
              </div>
           </div>
        </div>
      )}
      
      {isDBModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800">
                    {editingDbId ? 'تعديل قاعدة البيانات' : 'إنشاء قاعدة بيانات جديدة'}
                 </h3>
                 <button onClick={() => setIsDBModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleSaveDatabase} className="p-6 space-y-4">
                 <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">اسم الشركة</label>
                    <input type="text" required placeholder="مثال: شركة النور فرع القاهرة" className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={dbForm.companyName} onChange={e => setDbForm({...dbForm, companyName: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">اسم قاعدة البيانات (System Name)</label>
                    <input type="text" required placeholder="db_company_branch" className="w-full border border-gray-300 rounded-lg p-2 text-sm font-mono" value={dbForm.name} onChange={e => setDbForm({...dbForm, name: e.target.value})} />
                 </div>
                 <div className="pt-2"><button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">{editingDbId ? 'حفظ التعديلات' : 'إنشاء القاعدة'}</button></div>
              </form>
           </div>
        </div>
      )}

      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800">تغيير كلمة مرور</h3>
                 <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleChangeUserPassword} className="p-6 space-y-4">
                 <p className="text-sm text-gray-600">تعيين كلمة مرور جديدة للمستخدم: <span className="font-bold text-gray-900">{selectedUser.username}</span></p>
                 <div><input type="password" required placeholder="كلمة المرور الجديدة" className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={userPasswordForm} onChange={e => setUserPasswordForm(e.target.value)} /></div>
                 <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">حفظ</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
)


--- START OF FILE src/pages/Shifts.tsx ---
(
import React, { useState, useEffect } from 'react';
import { MOCK_SHIFTS } from '../constants';
import { Shift } from '../types';
import { Plus, X, Clock, CalendarDays, Trash2, Edit } from 'lucide-react';
import DataControls from '../components/DataControls';

const Shifts: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('shifts_data');
    if (saved) return JSON.parse(saved);
    const activeDb = localStorage.getItem('active_db_id');
    return (!activeDb || activeDb === 'DB1') ? MOCK_SHIFTS : [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  
  const [shiftForm, setShiftForm] = useState<Partial<Shift>>({
    name: '',
    startTime: '',
    endTime: '',
    days: []
  });

  const allDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  useEffect(() => {
    localStorage.setItem('shifts_data', JSON.stringify(shifts));
  }, [shifts]);

  const handleOpenModal = (shift?: Shift) => {
    if (shift) {
      setEditingShiftId(shift.id);
      setShiftForm(shift);
    } else {
      setEditingShiftId(null);
      setShiftForm({ name: '', startTime: '08:00', endTime: '16:00', days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] });
    }
    setIsModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shiftForm.name || !shiftForm.startTime || !shiftForm.endTime) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    if (editingShiftId) {
      setShifts(prev => prev.map(s => s.id === editingShiftId ? { ...s, ...shiftForm } as Shift : s));
    } else {
      const newShift: Shift = {
        id: `SH-${Date.now()}`,
        name: shiftForm.name!,
        startTime: shiftForm.startTime!,
        endTime: shiftForm.endTime!,
        days: shiftForm.days || []
      };
      setShifts([...shifts, newShift]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteShift = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الوردية؟')) {
      setShifts(shifts.filter(s => s.id !== id));
    }
  };

  const toggleDay = (day: string) => {
    setShiftForm(prev => {
      const currentDays = prev.days || [];
      if (currentDays.includes(day)) {
        return { ...prev, days: currentDays.filter(d => d !== day) };
      } else {
        return { ...prev, days: [...currentDays, day] };
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة الورديات</h2>
          <p className="text-sm text-gray-500">تعريف مواعيد العمل الرسمية وأيام الإجازات</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 transition"
        >
          <Plus className="h-5 w-5" />
          <span>إضافة وردية</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map(shift => (
          <div key={shift.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-gray-800">{shift.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(shift)} className="text-gray-400 hover:text-indigo-600 p-1"><Edit className="h-4 w-4" /></button>
                <button onClick={() => handleDeleteShift(shift.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
               <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  <span className="font-mono">{shift.startTime}</span>
               </div>
               <span>إلى</span>
               <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="font-mono">{shift.endTime}</span>
               </div>
            </div>

            <div className="space-y-2">
               <p className="text-xs text-gray-500 font-medium">أيام العمل:</p>
               <div className="flex flex-wrap gap-1.5">
                  {shift.days.map((day, idx) => (
                     <span key={idx} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs border border-indigo-100">{day}</span>
                  ))}
               </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 p-6 bg-gray-50">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-indigo-600" />
                    {editingShiftId ? 'تعديل وردية' : 'إضافة وردية جديدة'}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition">
                    <X className="h-6 w-6" />
                 </button>
              </div>
              
              <form onSubmit={handleSaveShift} className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم الوردية</label>
                    <input 
                       type="text" required 
                       className="w-full p-2 rounded-lg border border-gray-300 focus:border-indigo-500 outline-none"
                       placeholder="مثال: الوردية الصباحية"
                       value={shiftForm.name}
                       onChange={(e) => setShiftForm({...shiftForm, name: e.target.value})}
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">وقت الحضور</label>
                       <input 
                          type="time" required 
                          className="w-full p-2 rounded-lg border border-gray-300 text-center"
                          value={shiftForm.startTime}
                          onChange={(e) => setShiftForm({...shiftForm, startTime: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">وقت الانصراف</label>
                       <input 
                          type="time" required 
                          className="w-full p-2 rounded-lg border border-gray-300 text-center"
                          value={shiftForm.endTime}
                          onChange={(e) => setShiftForm({...shiftForm, endTime: e.target.value})}
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">أيام العمل</label>
                    <div className="flex flex-wrap gap-2">
                       {allDays.map(day => (
                          <button
                             type="button"
                             key={day}
                             onClick={() => toggleDay(day)}
                             className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                shiftForm.days?.includes(day)
                                   ? 'bg-indigo-600 text-white border-indigo-600'
                                   : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                             }`}
                          >
                             {day}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="pt-4 flex gap-2">
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium">حفظ</button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium">إلغاء</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Shifts;
)


--- START OF FILE src/components/DataControls.tsx ---
(
import React, { useRef, useState } from 'react';
import { Download, Upload, ShieldAlert, Loader2 } from 'lucide-react';

interface DataControlsProps<T> {
  data: T[];
  onImport?: (data: T[]) => void;
  fileName: string;
  isAdmin: boolean;
  headers?: { key: keyof T; label: string }[];
}

const DataControls = <T extends object>({ 
  data, 
  onImport, 
  fileName, 
  isAdmin,
  headers 
}: DataControlsProps<T>) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Optimized Export: Using timeout to unblock UI and more efficient string building
  const handleExport = async () => {
    if (!data || data.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    setIsProcessing(true);

    // Yield control to UI thread to show spinner
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        // Determine headers
        const cols = headers 
          ? headers.map(h => h.key) 
          : Object.keys(data[0]) as (keyof T)[];
        
        const headerLabels = headers 
          ? headers.map(h => h.label) 
          : cols;

        // Build CSV Content
        // Using map and join is generally faster than += in loops for V8
        const csvRows = [
          headerLabels.join(',')
        ];

        // Process in chunks if data is huge, otherwise simple map
        const bodyRows = data.map(row => 
            cols.map(col => {
              const val = row[col];
              // Escape quotes and wrap in quotes to handle commas in data
              const escaped = ('' + (val ?? '')).replace(/"/g, '""');
              return `"${escaped}"`;
            }).join(',')
        );

        const csvString = '\uFEFF' + csvRows.concat(bodyRows).join('\n');
        
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Export failed", error);
        alert('حدث خطأ أثناء التصدير');
    } finally {
        setIsProcessing(false);
    }
  };

  // Optimized Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        
        // Yield to main thread before heavy parsing
        await new Promise(resolve => setTimeout(resolve, 50));

        const lines = text.split('\n');
        // Filter empty lines early
        const validLines = lines.filter(l => l.trim().length > 0);
        
        if (validLines.length < 2) throw new Error("File empty or invalid format");

        const headerLine = validLines[0];
        const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        const result = validLines.slice(1).map(line => {
          // Robust regex for CSV splitting including quoted commas
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => 
            val.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
          );
          
          const obj: any = {};
          headers.forEach((header, index) => {
             if (values[index] !== undefined) {
                 obj[header] = values[index];
             }
          });
          return obj as T;
        });

        if (onImport) {
          onImport(result);
          alert(`تم استيراد ${result.length} سجل بنجاح`);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('حدث خطأ أثناء قراءة الملف. تأكد من صحة التنسيق (CSV).');
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200" title="مطلوب صلاحية مدير">
        <ShieldAlert className="h-3 w-3" />
        <span>التحكم في البيانات مقيد</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input 
        type="file" 
        accept=".csv,.xlsx" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" 
      />
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-wait"
      >
        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        <span className="hidden sm:inline">استيراد</span>
      </button>

      <button 
        onClick={handleExport}
        disabled={isProcessing}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-wait"
      >
        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        <span className="hidden sm:inline">تصدير Excel</span>
      </button>
    </div>
  );
};

export default DataControls;
)



--- START OF FILE src/components/Sidebar.tsx ---
(
import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  FileText, 
  ShieldCheck, 
  Clock, 
  CalendarOff, 
  DollarSign, 
  BarChart3, 
  Settings,
  LayoutDashboard,
  Wallet,
  GitFork,
  Truck,
  CalendarClock,
  Lock,
  Palette,
  TrendingUp 
} from 'lucide-react';
import { MenuItem, UserRole } from '../types';
import { AppContext } from '../App';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  userPermissions?: string[]; 
  userRole?: string;
  isExpired?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, userPermissions, userRole, isExpired }) => {
  const { t, themeColor, language } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('نـظـام HR');

  // Load company settings
  useEffect(() => {
    const savedCompany = localStorage.getItem('company_settings');
    if (savedCompany) {
      const parsed = JSON.parse(savedCompany);
      if (parsed.logo) setCompanyLogo(parsed.logo);
      if (parsed.name) setCompanyName(parsed.name);
    }
  }, []);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, path: '/' },
    { id: 'employees', label: t('employees'), icon: Users, path: '/employees' },
    { id: 'org-chart', label: t('orgChart'), icon: GitFork, path: '/org-chart' },
    { id: 'shifts', label: t('shifts'), icon: CalendarClock, path: '/shifts' },
    { id: 'recruitment', label: t('recruitment'), icon: Briefcase, path: '/recruitment' },
    { id: 'transport', label: t('transport'), icon: Truck, path: '/transport' },
    { id: 'performance', label: t('performance'), icon: TrendingUp, path: '/performance' }, 
    { id: 'contracts', label: t('contracts'), icon: FileText, path: '/contracts' },
    { id: 'insurance', label: t('insurance'), icon: ShieldCheck, path: '/insurance' },
    { id: 'attendance', label: t('attendance'), icon: Clock, path: '/attendance' },
    { id: 'leaves', label: t('leaves'), icon: CalendarOff, path: '/leaves' },
    { id: 'payroll', label: t('payroll'), icon: DollarSign, path: '/payroll' },
    { id: 'loans', label: t('loans'), icon: Wallet, path: '/loans' },
    { id: 'reports', label: t('reports'), icon: BarChart3, path: '/reports' },
    { id: 'appearance', label: t('appearance'), icon: Palette, path: '/appearance' },
    { id: 'settings', label: t('settings'), icon: Settings, path: '/settings' },
  ];

  // Permission Logic
  const filteredMenuItems = menuItems.filter(item => {
    if (isExpired) return item.id === 'settings';
    
    // Employee View: Only show specific items
    if (userRole === UserRole.EMPLOYEE) {
        return ['dashboard', 'attendance', 'leaves', 'loans', 'performance', 'reports'].includes(item.id);
    }

    if (!userRole || userRole === UserRole.ADMIN) return true;
    if (userPermissions && userPermissions.length > 0) return userPermissions.includes(item.id);
    return false;
  });

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  // Determine Sidebar Position Class based on Language
  const isRtl = language === 'ar';
  const positionClass = isRtl ? 'right-0' : 'left-0';
  
  // Transform logic
  const transformClass = isOpen 
    ? 'translate-x-0' 
    : (isRtl ? 'translate-x-full' : '-translate-x-full');

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 ${positionClass} z-30 h-full w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen
        ${transformClass}
      `}>
        <div className="flex h-20 items-center justify-center border-b border-gray-100 relative overflow-hidden">
          {isExpired && (
             <div className="absolute inset-0 bg-gray-100/80 z-10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-gray-400" />
             </div>
          )}
          <div className="flex items-center gap-3 px-4">
            {companyLogo ? (
               <img src={companyLogo} alt="Logo" className="h-10 w-10 object-contain" />
            ) : (
               <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-indigo-600`}>
                  <Users className="h-6 w-6 text-white" />
               </div>
            )}
            <h1 className="text-lg font-bold text-gray-800 truncate max-w-[120px]" title={companyName}>{companyName}</h1>
          </div>
        </div>

        <nav className="mt-6 px-4 pb-20 overflow-y-auto h-[calc(100vh-5rem)] custom-scrollbar">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.path);

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                    style={isActive ? {
                        borderRight: isRtl ? '4px solid var(--primary-color)' : 'none',
                        borderLeft: !isRtl ? '4px solid var(--primary-color)' : 'none',
                        color: 'var(--primary-color)',
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10` // 10% opacity
                    } : {}}
                  >
                    <item.icon className="h-5 w-5" style={isActive ? { color: 'var(--primary-color)' } : {}} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
          
          {isExpired && (
             <div className="mt-8 p-4 bg-red-50 rounded-lg text-center border border-red-100">
                <p className="text-xs font-bold text-red-800 mb-1">الترخيص منتهي</p>
                <p className="text-[10px] text-red-600">يرجى الاتصال بالمسؤول لتفعيل النظام.</p>
             </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
)


--- START OF FILE src/components/StatCard.tsx ---
(import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: 'indigo' | 'green' | 'red' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color }) => {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">{value}</h3>
          {trend && <p className="mt-1 text-xs text-green-600 font-medium">{trend}</p>}
        </div>
        <div className={`rounded-full p-3 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;)


--- START OF FILE src/components/TrialBanner.tsx ---
(
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Sparkles } from 'lucide-react';

interface TrialBannerProps {
  daysLeft: number;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ daysLeft }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-indigo-900 text-white px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm shadow-md relative z-30 no-print">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-800 p-1 rounded-full">
           <Sparkles className="h-4 w-4 text-yellow-400" />
        </div>
        <span className="font-medium">نسخة تجريبية:</span>
        <span className="text-indigo-200">استمتع بجميع مميزات النظام مجاناً.</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-indigo-800/50 px-3 py-1 rounded-full border border-indigo-700">
          <Clock className="h-3 w-3 text-yellow-400" />
          <span>متبقي {daysLeft} يوم</span>
        </div>
        <button 
          onClick={() => navigate('/settings')}
          className="bg-yellow-500 hover:bg-yellow-600 text-indigo-900 font-bold px-4 py-1 rounded-lg transition-colors text-xs sm:text-sm"
        >
          تفعيل النسخة الأصلية
        </button>
      </div>
    </div>
  );
};

export default TrialBanner;
)

--- START OF FILE server.js ---
(
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// تهيئة التطبيق
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// --- Database Setup (SQLite Enterprise Mode) ---
// التأكد من وجود مجلد البيانات
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'nizam.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
    } else {
        console.log('✅ Connected to the SQLite database (nizam.db).');
        // تفعيل وضع WAL (Write-Ahead Logging) لأداء عالي وتعدد المستخدمين
        db.run('PRAGMA journal_mode = WAL;');
        db.run('PRAGMA synchronous = NORMAL;'); // توازن بين الأمان والسرعة
        initTables();
    }
});

// Helper to wrap SQLite in Promises
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// إنشاء الجداول (Create Tables)
async function initTables() {
    try {
        await dbRun(`CREATE TABLE IF NOT EXISTS employees (
            id TEXT PRIMARY KEY,
            employeeCode TEXT UNIQUE,
            name TEXT,
            nationalId TEXT,
            jobTitle TEXT,
            department TEXT,
            joinDate TEXT,
            salary REAL,
            status TEXT,
            contractType TEXT,
            shiftId TEXT,
            data TEXT
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS attendance (
            id TEXT PRIMARY KEY,
            employeeId TEXT,
            date TEXT,
            checkIn TEXT,
            checkOut TEXT,
            status TEXT,
            source TEXT
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            fullName TEXT,
            role TEXT,
            password TEXT,
            active INTEGER,
            permissions TEXT,
            linkedEmployeeId TEXT
        )`);

        console.log('✅ Database tables initialized.');
        
        const admin = await dbGet("SELECT * FROM users WHERE username = ?", ['admin']);
        if (!admin) {
            await dbRun(`INSERT INTO users (id, username, fullName, role, password, active, permissions) 
                         VALUES ('U1', 'admin', 'مدير النظام', 'مدير النظام', '123456', 1, '["ALL"]')`);
            console.log('👤 Default admin user created (admin / 123456).');
        }

    } catch (err) {
        console.error('❌ Error initializing tables:', err);
    }
}

// --- API Endpoints ---

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Nizam HR Server Online', mode: 'WAL' });
});

app.get('/api/employees', async (req, res) => {
    try {
        const rows = await dbAll("SELECT * FROM employees");
        const employees = rows.map(row => ({
            ...row,
            ...JSON.parse(row.data || '{}')
        }));
        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/employees', async (req, res) => {
    const emp = req.body;
    const extraData = JSON.stringify({
        avatar: emp.avatar,
        isDriver: emp.isDriver,
        driverLicenseNumber: emp.driverLicenseNumber,
        endOfServiceDate: emp.endOfServiceDate,
        shiftName: emp.shiftName
    });

    try {
        await dbRun(`INSERT OR REPLACE INTO employees 
            (id, employeeCode, name, nationalId, jobTitle, department, joinDate, salary, status, contractType, shiftId, data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [emp.id, emp.employeeCode, emp.name, emp.nationalId, emp.jobTitle, emp.department, emp.joinDate, emp.salary, emp.status, emp.contractType, emp.shiftId, extraData]
        );
        res.json({ success: true, id: emp.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        await dbRun("DELETE FROM employees WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/attendance', async (req, res) => {
    const { date } = req.query;
    try {
        let sql = "SELECT a.*, e.name as employeeName, e.employeeCode FROM attendance a LEFT JOIN employees e ON a.employeeId = e.id";
        let params = [];
        if (date) {
            sql += " WHERE a.date = ?";
            params.push(date);
        }
        const rows = await dbAll(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/attendance/batch', async (req, res) => {
    const records = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ error: "Expected array" });

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const stmt = db.prepare(`INSERT OR REPLACE INTO attendance (id, employeeId, date, checkIn, checkOut, status, source) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        records.forEach(r => {
            stmt.run(r.id, r.employeeId, r.date, r.checkIn, r.checkOut, r.status, r.source);
        });
        stmt.finalize();
        db.run("COMMIT");
        res.json({ success: true, count: records.length });
    });
});

app.post('/api/attendance/sync', async (req, res) => {
    const { ip, port, date } = req.body;
    // Simulation Logic for ZK Teco
    // In a real production app, you would use 'node-zklib' here to connect to the physical device
    const newRecords = [
        { id: `ZK-${Date.now()}`, employeeId: 'E001', date: date || new Date().toISOString().split('T')[0], checkIn: '08:05', checkOut: '16:00', status: 'present', source: 'Fingerprint' }
    ];
    try {
        for (const r of newRecords) {
            await dbRun(`INSERT OR REPLACE INTO attendance (id, employeeId, date, checkIn, checkOut, status, source) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [r.id, r.employeeId, r.date, r.checkIn, r.checkOut, r.status, r.source]);
        }
        res.json({ success: true, data: newRecords });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Serve Static Frontend (Production Ready) ---
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
    // Serve static files with cache control
    app.use(express.static(distPath, {
        maxAge: '1y',
        etag: false
    }));

    // Handle React Routing (SPA), return index.html for all unknown routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    console.log('⚠️  Frontend build not found in /dist. Running in API-only mode.');
}

// Helper to get IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// تشغيل السيرفر
app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIP();
    console.log(`
    ================================================
    🚀 Nizam HR Enterprise Server Running
    ================================================
    🌍 Local Access: http://localhost:${PORT}
    🌍 Network Access: http://${ip}:${PORT}
    💾 Database: SQLite (WAL Mode) @ /data/nizam.db
    ================================================
    `);
});
)


--- START OF FILE src/App.tsx ---
(
import React, { useState, useEffect, useContext, createContext } from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TrialBanner from './components/TrialBanner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetails from './pages/EmployeeDetails';
import Recruitment from './pages/Recruitment';
import Attendance from './pages/Attendance';
import Contracts from './pages/Contracts';
import Insurance from './pages/Insurance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Loans from './pages/Loans';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Appearance from './pages/Appearance'; 
import OrgChart from './pages/OrgChart';
import Transport from './pages/Transport';
import Performance from './pages/Performance'; 
import AdminKeyGenerator from './pages/AdminKeyGenerator';
import Shifts from './pages/Shifts';
import { Menu, Bell, Search, UserCircle, X, LogOut, Lock, Wifi, WifiOff } from 'lucide-react';
import { SystemUser, UserRole, Notification, AppContextType } from './types';
import { getDeviceId, validateLicenseKey } from './utils/security';
import { api } from './services/api';
import { translations, Language, ThemeColor } from './translations';

// Default Context
export const AppContext = createContext<AppContextType>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
  showNotifications: false,
  setShowNotifications: () => {},
  isPaidVersion: false,
  isExpired: false,
  trialDaysLeft: 0,
  notifications: [],
  addNotification: () => {},
  handleLogout: () => {},
  currentUser: null,
  isServerOnline: false,
  language: 'ar',
  setLanguage: () => {},
  themeColor: 'indigo',
  setThemeColor: () => {},
  themeMode: 'light',
  setThemeMode: () => {},
  t: (key) => key,
});

const ProtectedRoute = ({ children, isExpired }: { children: React.ReactElement, isExpired: boolean }) => {
  const location = useLocation();
  if (isExpired && location.pathname !== '/settings' && location.pathname !== '/license-manager') {
    return <Navigate to="/settings" replace />;
  }
  return children;
};

const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const {
    sidebarOpen,
    setSidebarOpen,
    showNotifications,
    setShowNotifications,
    isPaidVersion,
    isExpired,
    trialDaysLeft,
    notifications,
    handleLogout,
    currentUser,
    isServerOnline,
    t,
    themeColor
  } = useContext(AppContext);

  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleProfileClick = () => {
      setProfileOpen(false);
      if (currentUser?.linkedEmployeeId) {
          navigate(`/employees/${currentUser.linkedEmployeeId}`);
      } else {
          if (currentUser?.role === UserRole.ADMIN) {
              navigate('/settings');
          } else {
              alert('هذا المستخدم غير مرتبط بملف موظف.');
          }
      }
  };

  const handleNotificationClick = (notif: Notification) => {
      setShowNotifications(false);
      const title = notif.title.toLowerCase();
      const desc = notif.desc.toLowerCase();
      
      if (title.includes('إجازة') || desc.includes('إجازة')) navigate('/leaves');
      else if (title.includes('راتب') || desc.includes('راتب')) navigate('/payroll');
      else if (title.includes('عقد') || desc.includes('عقد')) navigate('/contracts');
      else if (title.includes('سلفة') || title.includes('جزاء') || desc.includes('سلفة') || desc.includes('جزاء')) navigate('/loans');
      else if (title.includes('صيانة') || title.includes('مركبة') || desc.includes('صيانة')) navigate('/transport');
      else if (title.includes('تقييم') || desc.includes('أداء')) navigate('/performance');
      else navigate('/'); 
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50 flex-col transition-colors duration-300 main-app-container">
      {!isPaidVersion && !isExpired && <TrialBanner daysLeft={trialDaysLeft} />}
      {isExpired && (
        <div className="bg-red-600 text-white px-4 py-3 text-center font-bold shadow-md z-50 flex items-center justify-center gap-2">
           <Lock className="h-5 w-5" />
           <span>{t('subscription')} منتهي.</span>
        </div>
      )}

      <div className="flex flex-1 relative">
        <div className="no-print z-30">
          <Sidebar 
            isOpen={sidebarOpen} 
            setIsOpen={setSidebarOpen} 
            userPermissions={currentUser?.permissions} 
            userRole={currentUser?.role}
            isExpired={isExpired} 
          />
        </div>
        <main className="flex-1 overflow-x-hidden relative w-full">
          {isExpired && location.pathname !== '/settings' && (
             <div className="absolute inset-0 bg-gray-100/95 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md border border-red-200">
                   <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="h-10 w-10 text-red-600" />
                   </div>
                   <h2 className="text-2xl font-bold text-gray-800 mb-2">النظام مغلق</h2>
                   <p className="text-gray-500 mb-6">يرجى تجديد الاشتراك.</p>
                   <button 
                      onClick={() => navigate('/settings')}
                      className={`bg-${themeColor}-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition`}
                   >
                      التفعيل
                   </button>
                </div>
             </div>
          )}

          <header className="sticky top-0 z-20 flex h-20 w-full items-center justify-between bg-white px-6 shadow-sm no-print">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"><Menu className="h-6 w-6" /></button>
              <div className="hidden md:block relative w-96">
                <Search className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder={t('search')} className={`w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 rtl:pr-10 rtl:pl-4 text-sm focus:border-${themeColor}-600 focus:bg-white focus:outline-none transition-all`} />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${isServerOnline ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}
              >
                 {isServerOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                 <span className="text-xs font-bold hidden sm:inline">{isServerOnline ? t('online') : t('offline')}</span>
              </div>

              <div className="h-8 w-px bg-gray-200 mx-1"></div>

              <div className="relative">
                <button onClick={() => { setShowNotifications(!showNotifications); setProfileOpen(false); }} className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors">
                  <Bell className="h-6 w-6" />
                  {notifications.filter(n => n.unread).length > 0 && (
                    <span className="absolute top-2 left-2 rtl:left-auto rtl:right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute left-0 rtl:left-0 rtl:right-auto mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/50">
                      <h3 className="font-bold text-gray-800">الإشعارات ({notifications.length})</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? notifications.map(notif => (
                        <div 
                            key={notif.id} 
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${notif.unread ? `bg-${themeColor}-50` : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1"><span className={`font-bold text-sm ${notif.unread ? `text-${themeColor}-600` : 'text-gray-700'}`}>{notif.title}</span><span className="text-[10px] text-gray-400">{notif.time}</span></div>
                          <p className="text-xs text-gray-500">{notif.desc}</p>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-gray-400 text-sm">لا توجد إشعارات جديدة</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="h-8 w-px bg-gray-200 mx-1"></div>
              <div className="relative">
                <div className="flex items-center gap-3 cursor-pointer p-1 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => { setProfileOpen(!profileOpen); setShowNotifications(false); }}>
                  <div className="text-left rtl:text-right hidden md:block"><p className="text-sm font-bold text-gray-800">{currentUser?.fullName || 'مستخدم'}</p><p className="text-xs text-green-600 font-medium">{currentUser?.role === UserRole.EMPLOYEE ? 'بوابة الموظف' : 'Online'}</p></div>
                  <UserCircle className="h-10 w-10 text-gray-400" />
                </div>
                {profileOpen && (
                  <div className="absolute left-0 rtl:left-0 rtl:right-auto top-14 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <button onClick={handleProfileClick} className="w-full text-right rtl:text-right px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">{t('profile')}</button>
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50"><LogOut className="h-4 w-4" /> {t('logout')}</button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(14);
  const [isPaidVersion, setIsPaidVersion] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: 'مرحباً بك', desc: 'تم تسجيل الدخول بنجاح للنظام', time: 'الآن', unread: true },
  ]);

  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'ar');
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => (localStorage.getItem('themeColor') as ThemeColor) || 'indigo');
  const [themeMode, setThemeMode] = useState<'light'|'dark'>(() => (localStorage.getItem('themeMode') as 'light'|'dark') || 'light');

  const t = (key: string) => {
    // @ts-ignore
    return translations[language][key] || key;
  };

  const colorMap: Record<ThemeColor, Record<string, string>> = {
    indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81' },
    emerald: { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b' },
    violet: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95' },
    rose: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337' },
    amber: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f' },
    slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' }
  };

  useEffect(() => {
    localStorage.setItem('language', language);
    localStorage.setItem('themeColor', themeColor);
    localStorage.setItem('themeMode', themeMode);

    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;

    const root = document.documentElement;
    const selected = colorMap[themeColor];
    const primaryShade = themeColor === 'slate' ? '800' : '600';
    const hoverShade = themeColor === 'slate' ? '900' : '700';

    root.style.setProperty('--primary-color', selected[primaryShade]);
    root.style.setProperty('--primary-hover', selected[hoverShade]);

    const styleId = 'dynamic-theme-style';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    
    styleTag.innerHTML = `
      :root { --theme-50: ${selected['50']}; --theme-100: ${selected['100']}; --theme-200: ${selected['200']}; --theme-300: ${selected['300']}; --theme-400: ${selected['400']}; --theme-500: ${selected['500']}; --theme-600: ${selected['600']}; --theme-700: ${selected['700']}; --theme-800: ${selected['800']}; --theme-900: ${selected['900']}; }
      body, .bg-gray-50, .bg-gray-50\\/50, .bg-slate-50 { background-color: var(--theme-50) !important; }
      ::selection { background-color: var(--theme-200); color: var(--theme-900); }
      ::-webkit-scrollbar-thumb { background-color: var(--theme-300) !important; }
      ::-webkit-scrollbar-thumb:hover { background-color: var(--theme-400) !important; }
      .bg-indigo-50 { background-color: var(--theme-50) !important; }
      .bg-indigo-100 { background-color: var(--theme-100) !important; }
      .bg-indigo-500 { background-color: var(--theme-500) !important; }
      .bg-indigo-600 { background-color: ${selected[primaryShade]} !important; }
      .bg-indigo-700 { background-color: ${selected[hoverShade]} !important; }
      .bg-indigo-800 { background-color: var(--theme-800) !important; }
      .bg-indigo-900 { background-color: var(--theme-900) !important; }
      .hover\\:bg-indigo-50:hover { background-color: var(--theme-50) !important; }
      .hover\\:bg-indigo-100:hover { background-color: var(--theme-100) !important; }
      .hover\\:bg-indigo-600:hover { background-color: ${selected[hoverShade]} !important; }
      .hover\\:bg-indigo-700:hover { background-color: var(--theme-800) !important; }
      .text-indigo-500 { color: var(--theme-500) !important; }
      .text-indigo-600 { color: ${selected[primaryShade]} !important; }
      .text-indigo-700 { color: ${selected[hoverShade]} !important; }
      .text-indigo-800 { color: var(--theme-800) !important; }
      .text-indigo-900 { color: var(--theme-900) !important; }
      .hover\\:text-indigo-600:hover { color: ${selected[primaryShade]} !important; }
      .hover\\:text-indigo-700:hover { color: ${selected[hoverShade]} !important; }
      .group:hover .group-hover\\:text-indigo-600 { color: ${selected[primaryShade]} !important; }
      .group:hover .group-hover\\:text-indigo-700 { color: ${selected[hoverShade]} !important; }
      .border-indigo-100 { border-color: var(--theme-100) !important; }
      .border-indigo-200 { border-color: var(--theme-200) !important; }
      .border-indigo-500 { border-color: var(--theme-500) !important; }
      .border-indigo-600 { border-color: ${selected[primaryShade]} !important; }
      .hover\\:border-indigo-200:hover { border-color: var(--theme-200) !important; }
      .hover\\:border-indigo-300:hover { border-color: var(--theme-300) !important; }
      .focus\\:ring-indigo-500:focus { --tw-ring-color: var(--theme-500) !important; }
      .ring-indigo-500 { --tw-ring-color: var(--theme-500) !important; }
      .from-indigo-600 { --tw-gradient-from: ${selected[primaryShade]} !important; var(--tw-gradient-stops): var(--tw-gradient-from), var(--tw-gradient-to) !important; }
      .to-indigo-700 { --tw-gradient-to: ${selected[hoverShade]} !important; }
      .to-indigo-800 { --tw-gradient-to: var(--theme-800) !important; }
      .to-purple-600 { --tw-gradient-to: var(--theme-500) !important; } 
    `;
  }, [language, themeColor, themeMode]);

  const addNotification = (title: string, desc: string) => {
    const newNotif: Notification = { id: Date.now(), title, desc, time: 'الآن', unread: true };
    setNotifications(prev => [newNotif, ...prev]);
  };

  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await api.checkHealth();
        setIsServerOnline(res.status === 'ok');
      } catch (e) {
        setIsServerOnline(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 15000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const validateSubscription = () => {
        const storedUser = localStorage.getItem('currentUser');
        const trialStart = localStorage.getItem('trialStart');
        const storedLicenseKey = localStorage.getItem('licenseKey');
        const deviceId = getDeviceId();
        
        let paidValid = false;
        let isNowExpired = false;

        if (storedLicenseKey) {
           const validation = validateLicenseKey(storedLicenseKey, deviceId);
           if (validation.isValid) {
              setIsPaidVersion(true);
              paidValid = true;
              if (validation.expiryDate) {
                 const today = new Date();
                 today.setHours(0, 0, 0, 0);
                 const expDate = new Date(validation.expiryDate);
                 if (today > expDate) isNowExpired = true;
              }
           } else {
              setIsPaidVersion(false);
           }
        } else {
           setIsPaidVersion(false);
        }

        if (!paidValid) {
            if (!trialStart) {
               localStorage.setItem('trialStart', new Date().toISOString());
               setTrialDaysLeft(14);
            } else {
               const startDate = new Date(trialStart);
               const today = new Date();
               const diffTime = Math.abs(today.getTime() - startDate.getTime());
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
               const left = 14 - diffDays;
               setTrialDaysLeft(left);
               if (left <= 0) isNowExpired = true;
            }
        }

        setIsExpired(isNowExpired);
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
    };

    validateSubscription();
    window.addEventListener('focus', validateSubscription);
    return () => window.removeEventListener('focus', validateSubscription);
  }, []);

  const handleLogin = (user: SystemUser) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    if (!localStorage.getItem('trialStart')) localStorage.setItem('trialStart', new Date().toISOString());
  };

  const handleLogout = () => { localStorage.removeItem('currentUser'); setCurrentUser(null); };

  const contextValue: AppContextType = {
    sidebarOpen, setSidebarOpen, showNotifications, setShowNotifications, isPaidVersion, isExpired, trialDaysLeft, notifications, addNotification, handleLogout, currentUser, isServerOnline,
    language, setLanguage, themeColor, setThemeColor, themeMode, setThemeMode, t
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <Routes>
          <Route path="/license-manager" element={<AdminKeyGenerator />} />
          <Route path="/" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Dashboard /></MainLayout></ProtectedRoute> : <Login onLogin={handleLogin} />} />
          <Route path="/employees" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Employees /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/employees/:id" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><EmployeeDetails /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/org-chart" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><OrgChart /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/shifts" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Shifts /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/recruitment" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Recruitment /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/attendance" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Attendance /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/contracts" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Contracts /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/insurance" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Insurance /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/leaves" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Leaves /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/payroll" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Payroll /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/loans" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Loans /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/reports" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Reports /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/transport" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Transport /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/performance" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Performance /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
          <Route path="/appearance" element={currentUser ? <MainLayout><Appearance /></MainLayout> : <Navigate to="/" />} />
          <Route path="/settings" element={currentUser ? <MainLayout><Settings /></MainLayout> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppContext.Provider>
  );
};

export default App;
)



--- START OF FILE src/constants.ts ---
(
import { Employee, EmploymentType, Candidate, ApplicationStatus, AttendanceRecord, Contract, ContractHistory, InsuranceRecord, LeaveRequest, PayrollRecord, LoanRecord, LeaveBalance, SystemUser, UserRole, SystemDatabase, Vehicle, Driver, Trip, MaintenanceLog, BiometricDevice, Shift, RoleDefinition, PerformanceReview, PayrollConfig } from './types';

export const DEFAULT_PAYROLL_CONFIG: PayrollConfig = {
  taxPercentage: 10,
  insuranceEmployeePercentage: 11, 
  insuranceCompanyPercentage: 18.75,
  housingAllowancePercentage: 0,
  transportAllowancePercentage: 0
};

export const MOCK_PERFORMANCE_REVIEWS: PerformanceReview[] = [
  {
    id: 'PR-001',
    employeeId: 'E001',
    employeeName: 'أحمد محمد علي',
    period: 'Q3 2023',
    totalScore: 92,
    status: 'approved',
    evaluationDate: '2023-10-01',
    kpis: [
      { id: 'K1', name: 'تسليم المشاريع في الوقت', targetValue: 5, actualValue: 5, weight: 40, score: 40, unit: 'Project' },
      { id: 'K2', name: 'جودة الكود (Bug Free)', targetValue: 95, actualValue: 98, weight: 30, score: 30, unit: '%' },
      { id: 'K3', name: 'العمل الجماعي', targetValue: 10, actualValue: 8, weight: 30, score: 24, unit: 'Rating' }
    ]
  },
  {
    id: 'PR-002',
    employeeId: 'E004',
    employeeName: 'منى كامل',
    period: 'Q3 2023',
    totalScore: 85,
    status: 'approved',
    evaluationDate: '2023-10-05',
    kpis: [
      { id: 'K1', name: 'تحقيق المبيعات', targetValue: 100000, actualValue: 95000, weight: 50, score: 47.5, unit: 'EGP' },
      { id: 'K2', name: 'رضا العملاء', targetValue: 5, actualValue: 4.5, weight: 30, score: 27, unit: 'Stars' },
      { id: 'K3', name: 'تقارير دورية', targetValue: 12, actualValue: 12, weight: 20, score: 20, unit: 'Report' }
    ]
  }
];

export const DEFAULT_ROLES: RoleDefinition[] = [
  { id: 'R1', name: UserRole.ADMIN, isSystem: true, permissions: ['dashboard', 'employees', 'org-chart', 'shifts', 'recruitment', 'transport', 'contracts', 'insurance', 'attendance', 'leaves', 'payroll', 'loans', 'reports', 'settings', 'performance'] },
  { id: 'R2', name: UserRole.HR_MANAGER, isSystem: true, permissions: ['dashboard', 'employees', 'org-chart', 'shifts', 'recruitment', 'contracts', 'insurance', 'attendance', 'leaves', 'reports', 'performance'] },
  { id: 'R3', name: UserRole.PAYROLL, isSystem: true, permissions: ['dashboard', 'attendance', 'payroll', 'loans', 'reports'] },
  { id: 'R4', name: UserRole.EMPLOYEE, isSystem: true, permissions: ['dashboard', 'attendance', 'leaves', 'loans', 'performance'] },
];

export const MOCK_SHIFTS: Shift[] = [
  { id: 'SH1', name: 'الوردية الصباحية', startTime: '08:00', endTime: '16:00', days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'SH2', name: 'الوردية المسائية', startTime: '16:00', endTime: '00:00', days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] },
  { id: 'SH3', name: 'وردية المصنع', startTime: '07:00', endTime: '19:00', days: ['السبت', 'الاثنين', 'الأربعاء'] },
];

export const MOCK_USERS: SystemUser[] = [
  { id: 'U1', username: 'admin', fullName: 'مدير النظام', role: UserRole.ADMIN, email: 'admin@company.com', active: true, lastLogin: '2023-10-25 09:00' },
  { id: 'U2', username: 'hr_manager', fullName: 'سارة يوسف', role: UserRole.HR_MANAGER, email: 'sara@company.com', active: true, lastLogin: '2023-10-25 08:30' },
  { id: 'U3', username: 'acc_payroll', fullName: 'محمد حسن', role: UserRole.PAYROLL, email: 'mohamed@company.com', active: true, lastLogin: '2023-10-24 16:00' },
  { id: 'U4', username: 'viewer', fullName: 'مراقب خارجي', role: UserRole.VIEWER, email: 'audit@external.com', active: false, lastLogin: '2023-10-01 10:00' },
];

export const MOCK_DATABASES: SystemDatabase[] = [
  { id: 'DB1', name: 'hr_main_db', companyName: 'الشركة الرئيسية', status: 'active', createdAt: '2022-01-01', usersCount: 15 },
  { id: 'DB2', name: 'hr_branch_alex', companyName: 'فرع الإسكندرية', status: 'active', createdAt: '2023-05-15', usersCount: 5 },
  { id: 'DB3', name: 'hr_archive_2021', companyName: 'أرشيف 2021', status: 'archived', createdAt: '2021-01-01', usersCount: 0 },
];

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'E001',
    employeeCode: 'EMP-1001',
    name: 'أحمد محمد علي',
    nationalId: '29010101234567',
    jobTitle: 'مهندس برمجيات',
    department: 'تكنولوجيا المعلومات',
    joinDate: '2022-03-15',
    salary: 15000,
    status: 'active',
    avatar: 'https://picsum.photos/id/1005/100/100',
    contractType: EmploymentType.FULL_TIME,
    contractStartDate: '2023-01-01',
    contractEndDate: '2024-01-01',
    shiftId: 'SH1',
    shiftName: 'الوردية الصباحية'
  },
  {
    id: 'E002',
    employeeCode: 'EMP-1002',
    name: 'سارة يوسف',
    nationalId: '29505051234567',
    jobTitle: 'مدير موارد بشرية',
    department: 'الموارد البشرية',
    joinDate: '2021-01-10',
    salary: 18000,
    status: 'active',
    avatar: 'https://picsum.photos/id/1011/100/100',
    contractType: EmploymentType.FULL_TIME,
    contractStartDate: '2021-01-10',
    contractEndDate: '-',
    shiftId: 'SH1',
    shiftName: 'الوردية الصباحية'
  },
  {
    id: 'E003',
    employeeCode: 'EMP-1003',
    name: 'خالد عمر',
    nationalId: '28809091234567',
    jobTitle: 'محاسب',
    department: 'المالية',
    joinDate: '2023-06-01',
    salary: 9000,
    status: 'on_leave',
    avatar: 'https://picsum.photos/id/1025/100/100',
    contractType: EmploymentType.CONTRACT,
    contractStartDate: '2023-06-01',
    contractEndDate: '2023-12-31',
    shiftId: 'SH1',
    shiftName: 'الوردية الصباحية'
  },
  {
    id: 'E004',
    employeeCode: 'EMP-1004',
    name: 'منى كامل',
    nationalId: '29212121234567',
    jobTitle: 'أخصائي تسويق',
    department: 'التسويق',
    joinDate: '2023-02-20',
    salary: 11000,
    status: 'active',
    avatar: 'https://picsum.photos/id/1027/100/100',
    contractType: EmploymentType.FULL_TIME,
    contractStartDate: '2023-02-20',
    contractEndDate: '2024-02-20',
    shiftId: 'SH2',
    shiftName: 'الوردية المسائية'
  },
  {
    id: 'E005',
    employeeCode: 'EMP-1005',
    name: 'سعيد الصاوي',
    nationalId: '28501011234567',
    jobTitle: 'سائق',
    department: 'النقل والحركة',
    joinDate: '2020-01-01',
    salary: 6000,
    status: 'active',
    avatar: 'https://picsum.photos/id/1060/100/100',
    contractType: EmploymentType.FULL_TIME,
    contractStartDate: '2023-01-01',
    contractEndDate: '2024-01-01',
    isDriver: true,
    driverLicenseNumber: 'DL-885522',
    driverLicenseExpiry: '2026-05-20',
    shiftId: 'SH3',
    shiftName: 'وردية المصنع'
  },
];

export const MOCK_CANDIDATES: Candidate[] = [
  { id: 'C01', name: 'ياسر جلال', position: 'مصمم جرافيك', experience: '3 سنوات', status: ApplicationStatus.APPLIED, rating: 0 },
  { id: 'C02', name: 'هدى حسين', position: 'محاسب', experience: '5 سنوات', status: ApplicationStatus.INTERVIEW, rating: 4 },
  { id: 'C03', name: 'رامي سعيد', position: 'مهندس برمجيات', experience: 'سنتين', status: ApplicationStatus.OFFER, rating: 5 },
  { id: 'C04', name: 'نور الشريف', position: 'مدير مبيعات', experience: '10 سنوات', status: ApplicationStatus.SCREENING, rating: 3 },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'A01', employeeId: 'E001', employeeName: 'أحمد محمد علي', date: '2023-10-25', checkIn: '08:00', checkOut: '16:00', status: 'present', workHours: 8, source: 'Fingerprint' },
  { id: 'A02', employeeId: 'E002', employeeName: 'سارة يوسف', date: '2023-10-25', checkIn: '08:15', checkOut: '16:15', status: 'present', workHours: 8, source: 'Fingerprint' },
  { id: 'A03', employeeId: 'E003', employeeName: 'خالد عمر', date: '2023-10-25', checkIn: '-', checkOut: '-', status: 'absent', workHours: 0, source: 'Manual' },
  { id: 'A04', employeeId: 'E004', employeeName: 'منى كامل', date: '2023-10-25', checkIn: '09:30', checkOut: '16:00', status: 'late', workHours: 6.5, source: 'Fingerprint' },
];

export const MOCK_DEVICES: BiometricDevice[] = [
  { id: 'DEV1', name: 'المدخل الرئيسي', ip: '192.168.1.201', port: '4370', type: 'ZK', location: 'الاستقبال', status: 'online', lastSync: '2023-10-25 08:05' },
  { id: 'DEV2', name: 'بوابة المصنع', ip: '192.168.1.202', port: '4370', type: 'Timy', location: 'المصنع', status: 'online', lastSync: '2023-10-25 08:00' },
  { id: 'DEV3', name: 'بوابة الإدارة', ip: '192.168.1.203', port: '5005', type: 'ZK', location: 'الدور الثاني', status: 'offline', lastSync: '2023-10-24 17:00' },
];

export const MOCK_CONTRACTS: Contract[] = [
  { id: 'CN01', employeeName: 'أحمد محمد علي', type: 'محدد المدة', startDate: '2023-01-01', endDate: '2024-01-01', status: 'expiring' },
  { id: 'CN02', employeeName: 'سارة يوسف', type: 'غير محدد المدة', startDate: '2021-01-10', endDate: '-', status: 'active' },
  { id: 'CN03', employeeName: 'خالد عمر', type: 'عمل مؤقت', startDate: '2023-06-01', endDate: '2023-12-31', status: 'active' },
];

export const MOCK_CONTRACT_HISTORY: ContractHistory[] = [
  { id: 'CH01', contractId: 'CN01', type: 'تجديد', details: 'تجديد العقد لمدة سنة', date: '2023-01-01', changedBy: 'Admin System' },
  { id: 'CH02', contractId: 'CN01', type: 'تعديل مسمى', details: 'تغيير المسمى الوظيفي إلى مهندس أول', date: '2023-06-01', changedBy: 'HR Manager' }
];

export const MOCK_INSURANCE: InsuranceRecord[] = [
  { id: 'INS01', employeeName: 'أحمد محمد علي', insuranceNumber: '11223344', salaryInsured: 5000, companyShare: 900, employeeShare: 550, status: 'active' },
  { id: 'INS02', employeeName: 'سارة يوسف', insuranceNumber: '55667788', salaryInsured: 6500, companyShare: 1170, employeeShare: 715, status: 'active' },
];

export const MOCK_LEAVES: LeaveRequest[] = [
  { id: 'L01', employeeName: 'خالد عمر', type: 'سنوي', startDate: '2023-11-01', endDate: '2023-11-05', days: 5, status: 'approved' },
  { id: 'L02', employeeName: 'منى كامل', type: 'مرضي', startDate: '2023-10-20', endDate: '2023-10-21', days: 2, status: 'pending' },
];

export const MOCK_LEAVE_BALANCES: LeaveBalance[] = [
  { employeeId: 'E001', employeeName: 'أحمد محمد علي', annualTotal: 21, annualUsed: 5, sickTotal: 10, sickUsed: 0, casualTotal: 7, casualUsed: 2 },
  { employeeId: 'E002', employeeName: 'سارة يوسف', annualTotal: 30, annualUsed: 12, sickTotal: 10, sickUsed: 1, casualTotal: 7, casualUsed: 0 },
  { employeeId: 'E003', employeeName: 'خالد عمر', annualTotal: 21, annualUsed: 20, sickTotal: 10, sickUsed: 3, casualTotal: 7, casualUsed: 5 },
  { employeeId: 'E004', employeeName: 'منى كامل', annualTotal: 21, annualUsed: 2, sickTotal: 10, sickUsed: 2, casualTotal: 7, casualUsed: 0 },
];

export const MOCK_PAYROLL: PayrollRecord[] = [
  { 
    id: 'P01', 
    employeeName: 'أحمد محمد علي', 
    basicSalary: 15000, 
    allowances: 2000, 
    transportAllowance: 0,
    incentives: 1500,
    deductions: 500, 
    netSalary: 18000, 
    paymentDate: '2023-10-30', 
    status: 'paid' 
  },
  { 
    id: 'P02', 
    employeeName: 'خالد عمر', 
    basicSalary: 9000, 
    allowances: 500, 
    transportAllowance: 0,
    incentives: 0,
    deductions: 0, 
    netSalary: 9500, 
    paymentDate: '2023-10-30', 
    status: 'pending' 
  },
  { 
    id: 'P03', 
    employeeName: 'سعيد الصاوي', 
    basicSalary: 6000, 
    allowances: 0, 
    transportAllowance: 1500, 
    incentives: 200,
    deductions: 0, 
    netSalary: 7700, 
    paymentDate: '2023-10-30', 
    status: 'pending' 
  },
];

export const MOCK_LOANS: LoanRecord[] = [
  { 
    id: 'LN01', employeeName: 'خالد عمر', type: 'سلفة', amount: 5000, date: '2023-08-15', 
    remainingAmount: 2000, status: 'active', requestStatus: 'approved', installments: 5, reason: 'زواج', approvedBy: 'Admin' 
  },
  { 
    id: 'LN02', employeeName: 'منى كامل', type: 'جزاء', amount: 200, date: '2023-09-10', 
    remainingAmount: 0, status: 'completed', requestStatus: 'approved', reason: 'تأخير متكرر', approvedBy: 'Admin' 
  },
  { 
    id: 'LN03', employeeName: 'أحمد محمد علي', type: 'سلفة', amount: 3000, date: '2023-10-26', 
    remainingAmount: 3000, status: 'pending', requestStatus: 'pending', installments: 3, reason: 'ظروف طارئة' 
  },
  { 
    id: 'LN04', employeeName: 'سارة يوسف', type: 'جزاء', amount: 150, date: '2023-10-27', 
    remainingAmount: 150, status: 'pending', requestStatus: 'pending', reason: 'عدم الالتزام بالزي' 
  }
];

// --- Transport Mock Data ---

export const MOCK_VEHICLES: Vehicle[] = [
  { 
    id: 'V01', 
    plateNumber: 'أ ب ج 123', 
    type: 'سيارة', 
    model: 'تويوتا كورولا 2022', 
    status: 'active', 
    licenseExpiry: '2025-01-01', 
    currentOdometer: 25000,
    gps: { lat: 30.0444, lng: 31.2357, lastUpdate: 'الآن', speed: 45, address: 'وسط البلد، القاهرة' } 
  },
  { 
    id: 'V02', 
    plateNumber: 'س ص ع 456', 
    type: 'باص', 
    model: 'ميتسوبيشي روزا 2020', 
    status: 'maintenance', 
    licenseExpiry: '2024-12-15', 
    currentOdometer: 150000,
    gps: { lat: 30.0131, lng: 31.2089, lastUpdate: 'منذ 5 دقائق', speed: 0, address: 'الجيزة، الورشة المركزية' }
  },
  { 
    id: 'V03', 
    plateNumber: 'د هـ و 789', 
    type: 'شاحنة', 
    model: 'مرسيدس اكتروس', 
    status: 'active', 
    licenseExpiry: '2025-06-30', 
    currentOdometer: 340000,
    gps: { lat: 31.2001, lng: 29.9187, lastUpdate: 'الآن', speed: 80, address: 'طريق الإسكندرية الصحراوي' }
  },
];

export const MOCK_DRIVERS: Driver[] = [
  { id: 'D01', employeeId: 'E005', employeeName: 'سعيد الصاوي', licenseNumber: 'DL-885522', licenseType: 'درجة أولى', licenseExpiry: '2026-05-20', status: 'active' },
];

export const MOCK_TRIPS: Trip[] = [
  { id: 'T01', date: '2023-10-25', vehicleId: 'V01', plateNumber: 'أ ب ج 123', driverId: 'D01', driverName: 'سعيد الصاوي', startOdometer: 25000, endOdometer: 25150, distance: 150, route: 'القاهرة - الإسكندرية', status: 'completed' },
];

export const MOCK_MAINTENANCE: MaintenanceLog[] = [
  { id: 'M01', vehicleId: 'V02', plateNumber: 'س ص ع 456', date: '2023-10-20', description: 'تغيير زيت وفلاتر', cost: 1500, type: 'تغيير زيت', status: 'approved', createdBy: 'Admin', approvedBy: 'Manager' },
  { id: 'M02', vehicleId: 'V01', plateNumber: 'أ ب ج 123', date: '2023-10-26', description: 'صيانة دورية 30 ألف', cost: 3000, type: 'دورية', status: 'pending', createdBy: 'سعيد الصاوي' },
];

export const DEPARTMENTS = ['الموارد البشرية', 'المالية', 'تكنولوجيا المعلومات', 'التسويق', 'المبيعات', 'العمليات', 'النقل والحركة'];
)



--- START OF FILE src/index.tsx ---
(import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);)




--- START OF FILE src/translations.ts ---
(
export const translations = {
  ar: {
    // Menu
    dashboard: 'لوحة التحكم',
    employees: 'الموظفين',
    orgChart: 'الهيكل التنظيمي',
    shifts: 'إدارة الورديات',
    recruitment: 'التوظيف',
    transport: 'إدارة النقل',
    contracts: 'العقود',
    insurance: 'التأمينات',
    attendance: 'الحضور والانصراف',
    leaves: 'الإجازات',
    payroll: 'الرواتب',
    loans: 'السلف والخصومات',
    reports: 'التقارير',
    settings: 'الإعدادات',
    performance: 'إدارة الأداء', 
    
    // General
    welcome: 'مرحباً',
    search: 'بحث سريع...',
    logout: 'تسجيل الخروج',
    profile: 'الملف الشخصي',
    online: 'متصل',
    offline: 'غير متصل',
    serverOnline: 'الخادم متصل',
    serverOffline: 'الخادم غير متصل',
    
    // Settings
    systemSettings: 'إعدادات النظام',
    appearance: 'المظهر واللغة',
    companyInfo: 'بيانات الشركة',
    users: 'المستخدمين',
    roles: 'الأدوار',
    databases: 'قواعد البيانات',
    security: 'الأمان',
    backup: 'النسخ الاحتياطي',
    subscription: 'الاشتراك',
    departments: 'الأقسام',
    payrollConfig: 'إعدادات الرواتب', 
    
    // Theme & Language
    language: 'لغة الواجهة',
    themeColor: 'لون النظام',
    themeMode: 'وضع العرض',
    light: 'فاتح',
    dark: 'داكن',
    blue: 'أزرق (افتراضي)',
    green: 'زمردي',
    purple: 'بنفسجي',
    red: 'أحمر',
    orange: 'برتقالي',
    black: 'داكن / رمادي',
    
    save: 'حفظ التغييرات'
  },
  en: {
    // Menu
    dashboard: 'Dashboard',
    employees: 'Employees',
    orgChart: 'Org Chart',
    shifts: 'Shifts',
    recruitment: 'Recruitment',
    transport: 'Fleet',
    contracts: 'Contracts',
    insurance: 'Insurance',
    attendance: 'Attendance',
    leaves: 'Leaves',
    payroll: 'Payroll',
    loans: 'Loans',
    reports: 'Reports',
    settings: 'Settings',
    performance: 'Performance', 

    // General
    welcome: 'Welcome',
    search: 'Quick Search...',
    logout: 'Logout',
    profile: 'Profile',
    online: 'Online',
    offline: 'Offline',
    serverOnline: 'Server Online',
    serverOffline: 'Server Offline',

    // Settings
    systemSettings: 'System Settings',
    appearance: 'Appearance',
    companyInfo: 'Company Info',
    users: 'Users',
    roles: 'Roles',
    databases: 'Databases',
    security: 'Security',
    backup: 'Backup',
    subscription: 'Subscription',
    departments: 'Departments',
    payrollConfig: 'Payroll Config', 

    // Theme & Language
    language: 'Interface Language',
    themeColor: 'System Color',
    themeMode: 'Display Mode',
    light: 'Light',
    dark: 'Dark',
    blue: 'Blue (Default)',
    green: 'Emerald',
    purple: 'Purple',
    red: 'Red',
    orange: 'Orange',
    black: 'Slate / Dark',

    save: 'Save Changes'
  }
};

export type Language = 'ar' | 'en';
export type ThemeColor = 'indigo' | 'emerald' | 'violet' | 'rose' | 'amber' | 'slate';
)




--- START OF FILE src/types.ts ---
(
import { Language, ThemeColor } from './translations';

export enum EmploymentType {
  FULL_TIME = 'دوام كامل',
  PART_TIME = 'دوام جزئي',
  CONTRACT = 'عقد محدد',
}

export enum ApplicationStatus {
  APPLIED = 'جديد',
  SCREENING = 'فرز',
  INTERVIEW = 'مقابلة',
  OFFER = 'عرض عمل',
  HIRED = 'تم التعيين',
  REJECTED = 'مرفوض',
}

export enum UserRole {
  ADMIN = 'مدير النظام',
  HR_MANAGER = 'مدير موارد بشرية',
  PAYROLL = 'محاسب رواتب',
  EMPLOYEE = 'موظف',
  VIEWER = 'قراءة فقط'
}

// --- Performance Module ---
export interface KPI {
  id: string;
  name: string;
  targetValue: number;
  actualValue: number;
  weight: number; 
  score: number; 
  unit: string; 
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string; 
  kpis: KPI[];
  totalScore: number;
  status: 'draft' | 'submitted' | 'approved';
  feedback?: string;
  evaluationDate: string;
}

// --- Payroll Config ---
export interface PayrollConfig {
  taxPercentage: number;
  insuranceCompanyPercentage: number;
  insuranceEmployeePercentage: number;
  housingAllowancePercentage: number;
  transportAllowancePercentage: number;
}

export interface RoleDefinition {
  id: string;
  name: string; 
  isSystem?: boolean; 
  permissions: string[]; 
}

export interface SystemUser {
  id: string;
  username: string;
  fullName: string;
  role: string; 
  email: string;
  active: boolean;
  lastLogin: string;
  permissions?: string[];
  linkedEmployeeId?: string; 
}

export interface SystemDatabase {
  id: string;
  name: string;
  companyName: string;
  status: 'active' | 'archived';
  createdAt: string;
  usersCount: number;
}

// --- Shift Management ---
export interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  days: string[];    // Array of days e.g. ['Sunday', 'Monday']
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  nationalId: string;
  jobTitle: string;
  department: string;
  joinDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'on_leave';
  avatar: string;
  contractType: EmploymentType;
  contractStartDate?: string;
  contractEndDate?: string;
  endOfServiceDate?: string;
  shiftId?: string; // Link to Shift
  shiftName?: string; // Denormalized for display
  managerId?: string; // Link to another Employee (Direct Manager)
  isDriver?: boolean;
  driverLicenseNumber?: string;
  driverLicenseExpiry?: string;
  certificates?: { 
    id: string;
    name: string; 
    date: string; 
    fileName?: string;
    fileUrl?: string; 
  }[];
  documents?: {
    id: string;
    name: string;
    type: string;
    size: string;
    date: string;
    fileUrl?: string;
  }[];
  contractFile?: {
    fileName: string;
    fileUrl: string;
  };
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  workHours: number;
  employeeCode?: string;
  source?: 'Fingerprint' | 'Manual' | 'Mobile';
}

export interface BiometricDevice {
  id: string;
  name: string;
  ip: string;
  port: string;
  type: 'ZK' | 'Timy' | 'Hikvision' | 'Other';
  location: string;
  status: 'online' | 'offline';
  lastSync: string;
}

export interface Candidate {
  id: string;
  name: string;
  position: string;
  experience: string;
  status: ApplicationStatus;
  rating: number; 
}

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
}

export interface Contract {
  id: string;
  employeeName: string;
  type: 'محدد المدة' | 'غير محدد المدة' | 'عمل مؤقت';
  startDate: string;
  endDate: string;
  status: 'active' | 'expiring' | 'expired';
  fileUrl?: string;
}

export interface ContractHistory {
  id: string;
  contractId: string;
  type: string;
  details: string;
  date: string;
  changedBy: string;
  documentUrl?: string;
}

export interface InsuranceRecord {
  id: string;
  employeeName: string;
  insuranceNumber: string;
  salaryInsured: number;
  companyShare: number;
  employeeShare: number;
  status: 'active' | 'pending';
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  type: 'سنوي' | 'مرضي' | 'عارضة' | 'بدون راتب';
  startDate: string;
  endDate: string;
  days: number;
  status: 'approved' | 'pending' | 'rejected' | 'reviewed';
  reviewedBy?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface LeaveBalance {
  employeeId: string;
  employeeName: string;
  annualTotal: number;
  annualUsed: number;
  sickTotal: number;
  sickUsed: number;
  casualTotal: number;
  casualUsed: number;
}

export interface PayrollRecord {
  id: string;
  employeeName: string;
  basicSalary: number;
  allowances: number;
  transportAllowance: number;
  incentives: number;
  deductions: number;
  netSalary: number;
  paymentDate: string;
  status: 'paid' | 'pending' | 'reviewed';
  auditedBy?: string;   
  approvedBy?: string;  
}

export interface LoanRecord {
  id: string;
  employeeName: string;
  type: 'سلفة' | 'خصم إداري' | 'جزاء';
  amount: number;
  date: string;
  remainingAmount: number;
  status: 'active' | 'completed' | 'pending';
  installments?: number;
  reason?: string;
  requestStatus?: 'pending' | 'approved' | 'rejected' | 'reviewed';
  reviewedBy?: string;
  approvedBy?: string;
}

export interface GpsLocation {
  lat: number;
  lng: number;
  lastUpdate: string;
  speed: number;
  address?: string;
  fuelLevel?: number; // 0 - 100%
  ignition?: 'on' | 'off';
  batteryVoltage?: number;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: 'سيارة' | 'شاحنة' | 'باص';
  model: string;
  status: 'active' | 'maintenance' | 'broken';
  licenseExpiry: string;
  currentOdometer: number;
  gps?: GpsLocation;
}

export interface Driver {
  id: string;
  employeeId: string;
  employeeName: string;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  status: 'active' | 'suspended';
}

export interface Trip {
  id: string;
  date: string;
  vehicleId: string;
  plateNumber: string;
  driverId: string;
  driverName: string;
  startOdometer: number;
  endOdometer: number;
  distance: number;
  route: string;
  status: 'completed' | 'active';
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  plateNumber: string;
  date: string;
  description: string;
  cost: number;
  type: 'دورية' | 'إصلاح' | 'تغيير زيت';
  invoiceUrl?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
}

export interface Notification {
  id: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

export interface AppContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  isPaidVersion: boolean;
  isExpired: boolean; 
  trialDaysLeft: number;
  notifications: Notification[];
  addNotification: (title: string, desc: string) => void;
  handleLogout: () => void;
  currentUser: SystemUser | null;
  isServerOnline: boolean;
  
  // Theme & Language
  language: Language;
  setLanguage: (lang: Language) => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  t: (key: string) => string;
}
)



--- START OF FILE src/services/api.ts ---
(
// src/services/api.ts
import { Employee, AttendanceRecord } from '../types';

// Get Base URL
export const getBaseUrl = () => {
  // في بيئة الإنتاج، نستخدم مسار نسبي ليتم الاتصال بنفس الدومين/السيرفر
  // مثلا لو السيرفر 192.168.1.50، الطلب يروح لـ 192.168.1.50/api تلقائياً
  if (process.env.NODE_ENV === 'production' || window.location.port === '5000') {
      return '/api';
  }
  // في بيئة التطوير
  const savedUrl = localStorage.getItem('server_url');
  return savedUrl ? savedUrl.replace(/\/$/, '') : 'http://localhost:5000/api';
};

// Helper function for requests
const request = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || response.statusText);
    }

    return await response.json();
  } catch (error: any) {
    if (endpoint !== '/health') {
        console.warn(`Backend request failed for ${endpoint}:`, error);
    }
    throw error;
  }
};

export const api = {
  // System Health
  checkHealth: () => request('/health'),

  // --- Employees ---
  getEmployees: () => request('/employees'),
  
  saveEmployee: (employee: Employee) => request('/employees', {
      method: 'POST',
      body: JSON.stringify(employee)
  }),

  deleteEmployee: (id: string) => request(`/employees/${id}`, {
      method: 'DELETE'
  }),

  // --- Attendance ---
  getAttendance: (date?: string) => request(`/attendance${date ? `?date=${date}` : ''}`),
  
  saveAttendanceBatch: (records: AttendanceRecord[]) => request('/attendance/batch', {
      method: 'POST',
      body: JSON.stringify(records)
  }),

  // Sync Attendance from Device
  syncAttendance: (deviceIp: string, devicePort: string, deviceType: string, date: string) => 
    request('/attendance/sync', {
      method: 'POST',
      body: JSON.stringify({ ip: deviceIp, port: devicePort, type: deviceType, date: date }),
    }),

  // --- Network/GPS ---
  getVehiclesLocation: () => request('/transport/vehicles'),
  scanForDevices: () => request('/network/scan'),
};
)




--- START OF FILE src/types.ts ---
(ضع كود الملف الخاص بك هنا بالكامل)





--- START OF FILE src/types.ts ---
(ضع كود الملف الخاص بك هنا بالكامل)






