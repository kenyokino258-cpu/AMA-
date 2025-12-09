import React, { useState } from 'react';
import { MOCK_LEAVES, MOCK_LEAVE_BALANCES, MOCK_EMPLOYEES } from '../constants';
import { LeaveRequest, LeaveBalance } from '../types';
import { Calendar, Check, X, Clock, PlusCircle, Settings, X as CloseIcon, Search, Filter, PieChart } from 'lucide-react';
import DataControls from '../components/DataControls';

const Leaves: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>(MOCK_LEAVES);
  const [balances, setBalances] = useState<LeaveBalance[]>(MOCK_LEAVE_BALANCES);
  
  // Modals
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // New Request Form
  const [requestForm, setRequestForm] = useState({
    employeeName: '',
    type: 'سنوي',
    startDate: '',
    endDate: '',
    days: 1
  });

  const isAdmin = true;

  const leaveTypes = [
    'سنوي',
    'مرضي',
    'عارضة',
    'بدون راتب',
    'إجازة وضع',
    'إجازة أبوة'
  ];

  const handleImport = (data: any[]) => {
    const newItems = data.map((d, i) => ({ ...MOCK_LEAVES[0], ...d, id: `IMP-LV-${i}` }));
    setLeaves([...leaves, ...newItems]);
  };

  const handleUpdateBalance = (index: number, field: keyof LeaveBalance, value: number) => {
    const newBalances = [...balances];
    // @ts-ignore
    newBalances[index][field] = Number(value);
    setBalances(newBalances);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLeave: LeaveRequest = {
      id: `LR-${Date.now()}`,
      employeeName: requestForm.employeeName,
      type: requestForm.type as any,
      startDate: requestForm.startDate,
      endDate: requestForm.endDate,
      days: Number(requestForm.days),
      status: 'pending'
    };
    setLeaves([newLeave, ...leaves]);
    setIsRequestModalOpen(false);
    // Reset form
    setRequestForm({
      employeeName: '',
      type: 'سنوي',
      startDate: '',
      endDate: '',
      days: 1
    });
  };

  const filteredLeaves = leaves.filter(l => {
     const matchesSearch = l.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
     return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
       {/* Header */}
       <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة الإجازات</h2>
          <p className="text-sm text-gray-500 mt-1">طلبات الإجازات، الأرصدة المتبقية، وسجل الغياب</p>
        </div>
        <div className="flex gap-3">
          <DataControls 
            data={leaves} 
            fileName="leaves_requests" 
            isAdmin={isAdmin}
            onImport={handleImport}
          />
          <button 
             onClick={() => setIsBalanceModalOpen(true)}
             className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
             <Settings className="h-5 w-5 text-gray-500" />
             <span>إدارة الأرصدة</span>
          </button>
          <button 
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-md hover:bg-indigo-700 transition-all hover:shadow-lg active:scale-95"
          >
            <PlusCircle className="h-5 w-5" />
            <span>طلب إجازة</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
             <div className="flex justify-between items-start mb-4">
               <h3 className="font-bold text-gray-800">متوسط استهلاك الرصيد السنوي</h3>
               <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                 <PieChart className="h-5 w-5" />
               </div>
             </div>
             <div className="mb-2 flex justify-between text-sm font-medium">
               <span className="text-gray-600">نسبة الاستهلاك</span>
               <span className="text-indigo-600">65%</span>
             </div>
             <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="absolute top-0 right-0 h-full bg-indigo-500 w-[65%] rounded-full"></div>
             </div>
             <div className="flex justify-between mt-4 text-xs text-gray-500 border-t border-gray-50 pt-3">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-300 rounded-full"></span> متوسط المستهلك: 14 يوم</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-500 rounded-full"></span> متوسط المتبقي: 7 أيام</span>
             </div>
         </div>
         
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center justify-between">
             <div>
               <h3 className="font-bold text-gray-800 mb-2">طلبات قيد الانتظار</h3>
               <p className="text-sm text-gray-500">طلبات تحتاج إلى مراجعة وموافقة</p>
               <div className="mt-4 inline-flex items-center bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium border border-yellow-100">
                  {leaves.filter(l => l.status === 'pending').length} طلبات معلقة
               </div>
             </div>
             <div className="bg-yellow-100 p-4 rounded-full text-yellow-600 shadow-sm">
                <Clock className="h-8 w-8" />
             </div>
         </div>
      </div>

      {/* Table Section */}
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
              className="rounded-lg border border-gray-200 bg-white py-2.5 px-4 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none cursor-pointer hover:border-gray-300 w-40 transition-all"
            >
              <option value="all">الكل</option>
              <option value="pending">قيد الانتظار</option>
              <option value="approved">مقبول</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">الموظف</th>
                <th className="px-6 py-4 font-semibold">نوع الإجازة</th>
                <th className="px-6 py-4 font-semibold">من تاريخ</th>
                <th className="px-6 py-4 font-semibold">إلى تاريخ</th>
                <th className="px-6 py-4 font-semibold">الأيام</th>
                <th className="px-6 py-4 font-semibold">الحالة</th>
                <th className="px-6 py-4 font-semibold text-center">القرار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{leave.employeeName}</td>
                    <td className="px-6 py-4">
                       <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs border border-gray-200">
                          {leave.type}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono tracking-wide">{leave.startDate}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono tracking-wide">{leave.endDate}</td>
                    <td className="px-6 py-4 font-bold text-indigo-600">{leave.days} يوم</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border
                        ${leave.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : 
                          leave.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}
                      `}>
                        {leave.status === 'approved' ? 'مقبول' : leave.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       {leave.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                             <button className="p-1.5 rounded bg-green-50 text-green-600 border border-green-100 hover:bg-green-100 transition-colors" title="قبول"><Check className="h-4 w-4" /></button>
                             <button className="p-1.5 rounded bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors" title="رفض"><X className="h-4 w-4" /></button>
                          </div>
                       ) : (
                          <span className="text-gray-300">-</span>
                       )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 bg-gray-50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="h-8 w-8 text-gray-300" />
                      <p>لا توجد طلبات مطابقة</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Management Modal */}
      {isBalanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
             <div className="flex items-center justify-between border-b border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-800">إدارة أرصدة الإجازات</h3>
                <button 
                  onClick={() => setIsBalanceModalOpen(false)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <CloseIcon className="h-6 w-6" />
                </button>
             </div>
             
             <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full text-right text-sm border-separate border-spacing-0">
                   <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10">
                      <tr>
                         <th className="px-4 py-3 font-medium rounded-r-lg border-y border-r border-gray-200 bg-gray-50">الموظف</th>
                         <th className="px-4 py-3 font-medium text-center border-y border-gray-200 bg-gray-50">الإجمالي السنوي</th>
                         <th className="px-4 py-3 font-medium text-center border-y border-gray-200 bg-gray-50">المستخدم (سنوي)</th>
                         <th className="px-4 py-3 font-medium text-center border-y border-gray-200 bg-gray-50">الإجمالي المرضي</th>
                         <th className="px-4 py-3 font-medium text-center border-y border-gray-200 bg-gray-50">الإجمالي العارضة</th>
                         <th className="px-4 py-3 font-medium text-center rounded-l-lg border-y border-l border-gray-200 bg-gray-50">المتبقي (سنوي)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {balances.map((balance, idx) => (
                         <tr key={balance.employeeId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{balance.employeeName}</td>
                            <td className="px-4 py-3 text-center">
                               <input 
                                  type="number" 
                                  className="w-16 text-center border border-gray-300 rounded-md p-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                  value={balance.annualTotal}
                                  onChange={(e) => handleUpdateBalance(idx, 'annualTotal', parseInt(e.target.value))}
                               />
                            </td>
                            <td className="px-4 py-3 text-center">
                               <input 
                                  type="number" 
                                  className="w-16 text-center border border-gray-300 rounded-md p-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                  value={balance.annualUsed}
                                  onChange={(e) => handleUpdateBalance(idx, 'annualUsed', parseInt(e.target.value))}
                               />
                            </td>
                            <td className="px-4 py-3 text-center">
                               <input 
                                  type="number" 
                                  className="w-16 text-center border border-gray-300 rounded-md p-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                  value={balance.sickTotal}
                                  onChange={(e) => handleUpdateBalance(idx, 'sickTotal', parseInt(e.target.value))}
                               />
                            </td>
                            <td className="px-4 py-3 text-center">
                               <input 
                                  type="number" 
                                  className="w-16 text-center border border-gray-300 rounded-md p-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                  value={balance.casualTotal}
                                  onChange={(e) => handleUpdateBalance(idx, 'casualTotal', parseInt(e.target.value))}
                               />
                            </td>
                            <td className="px-4 py-3 text-center">
                               <span className={`inline-block px-3 py-1 rounded font-bold text-sm ${
                                  (balance.annualTotal - balance.annualUsed) < 5 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                               }`}>
                                  {balance.annualTotal - balance.annualUsed}
                               </span>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                <button 
                   onClick={() => setIsBalanceModalOpen(false)}
                   className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition shadow-sm hover:shadow"
                >
                   حفظ التعديلات
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Request Leave Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800">تسجيل طلب إجازة</h3>
              <button 
                onClick={() => setIsRequestModalOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleRequestSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الموظف</label>
                <select 
                  required
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={requestForm.employeeName}
                  onChange={(e) => setRequestForm({...requestForm, employeeName: e.target.value})}
                >
                  <option value="">اختر الموظف</option>
                  {MOCK_EMPLOYEES.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">نوع الإجازة</label>
                <select 
                  required
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={requestForm.type}
                  onChange={(e) => setRequestForm({...requestForm, type: e.target.value})}
                >
                  {leaveTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">من تاريخ</label>
                  <input 
                    type="date" 
                    required
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    value={requestForm.startDate}
                    onChange={(e) => setRequestForm({...requestForm, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">إلى تاريخ</label>
                  <input 
                    type="date" 
                    required
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    value={requestForm.endDate}
                    onChange={(e) => setRequestForm({...requestForm, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">عدد الأيام</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={requestForm.days}
                  onChange={(e) => setRequestForm({...requestForm, days: Number(e.target.value)})}
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm hover:shadow"
                >
                  إرسال الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;