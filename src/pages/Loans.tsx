
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
