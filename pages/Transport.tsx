
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_VEHICLES, MOCK_DRIVERS, MOCK_TRIPS, MOCK_MAINTENANCE } from '../constants';
import { Vehicle, Driver, Trip, MaintenanceLog } from '../types';
import { Car, Users, Map as MapIcon, Wrench, Plus, Search, Navigation, MapPin, Activity, Radio, X, CheckCircle, Zap, Gauge, Fuel, AlertTriangle, PlayCircle, Smartphone, FileText, Pencil, Trash2, CreditCard, Calendar } from 'lucide-react';
import DataControls from '../components/DataControls';

const Transport: React.FC = () => {
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
     return saved ? JSON.parse(saved) : MOCK_MAINTENANCE;
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Modals State
  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const [isLinkGpsModalOpen, setIsLinkGpsModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  // GPS State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

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

  const [newMaint, setNewMaint] = useState({ vehicleId: '', cost: 0, desc: '' });

  const isAdmin = true;

  // Save to LocalStorage
  useEffect(() => { localStorage.setItem('transport_vehicles', JSON.stringify(vehicles)); }, [vehicles]);
  useEffect(() => { localStorage.setItem('transport_drivers', JSON.stringify(drivers)); }, [drivers]);
  useEffect(() => { localStorage.setItem('transport_trips', JSON.stringify(trips)); }, [trips]);
  useEffect(() => { localStorage.setItem('transport_maintenance', JSON.stringify(maintenanceLogs)); }, [maintenanceLogs]);

  // --- Simulation Effect (GPS Movement) ---
  useEffect(() => {
     if (activeTab === 'gps') {
        const interval = setInterval(() => {
           setVehicles(prevVehicles => prevVehicles.map(v => {
              if (v.gps && v.gps.speed > 0) {
                 const latChange = (Math.random() - 0.5) * 0.001;
                 const lngChange = (Math.random() - 0.5) * 0.001;
                 const speedChange = Math.floor((Math.random() - 0.5) * 10);
                 let newSpeed = v.gps.speed + speedChange;
                 if (newSpeed < 0) newSpeed = 0;
                 if (newSpeed > 120) newSpeed = 120;

                 return {
                    ...v,
                    gps: {
                       ...v.gps,
                       lat: v.gps.lat + latChange,
                       lng: v.gps.lng + lngChange,
                       speed: newSpeed,
                       lastUpdate: new Date().toLocaleTimeString('ar-EG')
                    }
                 };
              }
              return v;
           }));
        }, 2000);
        return () => clearInterval(interval);
     }
  }, [activeTab]);

  // --- Handlers ---

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
      // Update existing
      setVehicles(vehicles.map(v => v.id === editingVehicleId ? {
        ...v,
        plateNumber: newVehicleForm.plateNumber,
        model: newVehicleForm.model,
        type: newVehicleForm.type,
        currentOdometer: Number(newVehicleForm.currentOdometer),
        licenseExpiry: newVehicleForm.licenseExpiry
      } : v));
      window.alert('تم تحديث بيانات المركبة بنجاح');
    } else {
      // Add new
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
      window.alert('تم إضافة المركبة بنجاح');
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
    window.alert('تم إضافة السائق بنجاح');
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
                 address: 'تم ربط الجهاز - جاري تحديد الموقع' 
              }
           };
        }
        return v;
     });
     setVehicles(updatedVehicles);
     setIsLinkGpsModalOpen(false);
     setGpsLinkForm({ vehicleId: '', deviceId: '', provider: 'Teltonika' });
     window.alert('تم ربط جهاز التتبع بنجاح وتشغيل الخدمة');
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
        type: 'إصلاح'
    };
    setMaintenanceLogs([log, ...maintenanceLogs]);
    setIsAddMaintenanceOpen(false);
    window.alert('تم تسجيل الصيانة');
  };

  const handleImportVehicles = (data: any[]) => {
      setVehicles([...vehicles, ...data.map((d, i) => ({...d, id: `IMP-V-${i}`}))]);
  };

  const jumpToMaintenance = (plateNumber: string) => {
     setSearchTerm(plateNumber);
     setActiveTab('maintenance');
  };

  const handlePrintMaintenance = () => {
    // Filter based on current search term
    const filteredLogs = maintenanceLogs.filter(log => log.plateNumber.includes(searchTerm) || log.description.includes(searchTerm));
    const totalCost = filteredLogs.reduce((a,c) => a + c.cost, 0);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('الرجاء السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير الصيانة - نظام النقل</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: right; }
            th { background-color: #f8fafc; font-weight: 700; color: #1e293b; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .total { margin-top: 20px; text-align: left; font-size: 18px; font-weight: bold; background: #f0fdf4; padding: 15px; border: 1px solid #bbf7d0; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير سجلات الصيانة</h1>
            <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>المركبة</th>
                <th>التاريخ</th>
                <th>نوع الصيانة</th>
                <th>التفاصيل</th>
                <th>التكلفة</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs.map(log => `
                <tr>
                  <td>${log.plateNumber}</td>
                  <td>${log.date}</td>
                  <td>${log.type}</td>
                  <td>${log.description}</td>
                  <td>${log.cost.toLocaleString()} ج.م</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
             إجمالي التكاليف: <span style="color: #166534">${totalCost.toLocaleString()} ج.م</span>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getMapPosition = (lat: number, lng: number) => {
     // Center of Cairo roughly
     const baseLat = 30.0;
     const baseLng = 31.2;
     // Scale factor
     const y = (lat - baseLat) * 1000; 
     const x = (lng - baseLng) * 1000;
     // Clamp to keep inside box roughly
     const top = Math.min(Math.max(50 - y, 5), 95);
     const left = Math.min(Math.max(50 + x, 5), 95);
     return { top: `${top}%`, left: `${left}%` };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">إدارة النقل والحركة</h2>
        <p className="text-sm text-gray-500">إدارة أسطول المركبات، السائقين، الرحلات، والصيانة</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-xl overflow-x-auto">
        <button onClick={() => setActiveTab('vehicles')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'vehicles' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Car className="h-5 w-5" />المركبات</button>
        <button onClick={() => setActiveTab('drivers')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'drivers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Users className="h-5 w-5" />السائقين</button>
        <button onClick={() => setActiveTab('trips')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'trips' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><MapIcon className="h-5 w-5" />الرحلات</button>
        <button onClick={() => setActiveTab('maintenance')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'maintenance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Wrench className="h-5 w-5" />الصيانة</button>
        <button onClick={() => setActiveTab('gps')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'gps' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Navigation className="h-5 w-5" />تتبع (GPS)</button>
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
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {vehicles.filter(v => v.plateNumber.includes(searchTerm) || v.model.includes(searchTerm)).map(v => (
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
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* --- GPS TRACKING TAB --- */}
         {activeTab === 'gps' && (
            <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
               {/* Vehicles List */}
               <div className="w-full lg:w-1/3 bg-gray-50 rounded-xl border border-gray-200 p-4 overflow-y-auto flex flex-col">
                  <div className="flex justify-between items-center mb-4 shrink-0">
                     <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-red-600" />
                        حالة الأسطول
                     </h3>
                     {/* زر ربط جهاز التتبع */}
                     <button 
                        onClick={() => setIsLinkGpsModalOpen(true)}
                        className="text-xs bg-indigo-600 text-white border border-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors font-medium shadow-sm"
                     >
                        <Smartphone className="h-3 w-3" /> ربط جهاز تتبع
                     </button>
                  </div>
                  
                  <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                     {vehicles.map(v => (
                        <div 
                           key={v.id} 
                           onClick={() => v.gps && setSelectedVehicleId(v.id === selectedVehicleId ? null : v.id)}
                           className={`
                              bg-white p-3 rounded-lg shadow-sm border cursor-pointer transition-all
                              ${v.id === selectedVehicleId ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-300'}
                              ${!v.gps ? 'opacity-70' : ''}
                           `}
                        >
                           <div className="flex justify-between items-start">
                              <div>
                                 <p className="font-bold text-sm text-gray-800">{v.model}</p>
                                 <p className="text-xs text-gray-500 font-mono">{v.plateNumber}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                 {v.gps ? (
                                    <span className={`text-[10px] px-1.5 rounded border ${v.gps.speed > 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>
                                       {v.gps.speed > 0 ? 'متحرك' : 'متوقف'}
                                    </span>
                                 ) : (
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded">غير مفعل</span>
                                 )}
                              </div>
                           </div>
                           {v.gps && (
                              <div className="mt-3 pt-2 border-t border-gray-200/50 text-xs text-gray-600 space-y-1.5">
                                 <div className="flex justify-between">
                                    <span>السرعة:</span>
                                    <span className="font-mono font-bold text-indigo-600">{v.gps.speed} km/h</span>
                                 </div>
                                 <div className="flex justify-between">
                                    <span>الموقع:</span>
                                    <span className="truncate max-w-[150px]">{v.gps.address}</span>
                                 </div>
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>

               {/* Simulated Map Area */}
               <div className="flex-1 bg-slate-200 rounded-xl border border-gray-200 relative overflow-hidden group" ref={mapRef}>
                  {/* Background - Fallback Grid + Image */}
                  <div className="absolute inset-0" style={{
                     backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
                     backgroundSize: '20px 20px',
                     opacity: 0.3
                  }}></div>
                  <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Cairo_downtown_map.png')] bg-cover bg-center opacity-70 grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"></div>
                  
                  {/* Geofence Visual (Simulated) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-2 border-dashed border-green-500 rounded-full opacity-20 pointer-events-none"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-700 text-xs font-bold opacity-40 pointer-events-none mt-48">منطقة آمنة (Geofence)</div>

                  {/* Map Markers */}
                  {vehicles.map((v, idx) => v.gps && (
                     <div 
                        key={v.id} 
                        className={`absolute flex flex-col items-center transition-all duration-1000 ease-in-out z-10`}
                        style={getMapPosition(v.gps.lat, v.gps.lng)}
                        onClick={() => setSelectedVehicleId(v.id)}
                     >
                        <div className="relative group/marker cursor-pointer">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-transform ${
                              v.id === selectedVehicleId ? 'bg-red-600 scale-110 ring-4 ring-red-200' : 
                              v.gps.speed > 0 ? 'bg-indigo-600' : 'bg-gray-600'
                           }`}>
                              <Car className="h-5 w-5" />
                           </div>
                           {/* Pulse Effect */}
                           {v.gps.speed > 0 && <div className="absolute -inset-2 bg-indigo-500 rounded-full opacity-20 animate-ping pointer-events-none"></div>}
                           
                           {/* Tooltip on Map */}
                           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/marker:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg z-20">
                              {v.plateNumber} - {v.gps.speed} km/h
                           </div>
                        </div>
                     </div>
                  ))}

                  {/* Selected Vehicle Status Card Overlay */}
                  {selectedVehicleId && (
                     <div className="absolute bottom-6 right-6 left-6 md:left-auto md:w-80 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-4 z-20">
                        {(() => {
                           const v = vehicles.find(veh => veh.id === selectedVehicleId);
                           if (!v || !v.gps) return null;
                           return (
                              <>
                                 <div className="flex justify-between items-start mb-4">
                                    <div>
                                       <h3 className="font-bold text-gray-900 text-lg">{v.model}</h3>
                                       <p className="text-gray-500 font-mono text-sm">{v.plateNumber}</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedVehicleId(null); }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                                 </div>

                                 <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                                       <Gauge className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
                                       <p className="text-xs text-gray-500">السرعة</p>
                                       <p className="font-bold font-mono">{v.gps.speed} km/h</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                                       <Fuel className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                                       <p className="text-xs text-gray-500">الوقود</p>
                                       <p className="font-bold font-mono">75%</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                                       <Zap className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                                       <p className="text-xs text-gray-500">المحرك</p>
                                       <p className="font-bold">{v.gps.speed > 0 ? 'يعمل' : 'متوقف'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                                       <Activity className="h-5 w-5 text-green-600 mx-auto mb-1" />
                                       <p className="text-xs text-gray-500">الحالة</p>
                                       <p className="font-bold text-green-600">متصل</p>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span className="truncate">{v.gps.address}</span>
                                 </div>
                                 
                                 <button className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                                    <PlayCircle className="h-4 w-4" />
                                    عرض مسار الرحلة
                                 </button>
                              </>
                           );
                        })()}
                     </div>
                  )}
                  
                  <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur p-2 rounded-lg shadow text-[10px] text-gray-500">
                     Simulated Map View (Cairo)
                  </div>
               </div>

               {/* Link GPS Device Modal */}
               {isLinkGpsModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                     <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                           <h3 className="font-bold text-gray-800 flex items-center gap-2">
                              <Smartphone className="h-5 w-5 text-indigo-600" />
                              ربط جهاز تتبع جديد
                           </h3>
                           <button onClick={() => setIsLinkGpsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleLinkGpsDevice} className="p-5 space-y-4">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">المركبة</label>
                              <select 
                                 className="w-full p-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                 value={gpsLinkForm.vehicleId}
                                 onChange={e => setGpsLinkForm({...gpsLinkForm, vehicleId: e.target.value})}
                                 required
                              >
                                 <option value="">اختر المركبة...</option>
                                 {vehicles.filter(v => !v.gps).map(v => (
                                    <option key={v.id} value={v.id}>{v.plateNumber} - {v.model}</option>
                                 ))}
                              </select>
                              {vehicles.filter(v => !v.gps).length === 0 && (
                                 <p className="text-xs text-green-600 mt-1">جميع المركبات مرتبطة بأجهزة بالفعل.</p>
                              )}
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجهاز (Serial/IMEI)</label>
                              <input 
                                 type="text" 
                                 className="w-full p-2.5 rounded-lg border border-gray-300 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                 placeholder="Ex: 865432109876543"
                                 value={gpsLinkForm.deviceId}
                                 onChange={e => setGpsLinkForm({...gpsLinkForm, deviceId: e.target.value})}
                                 required
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">مزود الخدمة</label>
                              <select 
                                 className="w-full p-2.5 rounded-lg border border-gray-300 text-sm bg-white"
                                 value={gpsLinkForm.provider}
                                 onChange={e => setGpsLinkForm({...gpsLinkForm, provider: e.target.value})}
                              >
                                 <option value="Teltonika">Teltonika</option>
                                 <option value="Ruptela">Ruptela</option>
                                 <option value="Concox">Concox</option>
                                 <option value="Queclink">Queclink</option>
                              </select>
                           </div>
                           <button 
                              type="submit" 
                              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm mt-2"
                              disabled={vehicles.filter(v => !v.gps).length === 0}
                           >
                              تفعيل وربط الجهاز
                           </button>
                        </form>
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
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">موديل المركبة</label>
                    <input 
                       type="text" required 
                       className="w-full p-2 rounded-lg border border-gray-300"
                       placeholder="مثال: تويوتا كورولا 2024"
                       value={newVehicleForm.model}
                       onChange={e => setNewVehicleForm({...newVehicleForm, model: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم اللوحة</label>
                    <input 
                       type="text" required 
                       className="w-full p-2 rounded-lg border border-gray-300 font-mono text-center"
                       placeholder="أ ب ج 123"
                       value={newVehicleForm.plateNumber}
                       onChange={e => setNewVehicleForm({...newVehicleForm, plateNumber: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                       <select 
                          className="w-full p-2 rounded-lg border border-gray-300"
                          value={newVehicleForm.type}
                          onChange={e => setNewVehicleForm({...newVehicleForm, type: e.target.value as any})}
                       >
                          <option value="سيارة">سيارة</option>
                          <option value="باص">باص</option>
                          <option value="شاحنة">شاحنة</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">قراءة العداد</label>
                       <input 
                          type="number" 
                          className="w-full p-2 rounded-lg border border-gray-300"
                          value={newVehicleForm.currentOdometer}
                          onChange={e => setNewVehicleForm({...newVehicleForm, currentOdometer: Number(e.target.value)})}
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ انتهاء الرخصة</label>
                    <input 
                       type="date" required 
                       className="w-full p-2 rounded-lg border border-gray-300"
                       value={newVehicleForm.licenseExpiry}
                       onChange={e => setNewVehicleForm({...newVehicleForm, licenseExpiry: e.target.value})}
                    />
                 </div>
                 <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition mt-2">
                    {editingVehicleId ? 'حفظ التعديلات' : 'حفظ المركبة'}
                 </button>
              </form>
           </div>
        </div>
      )}
      
      {/* Add Driver Modal - NEWLY ADDED */}
      {isAddDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800">تعيين سائق جديد</h3>
                 <button onClick={() => setIsAddDriverModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleAddDriver} className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم السائق (الموظف)</label>
                    <div className="relative">
                       <input 
                          type="text" required 
                          className="w-full p-2 pl-9 rounded-lg border border-gray-300"
                          placeholder="الاسم الكامل"
                          value={newDriverForm.employeeName}
                          onChange={e => setNewDriverForm({...newDriverForm, employeeName: e.target.value})}
                       />
                       <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم الرخصة</label>
                    <div className="relative">
                       <input 
                          type="text" required 
                          className="w-full p-2 pl-9 rounded-lg border border-gray-300 font-mono"
                          placeholder="رقم رخصة القيادة"
                          value={newDriverForm.licenseNumber}
                          onChange={e => setNewDriverForm({...newDriverForm, licenseNumber: e.target.value})}
                       />
                       <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">درجة الرخصة</label>
                    <select 
                       className="w-full p-2 rounded-lg border border-gray-300"
                       value={newDriverForm.licenseType}
                       onChange={e => setNewDriverForm({...newDriverForm, licenseType: e.target.value})}
                    >
                       <option value="درجة أولى">درجة أولى</option>
                       <option value="درجة ثانية">درجة ثانية</option>
                       <option value="درجة ثالثة">درجة ثالثة</option>
                       <option value="خاصة">خاصة</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ انتهاء الرخصة</label>
                    <div className="relative">
                       <input 
                          type="date" required 
                          className="w-full p-2 pl-9 rounded-lg border border-gray-300"
                          value={newDriverForm.licenseExpiry}
                          onChange={e => setNewDriverForm({...newDriverForm, licenseExpiry: e.target.value})}
                       />
                       <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                 </div>
                 <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition mt-2">
                    حفظ البيانات
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Add Maintenance Modal */}
      {isAddMaintenanceOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
               <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-800">تسجيل صيانة</h3>
                  <button onClick={() => setIsAddMaintenanceOpen(false)}><X className="h-5 w-5" /></button>
               </div>
               <form onSubmit={handleAddMaintenance} className="p-6 space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">المركبة</label>
                     <select className="w-full p-2 rounded-lg border border-gray-300" required onChange={e => setNewMaint({...newMaint, vehicleId: e.target.value})}>
                        <option value="">اختر المركبة</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} - {v.model}</option>)}
                     </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">التكلفة</label><input type="number" required className="w-full p-2 rounded-lg border border-gray-300" onChange={e => setNewMaint({...newMaint, cost: Number(e.target.value)})} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label><input type="text" required className="w-full p-2 rounded-lg border border-gray-300" onChange={e => setNewMaint({...newMaint, desc: e.target.value})} /></div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition mt-2">حفظ</button>
               </form>
            </div>
         </div>
      )}

    </div>
  );
};

export default Transport;
