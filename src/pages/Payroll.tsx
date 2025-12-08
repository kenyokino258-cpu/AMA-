
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
