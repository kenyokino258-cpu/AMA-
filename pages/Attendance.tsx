
import React, { useState } from 'react';
import { MOCK_ATTENDANCE, MOCK_EMPLOYEES, MOCK_DEVICES } from '../constants';
import { BiometricDevice } from '../types';
import { Search, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertTriangle, MapPin, Cpu, RefreshCw, Plus, X, Wifi, WifiOff, Fingerprint } from 'lucide-react';
import DataControls from '../components/DataControls';

const Attendance: React.FC = () => {
  const [date, setDate] = useState('2023-10-25');
  const [attendanceData, setAttendanceData] = useState(MOCK_ATTENDANCE);
  const [devices, setDevices] = useState<BiometricDevice[]>(MOCK_DEVICES);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isAddDeviceMode, setIsAddDeviceMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // New Device Form
  const [newDevice, setNewDevice] = useState({
    name: '',
    ip: '',
    port: '4370',
    type: 'ZK',
    location: ''
  });

  const isAdmin = true;

  // Helper to get employee code
  const getEmpCode = (name: string) => MOCK_EMPLOYEES.find(e => e.name === name)?.employeeCode || '-';

  // Enrich data with employee code for export/display
  const enrichedData = attendanceData.map(record => ({
    ...record,
    employeeCode: getEmpCode(record.employeeName)
  }));

  const handleImport = (data: any[]) => {
    setAttendanceData([...attendanceData, ...data.map((d, i) => ({
      ...d, 
      id: `IMP-ATT-${i}`
    }))]);
  };

  const filteredData = enrichedData.filter(d => 
     d.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     d.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Device Functions ---
  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    const device: BiometricDevice = {
      id: `DEV-${Date.now()}`,
      name: newDevice.name,
      ip: newDevice.ip,
      port: newDevice.port,
      type: newDevice.type as any,
      location: newDevice.location,
      status: 'online', // mock initial status
      lastSync: 'لم يتم'
    };
    setDevices([...devices, device]);
    setIsAddDeviceMode(false);
    setNewDevice({ name: '', ip: '', port: '4370', type: 'ZK', location: '' });
  };

  const handleSync = () => {
    setIsSyncing(true);
    // Simulate network delay
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date().toLocaleString('ar-EG');
      // Update last sync time for all active devices
      setDevices(devices.map(d => d.status === 'online' ? { ...d, lastSync: now } : d));
      
      // Mock pulling new records
      alert('تم سحب 5 حركات بصمة جديدة بنجاح من الأجهزة المتصلة.');
    }, 2000);
  };

  // Helper to check time deviations
  const isLate = (time: string) => {
    if (!time || time === '-') return false;
    const [hours] = time.split(':').map(Number);
    return hours >= 9 && parseInt(time.split(':')[1]) > 15; 
  };

  const isEarly = (time: string) => {
    if (!time || time === '-') return false;
    const [hours] = time.split(':').map(Number);
    return hours < 16; 
  };

  const stats = [
    { title: 'إجمالي الحضور', value: '38', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle },
    { title: 'غياب', value: '4', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
    { title: 'تأخير', value: '6', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: Clock },
    { title: 'مأموريات', value: '2', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: MapPin },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">سجل الحضور والانصراف</h2>
          <p className="text-sm text-gray-500 mt-1">متابعة ساعات العمل، التأخير، والغياب اليومي</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setIsDeviceModalOpen(true)}
             className="flex items-center gap-2 rounded-lg bg-slate-800 text-white px-4 py-2.5 shadow-md hover:bg-slate-900 transition-all"
           >
             <Cpu className="h-5 w-5" />
             <span>أجهزة البصمة</span>
           </button>
           <DataControls 
              data={enrichedData} 
              fileName="attendance_report" 
              isAdmin={isAdmin}
              onImport={handleImport}
              headers={[
                { key: 'employeeCode', label: 'الكود' },
                { key: 'employeeName', label: 'الموظف' },
                { key: 'date', label: 'التاريخ' },
                { key: 'checkIn', label: 'حضور' },
                { key: 'checkOut', label: 'انصراف' },
                { key: 'workHours', label: 'الساعات' },
                { key: 'status', label: 'الحالة' }
              ]}
           />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
         {stats.map((stat, idx) => (
           <div key={idx} className={`bg-white p-5 rounded-xl shadow-sm border ${stat.border} hover:shadow-md transition-all`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">{stat.title}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-full`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
           </div>
         ))}
      </div>

      {/* Main Content */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center justify-between bg-gray-50/50 shrink-0">
          <div className="relative w-full sm:w-64">
             <CalendarIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
             <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-3 text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer" 
             />
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث عن موظف أو كود..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Table */}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.length > 0 ? (
                filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-500">{record.employeeCode}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{record.employeeName}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono tracking-wide">{record.date}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono relative">
                       {record.checkIn}
                       {isLate(record.checkIn) && (
                          <span className="absolute -top-1 right-2 w-2 h-2 bg-red-500 rounded-full" title="تأخير"></span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono relative">
                       {record.checkOut}
                       {isEarly(record.checkOut) && (
                          <span className="absolute -top-1 right-2 w-2 h-2 bg-yellow-500 rounded-full" title="انصراف مبكر"></span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{record.workHours}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                       {record.source === 'Fingerprint' && <span className="flex items-center gap-1"><Fingerprint className="h-3 w-3" /> بصمة</span>}
                       {record.source === 'Manual' && <span className="flex items-center gap-1"> يدوي</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border
                        ${
                          record.status === 'present' ? 'bg-green-50 text-green-700 border-green-100' : 
                          record.status === 'absent' ? 'bg-red-50 text-red-700 border-red-100' :
                          record.status === 'late' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                          'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }
                      `}>
                        {record.status === 'present' && <CheckCircle className="h-3 w-3" />}
                        {record.status === 'absent' && <XCircle className="h-3 w-3" />}
                        {record.status === 'late' && <AlertTriangle className="h-3 w-3" />}
                        {record.status === 'excused' && <MapPin className="h-3 w-3" />}
                        
                        {record.status === 'present' ? 'حضور' : record.status === 'absent' ? 'غياب' : record.status === 'late' ? 'تأخير' : 'مأمورية'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 bg-gray-50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock className="h-8 w-8 text-gray-300" />
                      <p>لا توجد سجلات مطابقة</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Devices Modal */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-gray-100 p-6 bg-slate-50 rounded-t-2xl">
                 <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                       <Cpu className="h-6 w-6 text-indigo-600" />
                       إدارة أجهزة البصمة
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">ربط وسحب البيانات من أجهزة الحضور (ZK, Timy)</p>
                 </div>
                 <button onClick={() => setIsDeviceModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition">
                    <X className="h-6 w-6" />
                 </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                       <h4 className="font-bold text-slate-700">الأجهزة المتصلة</h4>
                       <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{devices.length}</span>
                    </div>
                    <div className="flex gap-2">
                       <button 
                          onClick={handleSync}
                          disabled={isSyncing}
                          className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition text-sm font-medium disabled:opacity-50"
                       >
                          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
                          {isSyncing ? 'جاري السحب...' : 'سحب البيانات الآن'}
                       </button>
                       <button 
                          onClick={() => setIsAddDeviceMode(true)}
                          className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                       >
                          <Plus className="h-4 w-4" />
                          إضافة جهاز
                       </button>
                    </div>
                 </div>

                 {/* Add Device Form */}
                 {isAddDeviceMode && (
                    <form onSubmit={handleAddDevice} className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                       <div className="md:col-span-1">
                          <label className="block text-xs text-indigo-800 mb-1 font-bold">اسم الجهاز / الموقع</label>
                          <input type="text" required className="w-full p-2 rounded border border-indigo-200 text-sm" placeholder="مثال: البوابة الرئيسية" value={newDevice.name} onChange={e => setNewDevice({...newDevice, name: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-xs text-indigo-800 mb-1 font-bold">IP Address</label>
                          <input type="text" required className="w-full p-2 rounded border border-indigo-200 text-sm font-mono" placeholder="192.168.1.201" value={newDevice.ip} onChange={e => setNewDevice({...newDevice, ip: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-xs text-indigo-800 mb-1 font-bold">Port</label>
                          <input type="text" required className="w-full p-2 rounded border border-indigo-200 text-sm font-mono" placeholder="4370" value={newDevice.port} onChange={e => setNewDevice({...newDevice, port: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-xs text-indigo-800 mb-1 font-bold">النوع (Model)</label>
                          <select className="w-full p-2 rounded border border-indigo-200 text-sm" value={newDevice.type} onChange={e => setNewDevice({...newDevice, type: e.target.value})}>
                             <option value="ZK">ZK Teco</option>
                             <option value="Timy">Timy</option>
                             <option value="Hikvision">Hikvision</option>
                             <option value="Other">Other (Generic)</option>
                          </select>
                       </div>
                       <div className="flex gap-2">
                          <button type="submit" className="flex-1 bg-indigo-600 text-white p-2 rounded text-sm hover:bg-indigo-700">حفظ</button>
                          <button type="button" onClick={() => setIsAddDeviceMode(false)} className="bg-white text-indigo-600 border border-indigo-200 p-2 rounded text-sm hover:bg-indigo-50">إلغاء</button>
                       </div>
                    </form>
                 )}

                 {/* Devices List */}
                 <div className="space-y-3">
                    {devices.map(device => (
                       <div key={device.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className={`p-3 rounded-full ${device.status === 'online' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {device.status === 'online' ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                             </div>
                             <div>
                                <h5 className="font-bold text-slate-800">{device.name}</h5>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                   <span className="font-mono bg-slate-100 px-1.5 rounded">{device.ip}:{device.port}</span>
                                   <span className="bg-indigo-50 text-indigo-700 px-1.5 rounded font-medium">{device.type}</span>
                                   <span>{device.location}</span>
                                </div>
                             </div>
                          </div>
                          <div className="text-left">
                             <div className="text-xs text-slate-400 mb-1">آخر مزامنة</div>
                             <div className="font-mono text-sm text-slate-700">{device.lastSync}</div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 rounded-b-2xl">
                 يدعم النظام الاتصال المباشر عبر الشبكة المحلية (TCP/IP) بأجهزة ZK و Timy
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
