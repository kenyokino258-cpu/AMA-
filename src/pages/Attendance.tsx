
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
