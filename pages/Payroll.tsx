import React, { useState } from 'react';
import { MOCK_PAYROLL } from '../constants';
import { PayrollRecord } from '../types';
import { DollarSign, Printer, Send, Search, Filter, Calendar, ChevronDown } from 'lucide-react';
import DataControls from '../components/DataControls';

const Payroll: React.FC = () => {
  const [payroll, setPayroll] = useState<PayrollRecord[]>(MOCK_PAYROLL);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Date Filters (Defaulting to Oct 2023 to match mock data for demo purposes)
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [selectedYear, setSelectedYear] = useState<number>(2023);

  const isAdmin = true;

  const months = [
    { value: 1, label: 'يناير' },
    { value: 2, label: 'فبراير' },
    { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' },
    { value: 5, label: 'مايو' },
    { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' },
    { value: 8, label: 'أغسطس' },
    { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' },
    { value: 11, label: 'نوفمبر' },
    { value: 12, label: 'ديسمبر' },
  ];

  const years = [2022, 2023, 2024, 2025];

  const handleImport = (data: any[]) => {
      const newItems = data.map((d, i) => ({ ...MOCK_PAYROLL[0], ...d, id: `IMP-PAY-${i}` }));
      setPayroll([...payroll, ...newItems]);
  };

  const filteredPayroll = payroll.filter(p => {
    const recordDate = new Date(p.paymentDate);
    const matchesDate = (recordDate.getMonth() + 1) === Number(selectedMonth) && 
                        recordDate.getFullYear() === Number(selectedYear);
    
    const matchesSearch = p.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    return matchesDate && matchesSearch && matchesStatus;
  });

  const totalSalaries = filteredPayroll.reduce((acc, curr) => acc + curr.netSalary, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">مسيرات الرواتب</h2>
          <p className="text-sm text-gray-500 mt-1">إعداد واعتماد رواتب الموظفين الشهرية</p>
        </div>
        <div className="flex gap-3">
          <DataControls 
            data={filteredPayroll} 
            fileName={`payroll_${selectedYear}_${selectedMonth}`} 
            isAdmin={isAdmin}
            onImport={handleImport}
            headers={[
              { key: 'employeeName', label: 'الموظف' },
              { key: 'basicSalary', label: 'الراتب الأساسي' },
              { key: 'allowances', label: 'بدلات' },
              { key: 'incentives', label: 'حوافز' },
              { key: 'deductions', label: 'خصومات' },
              { key: 'netSalary', label: 'صافي الراتب' },
              { key: 'status', label: 'الحالة' }
            ]}
          />
          <button className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-white shadow-md hover:bg-green-700 transition-all hover:shadow-lg active:scale-95">
            <Send className="h-5 w-5" />
            <span>اعتماد الرواتب</span>
          </button>
        </div>
      </div>

      {/* Date Selection & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-3 text-gray-700 font-medium whitespace-nowrap">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
               <Calendar className="h-6 w-6" />
            </div>
            <span>تحديد الفترة:</span>
          </div>
          
          <div className="flex flex-1 gap-4 w-full">
            <div className="relative flex-1">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 pr-8 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer transition-all"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative flex-1">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 pr-8 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer transition-all"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 text-white shadow-lg flex items-center justify-between relative overflow-hidden">
           {/* Background Decoration */}
           <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <DollarSign className="absolute -right-4 -bottom-4 h-32 w-32 transform rotate-12" />
           </div>
           
           <div className="relative z-10">
              <p className="text-indigo-100 text-sm mb-1 font-medium">
                إجمالي الرواتب ({months.find(m => m.value === selectedMonth)?.label} {selectedYear})
              </p>
              <h3 className="text-4xl font-bold tracking-tight">{totalSalaries.toLocaleString()} <span className="text-xl font-normal opacity-80">ج.م</span></h3>
           </div>
           <div className="bg-white/20 p-3 rounded-xl relative z-10 backdrop-blur-sm">
              <DollarSign className="h-8 w-8 text-white" />
           </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="بحث باسم الموظف..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white py-2.5 px-4 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none cursor-pointer hover:border-gray-300 transition-all"
            >
              <option value="all">جميع الحالات</option>
              <option value="paid">تم التحويل</option>
              <option value="pending">معلق</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">الموظف</th>
                <th className="px-6 py-4 font-semibold">الراتب الأساسي</th>
                <th className="px-6 py-4 font-semibold text-green-600">بدلات (+)</th>
                <th className="px-6 py-4 font-semibold text-green-600">حوافز (+)</th>
                <th className="px-6 py-4 font-semibold text-red-600">خصومات (-)</th>
                <th className="px-6 py-4 font-semibold">صافي الراتب</th>
                <th className="px-6 py-4 font-semibold">الحالة</th>
                <th className="px-6 py-4 font-semibold text-center">إيصال</th>
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
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border
                        ${record.status === 'paid' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-700 border-gray-200'}
                      `}>
                        <span className={`w-1.5 h-1.5 rounded-full ml-1.5 ${record.status === 'paid' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {record.status === 'paid' ? 'تم التحويل' : 'معلق'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button className="text-gray-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-all" title="طباعة الإيصال">
                          <Printer className="h-4 w-4" />
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 bg-gray-50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <DollarSign className="h-8 w-8 text-gray-300" />
                      <p>لا توجد بيانات رواتب مطابقة</p>
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