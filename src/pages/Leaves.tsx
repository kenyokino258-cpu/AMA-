
import React, { useState, useEffect, useContext } from 'react';
import { MOCK_LEAVES, MOCK_LEAVE_BALANCES, MOCK_EMPLOYEES } from '../constants';
import { LeaveRequest, LeaveBalance, UserRole } from '../types';
import { Calendar, Check, X, Clock, PlusCircle, Settings, X as CloseIcon, Search, Filter, PieChart, ShieldCheck, UserCheck } from 'lucide-react';
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
  
  const [requestForm, setRequestForm] = useState({
    employeeName: '',
    type: 'سنوي',
    startDate: '',
    endDate: '',
    days: 1
  });

  const isAdmin = true;
  const leaveTypes = ['سنوي', 'مرضي', 'عارضة', 'بدون راتب', 'إجازة وضع', 'إجازة أبوة'];

  useEffect(() => { localStorage.setItem('leaves_data', JSON.stringify(leaves)); }, [leaves]);
  useEffect(() => { localStorage.setItem('leaves_balances', JSON.stringify(balances)); }, [balances]);

  const handleImport = (data: any[]) => {
    const newItems = data.map((d, i) => ({ ...MOCK_LEAVES[0], ...d, id: `IMP-LV-${i}` }));
    setLeaves(prev => [...prev, ...newItems]);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLeave: LeaveRequest = {
      id: `LR-${Date.now()}`,
      employeeName: currentUser?.role === UserRole.EMPLOYEE ? currentUser.fullName : requestForm.employeeName,
      type: requestForm.type as any,
      startDate: requestForm.startDate,
      endDate: requestForm.endDate,
      days: Number(requestForm.days),
      status: 'pending' 
    };
    setLeaves([newLeave, ...leaves]);
    addNotification('طلب إجازة جديد', `قام ${newLeave.employeeName} بتقديم طلب إجازة.`);
    setIsRequestModalOpen(false);
    setRequestForm({ employeeName: '', type: 'سنوي', startDate: '', endDate: '', days: 1 });
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
       <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div><h2 className="text-2xl font-bold text-gray-800">إدارة الإجازات</h2><p className="text-sm text-gray-500 mt-1">طلبات الإجازات، الأرصدة المتبقية، وسجل الغياب</p></div>
        <div className="flex gap-3">
          {currentUser?.role !== UserRole.EMPLOYEE && <DataControls data={leaves} fileName="leaves_requests" isAdmin={isAdmin} onImport={handleImport} />}
          <button onClick={() => setIsBalanceModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-gray-700 shadow-sm hover:bg-gray-50 transition-all"><Settings className="h-5 w-5 text-gray-500" /><span>{currentUser?.role === UserRole.EMPLOYEE ? 'رصيدي' : 'إدارة الأرصدة'}</span></button>
          <button onClick={() => setIsRequestModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-md hover:bg-indigo-700 transition-all"><PlusCircle className="h-5 w-5" /><span>طلب إجازة</span></button>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center bg-gray-50/50">
          <div className="relative flex-1"><Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="بحث باسم الموظف..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-4 focus:border-indigo-500 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
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
              {leaves.filter(l => l.employeeName.toLowerCase().includes(searchTerm.toLowerCase())).map((leave) => (
                  <tr key={leave.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{leave.employeeName}</td>
                    <td className="px-6 py-4"><span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{leave.type}</span></td>
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
                        {currentUser?.role !== UserRole.EMPLOYEE && (
                            <div className="flex items-center justify-center gap-2">
                                {leave.status === 'pending' && (
                                    <button onClick={() => handleReview(leave.id)} className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded hover:bg-yellow-100 transition">مراجعة</button>
                                )}
                                {leave.status === 'reviewed' && (
                                    <button onClick={() => handleApprove(leave.id)} className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition font-bold">اعتماد</button>
                                )}
                                {(leave.status !== 'approved' && leave.status !== 'rejected') && (
                                    <button onClick={() => handleReject(leave.id)} className="p-1 rounded text-red-500 hover:bg-red-50" title="رفض"><X className="h-4 w-4" /></button>
                                )}
                            </div>
                        )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex justify-between mb-4"><h3 className="text-lg font-bold">طلب إجازة</h3><button onClick={() => setIsRequestModalOpen(false)}><CloseIcon className="h-5 w-5" /></button></div>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {currentUser?.role !== UserRole.EMPLOYEE && (
                  <div>
                    <label className="block text-sm font-medium mb-1">الموظف</label>
                    <select className="w-full border rounded p-2" value={requestForm.employeeName} onChange={e => setRequestForm({...requestForm, employeeName: e.target.value})}>
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
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">إرسال الطلب</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
