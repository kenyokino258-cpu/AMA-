
import React, { useState, useEffect, useContext } from 'react';
import { MOCK_PAYROLL, MOCK_EMPLOYEES, MOCK_ATTENDANCE, MOCK_LOANS } from '../constants';
import { PayrollRecord, Employee, AttendanceRecord, LoanRecord } from '../types';
import { Printer, Send, Search, Calendar, ChevronDown, ShieldCheck, XCircle, Calculator, Settings, DownloadCloud } from 'lucide-react';
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
  
  // Payroll Config (just loading for usage, not setting)
  const [config] = useState(() => {
      const saved = localStorage.getItem('payroll_config');
      return saved ? JSON.parse(saved) : {
          taxPercentage: 10,
          insuranceEmployeePercentage: 11,
          insuranceCompanyPercentage: 18.75,
          housingAllowancePercentage: 0,
          transportAllowancePercentage: 0
      };
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

  // --- SMART PAYROLL CALCULATION ENGINE ---
  const calculateTotalDeductions = (employeeCode: string, employeeName: string, basicSalary: number, applyUpdates: boolean = false): { total: number, breakdown: string, loanUpdates?: any[] } => {
      let breakdownLog = [];
      let totalDeductionAmount = 0;
      let loanUpdates: any[] = [];

      // 1. Fixed Deductions (Tax + Insurance)
      const socialInsurance = (basicSalary * config.insuranceEmployeePercentage) / 100;
      const taxes = (basicSalary * config.taxPercentage) / 100;
      totalDeductionAmount += Math.round(socialInsurance + taxes);
      breakdownLog.push(`ثابتة (ضرائب+تأمين): ${Math.round(socialInsurance + taxes)}`);

      // 2. Attendance Data
      const savedAttendance = localStorage.getItem('attendance_data');
      const allAttendance: AttendanceRecord[] = savedAttendance ? JSON.parse(savedAttendance) : MOCK_ATTENDANCE;
      const relevantAttendance = allAttendance.filter(r => {
          const d = new Date(r.date);
          return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear && r.employeeCode === employeeCode;
      });

      const absentDays = relevantAttendance.filter(r => r.status === 'absent').length;
      const lateCount = relevantAttendance.filter(r => r.status === 'late').length;
      
      const dailyRate = basicSalary / 30;
      const attendanceDeduction = (absentDays * dailyRate) + (lateCount * (dailyRate * 0.25)); // 0.25 day for late
      
      if (attendanceDeduction > 0) {
          totalDeductionAmount += Math.round(attendanceDeduction);
          breakdownLog.push(`غياب/تأخير: ${Math.round(attendanceDeduction)}`);
      }

      // 3. Loans & Penalties Data
      const savedLoans = localStorage.getItem('loans_data');
      const allLoans: LoanRecord[] = savedLoans ? JSON.parse(savedLoans) : MOCK_LOANS;
      
      // Filter for this employee
      const employeeFinancials = allLoans.filter(l => l.employeeName === employeeName); // Ideally match by ID

      // A. Penalties (One-time deduction in the month they are approved)
      const monthPenalties = employeeFinancials.filter(l => {
          const d = new Date(l.date); // Use penalty date
          return l.type === 'جزاء' && 
                 l.requestStatus === 'approved' && 
                 (d.getMonth() + 1) === selectedMonth && 
                 d.getFullYear() === selectedYear;
      });
      const penaltyAmount = monthPenalties.reduce((sum, p) => sum + p.amount, 0);
      
      if (penaltyAmount > 0) {
          totalDeductionAmount += penaltyAmount;
          breakdownLog.push(`جزاءات: ${penaltyAmount}`);
      }

      // B. Active Loans (Installments)
      // Check if employee has active loan and deduction is due
      const activeLoans = employeeFinancials.filter(l => l.type === 'سلفة' && l.status === 'active' && l.remainingAmount > 0);
      let loanInstallmentTotal = 0;
      
      activeLoans.forEach(loan => {
          // Simple logic: Deduct installment every month until paid
          // Assumes installments = total / months
          const installment = Math.ceil(loan.amount / (loan.installments || 1));
          // Don't deduct more than remaining
          const actualDeduction = Math.min(installment, loan.remainingAmount);
          loanInstallmentTotal += actualDeduction;
          
          if (actualDeduction > 0) {
              loanUpdates.push({ id: loan.id, deduction: actualDeduction });
          }
      });

      if (loanInstallmentTotal > 0) {
          totalDeductionAmount += loanInstallmentTotal;
          breakdownLog.push(`أقساط سلف: ${loanInstallmentTotal}`);
      }

      return { 
          total: Math.round(totalDeductionAmount), 
          breakdown: breakdownLog.join(' | '),
          loanUpdates
      };
  };

  const handleSyncFinancials = () => {
      if (payroll.length === 0) {
          alert('يرجى إنشاء مسير الرواتب أولاً.');
          return;
      }

      if(!window.confirm(`هل أنت متأكد من استيراد كافة الخصومات (الحضور + الجزاءات + السلف) لشهر ${selectedMonth}/${selectedYear}؟\n\nتنبيه: سيتم خصم أقساط السلف فعلياً من أرصدة الموظفين.`)) return;

      const savedEmps = localStorage.getItem('employees_data');
      const allEmployees: Employee[] = savedEmps ? JSON.parse(savedEmps) : MOCK_EMPLOYEES;
      
      // Load current loans to update them
      const savedLoans = localStorage.getItem('loans_data');
      let allLoans: LoanRecord[] = savedLoans ? JSON.parse(savedLoans) : MOCK_LOANS;

      let updatedCount = 0;
      let loansUpdatedCount = 0;

      const updatedPayroll = payroll.map(record => {
          const emp = allEmployees.find(e => e.name === record.employeeName);
          const d = new Date(record.paymentDate);
          const isTargetMonth = (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;

          if (emp && isTargetMonth && record.status === 'pending') {
              const { total, loanUpdates } = calculateTotalDeductions(emp.employeeCode, emp.name, record.basicSalary, true);
              
              // Apply Loan Updates to local array
              if (loanUpdates && loanUpdates.length > 0) {
                  loanUpdates.forEach(update => {
                      const loanIndex = allLoans.findIndex(l => l.id === update.id);
                      if (loanIndex >= 0) {
                          allLoans[loanIndex].remainingAmount -= update.deduction;
                          if (allLoans[loanIndex].remainingAmount <= 0) {
                              allLoans[loanIndex].remainingAmount = 0;
                              allLoans[loanIndex].status = 'completed';
                          }
                          loansUpdatedCount++;
                      }
                  });
              }

              updatedCount++;
              
              return {
                  ...record,
                  deductions: total,
                  netSalary: Math.round(record.basicSalary + record.allowances + record.incentives - total)
              };
          }
          return record;
      });

      // Save updated payroll
      setPayroll(updatedPayroll);
      
      // Save updated loans back to storage
      localStorage.setItem('loans_data', JSON.stringify(allLoans));
      
      addNotification('تحديث مالي', `تم تحديث رواتب ${updatedCount} موظف وخصم ${loansUpdatedCount} قسط سلفة.`);
  };

  // --- GENERATE PAYROLL ---
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
        const basic = emp.salary;
        
        // Additions
        const housing = (basic * config.housingAllowancePercentage) / 100;
        const transport = (basic * config.transportAllowancePercentage) / 100;
        const allowances = Math.round(housing + transport); 
        const incentives = 0; 

        // Initial Deductions (Only Fixed)
        const socialInsurance = (basic * config.insuranceEmployeePercentage) / 100;
        const taxes = (basic * config.taxPercentage) / 100;
        const deductions = Math.round(socialInsurance + taxes);

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
      if(window.confirm(`هل أنت متأكد من مراجعة هذا الراتب؟`)) {
          setPayroll(prev => prev.map(p => p.id === recordId ? { ...p, status: 'reviewed', auditedBy: reviewerName } : p));
      }
  };

  const handleApprove = (recordId: string) => {
      const managerName = currentUser?.fullName || 'المدير';
      if(window.confirm(`هل أنت متأكد من الاعتماد النهائي للصرف؟`)) {
          setPayroll(prev => prev.map(p => p.id === recordId ? { ...p, status: 'paid', approvedBy: managerName } : p));
      }
  };

  const handleReject = (recordId: string) => {
      if(window.confirm('هل أنت متأكد من رفض هذا الراتب؟')) {
          setPayroll(prev => prev.map(p => p.id === recordId ? { ...p, status: 'pending', auditedBy: undefined, approvedBy: undefined } : p));
      }
  };

  const handlePrintSlip = (record: PayrollRecord) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;
    const monthName = months.find(m => m.value === selectedMonth)?.label;
    printWindow.document.write(`
      <html dir="rtl"><head><title>قسيمة راتب</title><style>body{font-family:sans-serif;padding:30px}.header{text-align:center;border-bottom:2px solid #333;margin-bottom:20px}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #eee;text-align:right}.total{background:#f0f0f0;font-weight:bold}</style></head>
      <body><div class="header"><h2>قسيمة راتب</h2><p>${record.employeeName} - ${monthName} ${selectedYear}</p></div>
      <table><tr><th>البند</th><th>القيمة</th></tr><tr><td>الأساسي</td><td>${record.basicSalary}</td></tr><tr><td>بدلات</td><td>${record.allowances}</td></tr><tr><td>خصومات</td><td>${record.deductions}</td></tr><tr class="total"><td>الصافي</td><td>${record.netSalary}</td></tr></table>
      <script>window.print()</script></body></html>
    `);
    printWindow.document.close();
  };

  const filteredPayroll = payroll.filter(p => {
    const recordDate = new Date(p.paymentDate);
    const matchesDate = (recordDate.getMonth() + 1) === Number(selectedMonth) && recordDate.getFullYear() === Number(selectedYear);
    const matchesSearch = p.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesName = p.employeeName.toLowerCase().includes(colFilters.employeeName.toLowerCase());
    const matchesStatus = colFilters.status === 'all' || p.status === colFilters.status;
    return matchesDate && matchesSearch && matchesName && matchesStatus;
  });

  const totalSalaries = filteredPayroll.reduce((acc, curr) => acc + curr.netSalary, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div><h2 className="text-2xl font-bold text-gray-800">مسيرات الرواتب</h2><p className="text-sm text-gray-500 mt-1">إعداد واعتماد رواتب الموظفين الشهرية</p></div>
        <div className="flex gap-3">
          <DataControls data={filteredPayroll} fileName={`payroll_${selectedYear}_${selectedMonth}`} isAdmin={isAdmin} onImport={handleImport} />
          
          <button onClick={() => navigate('/settings')} className="flex items-center gap-2 rounded-lg bg-gray-100 border border-gray-300 px-3 py-2.5 text-gray-700 hover:bg-gray-200 transition"><Settings className="h-5 w-5" /></button>
          <button onClick={handleApproveAll} className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-white shadow-md hover:bg-green-700 transition-all"><Send className="h-5 w-5" /><span>اعتماد الكل</span></button>
          <button onClick={handleGeneratePayroll} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-md hover:bg-indigo-700 transition-all"><Calculator className="h-5 w-5" /><span>إنشاء المسير</span></button>
        </div>
      </div>

      {/* Summary & Date */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-3 text-gray-700 font-medium whitespace-nowrap"><div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><Calendar className="h-6 w-6" /></div><span>تحديد الفترة:</span></div>
          <div className="flex flex-1 gap-4 w-full">
            <div className="relative flex-1">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 pr-8 pl-10 rounded-lg outline-none cursor-pointer">{months.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}</select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative flex-1">
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 pr-8 pl-10 rounded-lg outline-none cursor-pointer">{years.map(y => (<option key={y} value={y}>{y}</option>))}</select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 text-white shadow-lg flex items-center justify-between relative overflow-hidden">
           <div className="relative z-10"><p className="text-indigo-100 text-sm mb-1 font-medium">إجمالي الرواتب</p><h3 className="text-4xl font-bold tracking-tight">{totalSalaries.toLocaleString()} <span className="text-xl font-normal opacity-80">ج.م</span></h3></div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center bg-gray-50/50 justify-between">
          <div className="relative w-full sm:w-80"><Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="بحث باسم الموظف..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-4 focus:border-indigo-500 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          
          <button 
            onClick={handleSyncFinancials}
            className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2.5 rounded-lg hover:bg-orange-100 transition shadow-sm font-medium"
            title="سحب (غياب + سلف + جزاءات)"
          >
            <DownloadCloud className="h-5 w-5" />
            استيراد شامل للخصومات
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
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-2"><input type="text" className="w-full text-xs p-1.5 border rounded" value={colFilters.employeeName} onChange={(e) => setColFilters({...colFilters, employeeName: e.target.value})} /></th>
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2 bg-gray-100"></th>
                <th className="px-6 py-2 bg-gray-100"></th>
                <th className="px-6 py-2 bg-gray-100"></th>
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2"><select className="w-full text-xs p-1.5 border rounded" value={colFilters.status} onChange={(e) => setColFilters({...colFilters, status: e.target.value})}><option value="all">الكل</option><option value="pending">معلق</option><option value="paid">تم الصرف</option></select></th>
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
                    
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-2 items-center w-full">
                            {record.status === 'pending' && <button onClick={() => handleReview(record.id)} className="w-full bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded text-xs hover:bg-yellow-100">مراجعة</button>}
                            {record.status === 'reviewed' && (
                                <div className="w-full flex gap-1">
                                    <button onClick={() => handleApprove(record.id)} className="flex-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1.5 rounded text-xs hover:bg-indigo-100 font-bold">اعتماد</button>
                                    <button onClick={() => handleReject(record.id)} className="px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"><XCircle className="h-4 w-4" /></button>
                                </div>
                            )}
                            {record.status === 'paid' && <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold border border-green-200 w-full justify-center"><ShieldCheck className="h-3 w-3" /> معتمد</span>}
                        </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                       <button onClick={() => handlePrintSlip(record)} className="text-gray-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-all"><Printer className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="px-6 py-12 text-center bg-gray-50"><p className="text-gray-500 font-medium">لا توجد سجلات</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
