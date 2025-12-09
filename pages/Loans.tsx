import React, { useState } from 'react';
import { MOCK_LOANS, MOCK_EMPLOYEES } from '../constants';
import { LoanRecord } from '../types';
import { Wallet, Plus, AlertCircle, X, Search, Filter, CheckCircle, XCircle, Banknote, FileText } from 'lucide-react';
import DataControls from '../components/DataControls';

const Loans: React.FC = () => {
  const [loans, setLoans] = useState<LoanRecord[]>(MOCK_LOANS);
  const [activeTab, setActiveTab] = useState<'requests' | 'penalties' | 'active'>('requests');
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    employeeName: '',
    amount: '',
    installments: '',
    reason: ''
  });
  
  const isAdmin = true;

  const handleImport = (data: any[]) => {
    const newItems = data.map((d, i) => ({ ...MOCK_LOANS[0], ...d, id: `IMP-LN-${i}` }));
    setLoans([...loans, ...newItems]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formData.amount);
    
    const newLoan: LoanRecord = {
      id: `LN-${Date.now()}`,
      employeeName: formData.employeeName,
      type: 'سلفة',
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      remainingAmount: amount,
      status: 'pending',
      requestStatus: 'pending',
      installments: Number(formData.installments),
      reason: formData.reason
    };

    setLoans([newLoan, ...loans]);
    setIsLoanModalOpen(false);
    setFormData({ employeeName: '', amount: '', installments: '', reason: '' });
  };

  const handleSubmitPenalty = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formData.amount);
    
    const newPenalty: LoanRecord = {
      id: `PN-${Date.now()}`,
      employeeName: formData.employeeName,
      type: 'جزاء',
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      remainingAmount: amount,
      status: 'pending',
      requestStatus: 'pending',
      reason: formData.reason
    };

    setLoans([newPenalty, ...loans]);
    setIsPenaltyModalOpen(false);
    setFormData({ employeeName: '', amount: '', installments: '', reason: '' });
  };

  const handleApprove = (id: string) => {
    setLoans(prev => prev.map(loan => 
      loan.id === id ? { ...loan, requestStatus: 'approved', status: 'active', approvedBy: 'Admin' } : loan
    ));
  };

  const handleReject = (id: string) => {
    setLoans(prev => prev.map(loan => 
      loan.id === id ? { ...loan, requestStatus: 'rejected', status: 'completed' } : loan
    ));
  };

  // Filter Logic based on Tabs
  const filteredRecords = loans.filter(l => {
     const matchesSearch = l.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
     
     if (!matchesSearch) return false;

     if (activeTab === 'requests') {
       return l.type === 'سلفة' && l.requestStatus === 'pending';
     } else if (activeTab === 'penalties') {
       return l.type !== 'سلفة';
     } else {
       return l.type === 'سلفة' && l.requestStatus === 'approved';
     }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">السلف والجزاءات</h2>
          <p className="text-sm text-gray-500 mt-1">إدارة طلبات السلف، الموافقات، وتسجيل الجزاءات والخصومات</p>
        </div>
        <div className="flex gap-3">
          <DataControls 
            data={loans} 
            fileName="loans_deductions" 
            isAdmin={isAdmin}
            onImport={handleImport}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
             <div className="flex items-center justify-between mb-4 relative z-10">
                 <h3 className="font-medium opacity-90">السلف النشطة (المتبقي)</h3>
                 <div className="bg-white/20 p-2 rounded-lg">
                    <Wallet className="h-5 w-5" />
                 </div>
             </div>
             <div className="flex items-end gap-2 relative z-10">
               <p className="text-4xl font-bold">
                 {loans.filter(l => l.type === 'سلفة' && l.status === 'active').reduce((acc, curr) => acc + curr.remainingAmount, 0).toLocaleString()} 
               </p>
               <span className="mb-1 text-lg opacity-80">ج.م</span>
             </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
             <div className="flex items-center justify-between mb-4">
                 <h3 className="font-medium text-gray-600">إجمالي الجزاءات (هذا الشهر)</h3>
                 <div className="bg-red-50 p-2 rounded-lg group-hover:bg-red-100 transition-colors">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                 </div>
             </div>
             <div className="flex items-end gap-2">
               <p className="text-4xl font-bold text-gray-800">
                 {loans.filter(l => l.type === 'جزاء' && l.requestStatus === 'approved').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
               </p>
               <span className="mb-1 text-lg text-gray-400">ج.م</span>
             </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-200 pb-1">
        <div className="flex gap-8 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'requests' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            طلبات السلف 
            {activeTab === 'requests' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>}
            <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs mr-2">{loans.filter(l => l.type === 'سلفة' && l.requestStatus === 'pending').length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('penalties')}
            className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'penalties' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            الجزاءات والخصومات
            {activeTab === 'penalties' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('active')}
            className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'active' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            السلف الجارية
            {activeTab === 'active' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-full"></span>}
          </button>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto justify-end">
          {activeTab === 'requests' && (
             <button 
               onClick={() => setIsLoanModalOpen(true)}
               className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 transition text-sm font-medium"
             >
               <Plus className="h-4 w-4" />
               <span>طلب سلفة</span>
             </button>
          )}
          {activeTab === 'penalties' && (
             <button 
               onClick={() => setIsPenaltyModalOpen(true)}
               className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white shadow-sm hover:bg-red-700 transition text-sm font-medium"
             >
               <AlertCircle className="h-4 w-4" />
               <span>تسجيل جزاء</span>
             </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center p-5 border-b border-gray-100 bg-gray-50/50">
           <div className="relative w-full sm:w-80">
             <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
             <input 
               type="text" 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="بحث باسم الموظف..."
               className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-9 pl-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
             />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">الموظف</th>
                <th className="px-6 py-4 font-semibold">النوع</th>
                <th className="px-6 py-4 font-semibold">القيمة</th>
                <th className="px-6 py-4 font-semibold">التاريخ</th>
                <th className="px-6 py-4 font-semibold">التفاصيل</th>
                <th className="px-6 py-4 font-semibold">الحالة</th>
                <th className="px-6 py-4 font-semibold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{record.employeeName}</td>
                    <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border
                          ${record.type === 'سلفة' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {record.type}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-bold font-mono">{record.amount.toLocaleString()} ج.م</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{record.date}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px]">
                      <div className="flex flex-col gap-1">
                        {record.type === 'سلفة' && record.installments && (
                          <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded w-fit">{record.installments} أقساط</span>
                        )}
                        {record.reason && <span className="truncate" title={record.reason}>{record.reason}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {record.requestStatus === 'pending' ? (
                         <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 border border-yellow-200">
                           قيد الموافقة
                         </span>
                      ) : record.requestStatus === 'rejected' ? (
                         <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 border border-red-200">
                           مرفوض
                         </span>
                      ) : (
                         <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border
                           ${record.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-700 border-gray-200'}
                         `}>
                           {record.status === 'active' ? 'نشط/جاري' : 'مكتمل'}
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {record.requestStatus === 'pending' && (
                         <div className="flex justify-center gap-2">
                            <button 
                               onClick={() => handleApprove(record.id)}
                               className="p-1.5 rounded bg-green-50 text-green-600 border border-green-100 hover:bg-green-100 hover:border-green-200 transition-colors" 
                               title="موافقة"
                            >
                               <CheckCircle className="h-4 w-4" />
                            </button>
                            <button 
                               onClick={() => handleReject(record.id)}
                               className="p-1.5 rounded bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:border-red-200 transition-colors" 
                               title="رفض"
                            >
                               <XCircle className="h-4 w-4" />
                            </button>
                         </div>
                      )}
                      {record.requestStatus === 'approved' && record.type === 'سلفة' && (
                          <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full w-fit mx-auto">
                              <CheckCircle className="h-3 w-3" />
                              معتمد
                          </div>
                      )}
                      {record.requestStatus === 'rejected' && (
                          <span className="text-red-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 bg-gray-50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-gray-300" />
                      <p>لا توجد سجلات</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Loan Modal */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800">طلب سلفة جديدة</h3>
              <button 
                onClick={() => setIsLoanModalOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitLoan} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الموظف</label>
                <select
                  name="employeeName"
                  required
                  value={formData.employeeName}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                >
                  <option value="">اختر الموظف</option>
                  {MOCK_EMPLOYEES.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">قيمة السلفة</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="amount"
                        required
                        min="1"
                        value={formData.amount}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 p-2.5 pl-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        placeholder="0.00"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">ج.م</span>
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">عدد الأقساط</label>
                    <input
                      type="number"
                      name="installments"
                      required
                      min="1"
                      value={formData.installments}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="مثال: 3"
                    />
                 </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">سبب السلفة</label>
                <textarea
                  name="reason"
                  rows={3}
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  placeholder="اكتب سبب طلب السلفة..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition shadow-sm hover:shadow"
                >
                  تقديم للموافقة
                </button>
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Penalty Modal */}
      {isPenaltyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800">تسجيل جزاء / خصم</h3>
              <button 
                onClick={() => setIsPenaltyModalOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitPenalty} className="p-6 space-y-5">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start gap-3">
                 <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                 <div>
                    <p className="text-sm font-medium text-red-800">تنبيه هام</p>
                    <p className="text-xs text-red-600 mt-1">الجزاءات المسجلة سيتم خصمها تلقائياً من راتب الشهر الحالي.</p>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الموظف</label>
                <select
                  name="employeeName"
                  required
                  value={formData.employeeName}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                >
                  <option value="">اختر الموظف</option>
                  {MOCK_EMPLOYEES.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1.5">قيمة الخصم</label>
                 <div className="relative">
                   <input
                     type="number"
                     name="amount"
                     required
                     min="1"
                     value={formData.amount}
                     onChange={handleInputChange}
                     className="w-full rounded-lg border border-gray-300 p-2.5 pl-8 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                     placeholder="0.00"
                   />
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">ج.م</span>
                 </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">سبب الجزاء</label>
                <textarea
                  name="reason"
                  rows={3}
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all resize-none"
                  placeholder="سبب الخصم..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition shadow-sm hover:shadow"
                >
                  تسجيل الجزاء
                </button>
                <button
                  type="button"
                  onClick={() => setIsPenaltyModalOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
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

export default Loans;