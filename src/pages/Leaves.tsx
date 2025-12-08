
import React, { useState, useEffect, useContext } from 'react';
import { MOCK_LEAVES, MOCK_LEAVE_BALANCES, MOCK_EMPLOYEES } from '../constants';
import { LeaveRequest, LeaveBalance, UserRole } from '../types';
import { PlusCircle, Settings, X as CloseIcon, Search, Filter, ShieldCheck, UserCheck, Trash2, Edit, Save, X } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [requestForm, setRequestForm] = useState({
    employeeName: '',
    type: 'سنوي',
    startDate: '',
    endDate: '',
    days: 1
  });

  const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.HR_MANAGER;
  const leaveTypes = ['سنوي', 'مرضي', 'عارضة', 'بدون راتب', 'إجازة وضع', 'إجازة أبوة'];

  useEffect(() => { localStorage.setItem('leaves_data', JSON.stringify(leaves)); }, [leaves]);
  useEffect(() => { localStorage.setItem('leaves_balances', JSON.stringify(balances)); }, [balances]);

  const handleImport = (data: any[]) => {
    const newItems = data.map((d, i) => ({ ...MOCK_LEAVES[0], ...d, id: `IMP-LV-${i}` }));
    setLeaves(prev => [...prev, ...newItems]);
  };

  const handleOpenRequestModal = (leave?: LeaveRequest) => {
      if (leave) {
          setEditingLeaveId(leave.id);
          setRequestForm({
              employeeName: leave.employeeName,
              type: leave.type,
              startDate: leave.startDate,
              endDate: leave.endDate,
              days: leave.days
          });
      } else {
          setEditingLeaveId(null);
          setRequestForm({
            employeeName: currentUser?.role === UserRole.EMPLOYEE ? currentUser.fullName : '',
            type: 'سنوي',
            startDate: '',
            endDate: '',
            days: 1
          });
      }
      setIsRequestModalOpen(true);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingLeaveId) {
        // Edit Existing
        setLeaves(prev => prev.map(l => l.id === editingLeaveId ? {
            ...l,
            employeeName: requestForm.employeeName,
            type: requestForm.type as any,
            startDate: requestForm.startDate,
            endDate: requestForm.endDate,
            days: Number(requestForm.days)
        } : l));
        addNotification('تعديل إجازة', 'تم تحديث طلب الإجازة بنجاح.');
    } else {
        // Create New
        const newLeave: LeaveRequest = {
            id: `LR-${Date.now()}`,
            employeeName: requestForm.employeeName || (currentUser?.fullName || 'Unknown'),
            type: requestForm.type as any,
            startDate: requestForm.startDate,
            endDate: requestForm.endDate,
            days: Number(requestForm.days),
            status: 'pending' 
        };
        setLeaves([newLeave, ...leaves]);
        addNotification('طلب إجازة جديد', `قام ${newLeave.employeeName} بتقديم طلب إجازة.`);
    }
    setIsRequestModalOpen(false);
  };

  const handleDeleteLeave = (id: string) => {
      if (window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) {
          setLeaves(prev => prev.filter(l => l.id !== id));
          addNotification('حذف طلب', 'تم حذف طلب الإجازة.');
      }
  };

  const handleUpdateBalance = (index: number, field: keyof LeaveBalance, value: number) => {
    const newBalances = [...balances];
    // @ts-ignore
    newBalances[index][field] = Number(value);
    setBalances(newBalances);
  };

  const handleSaveBalances = () => {
      setIsBalanceModalOpen(false);
      addNotification('حفظ الأرصدة', 'تم تحديث أرصدة الإجازات بنجاح.');
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

  const filteredLeaves = leaves.filter(l => {
      const matchesSearch = l.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      // If employee, only show their leaves
      const isOwner = currentUser?.role === UserRole.EMPLOYEE ? l.employeeName === currentUser.fullName : true;
      
      return matchesSearch && matchesStatus && isOwner;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
       <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div><h2 className="text-2xl font-bold text-gray-800">إدارة الإجازات</h2><p className="text-sm text-gray-500 mt-1">طلبات الإجازات، الأرصدة المتبقية، وسجل الغياب</p></div>
        <div className="flex gap-3">
          {isAdmin && <DataControls data={leaves} fileName="leaves_requests" isAdmin={isAdmin} onImport={handleImport} />}
          
          <button onClick={() => setIsBalanceModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-gray-700 shadow-sm hover:bg-gray-50 transition-all">
              <Settings className="h-5 w-5 text-gray-500" />
              <span>{currentUser?.role === UserRole.EMPLOYEE ? 'رصيدي' : 'إدارة الأرصدة'}</span>
          </button>
          
          <button onClick={() => handleOpenRequestModal()} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-md hover:bg-indigo-700 transition-all">
              <PlusCircle className="h-5 w-5" />
              <span>طلب إجازة</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center bg-gray-50/50">
          <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input 
                  type="text" 
                  placeholder="بحث باسم الموظف..." 
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-4 focus:border-indigo-500 focus:outline-none" 
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
              {filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{leave.employeeName}</td>
                    <td className="px-6 py-4"><span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs border border-gray-200">{leave.type}</span></td>
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
                        <div className="flex items-center justify-center gap-2">
                            {/* Workflow Actions for Admins */}
                            {isAdmin && (
                                <>
                                    {leave.status === 'pending' && (
                                        <button onClick={() => handleReview(leave.id)} className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded hover:bg-yellow-100 transition">مراجعة</button>
                                    )}
                                    {leave.status === 'reviewed' && (
                                        <button onClick={() => handleApprove(leave.id)} className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition font-bold">اعتماد</button>
                                    )}
                                    {(leave.status !== 'approved' && leave.status !== 'rejected') && (
                                        <button onClick={() => handleReject(leave.id)} className="p-1 rounded text-red-500 hover:bg-red-50" title="رفض"><X className="h-4 w-4" /></button>
                                    )}
                                </>
                            )}

                            {/* Edit/Delete Actions */}
                            {(isAdmin || (leave.status === 'pending' && currentUser?.fullName === leave.employeeName)) && (
                                <>
                                    <button onClick={() => handleOpenRequestModal(leave)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="تعديل">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDeleteLeave(leave.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="حذف">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </td>
                  </tr>
                ))}
                {filteredLeaves.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 bg-gray-50"><div className="flex flex-col items-center justify-center gap-2"><p>لا توجد طلبات إجازة</p></div></td></tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

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
                      {balances.filter(b => isAdmin || b.employeeName === currentUser?.fullName).map((balance, idx) => (
                         <tr key={balance.employeeId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{balance.employeeName}</td>
                            <td className="px-4 py-3 text-center">
                               <input 
                                  type="number" 
                                  className="w-16 text-center border border-gray-300 rounded-md p-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
                                  value={balance.annualTotal}
                                  onChange={(e) => handleUpdateBalance(idx, 'annualTotal', parseInt(e.target.value))}
                                  disabled={!isAdmin}
                               />
                            </td>
                            <td className="px-4 py-3 text-center">
                               <input 
                                  type="number" 
                                  className="w-16 text-center border border-gray-300 rounded-md p-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
                                  value={balance.annualUsed}
                                  onChange={(e) => handleUpdateBalance(idx, 'annualUsed', parseInt(e.target.value))}
                                  disabled={!isAdmin}
                               />
                            </td>
                            <td className="px-4 py-3 text-center">
                               <input 
                                  type="number" 
                                  className="w-16 text-center border border-gray-300 rounded-md p-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
                                  value={balance.sickTotal}
                                  onChange={(e) => handleUpdateBalance(idx, 'sickTotal', parseInt(e.target.value))}
                                  disabled={!isAdmin}
                               />
                            </td>
                            <td className="px-4 py-3 text-center">
                               <input 
                                  type="number" 
                                  className="w-16 text-center border border-gray-300 rounded-md p-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
                                  value={balance.casualTotal}
                                  onChange={(e) => handleUpdateBalance(idx, 'casualTotal', parseInt(e.target.value))}
                                  disabled={!isAdmin}
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
                {isAdmin && (
                    <button 
                    onClick={handleSaveBalances}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition shadow-sm hover:shadow flex items-center gap-2"
                    >
                    <Save className="h-4 w-4" />
                    حفظ التعديلات
                    </button>
                )}
                {!isAdmin && (
                    <button onClick={() => setIsBalanceModalOpen(false)} className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition">
                        إغلاق
                    </button>
                )}
             </div>
          </div>
        </div>
      )}

      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold">{editingLeaveId ? 'تعديل طلب إجازة' : 'طلب إجازة جديد'}</h3>
                <button onClick={() => setIsRequestModalOpen(false)}><CloseIcon className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium mb-1">الموظف</label>
                    <select 
                        className="w-full border rounded p-2 bg-white" 
                        value={requestForm.employeeName} 
                        onChange={e => setRequestForm({...requestForm, employeeName: e.target.value})}
                        disabled={!!editingLeaveId}
                    >
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
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 font-bold shadow-sm">
                  {editingLeaveId ? 'حفظ التعديلات' : 'إرسال الطلب'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
