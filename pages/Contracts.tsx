import React, { useState } from 'react';
import { MOCK_CONTRACTS, MOCK_CONTRACT_HISTORY } from '../constants';
import { Contract, ContractHistory } from '../types';
import { FileText, Plus, AlertTriangle, CheckCircle, Clock, Eye, X, History, FilePenLine, Search, Filter, ChevronDown } from 'lucide-react';
import DataControls from '../components/DataControls';

const Contracts: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>(MOCK_CONTRACTS);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const isAdmin = true;

  const handleImport = (data: any[]) => {
    const newItems = data.map((d, i) => ({ ...MOCK_CONTRACTS[0], ...d, id: `IMP-CON-${i}` }));
    setContracts([...contracts, ...newItems]);
  };

  const getContractHistory = (contractId: string) => {
    return MOCK_CONTRACT_HISTORY.filter(h => h.contractId === contractId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة العقود</h2>
          <p className="text-sm text-gray-500 mt-1">متابعة عقود الموظفين، التجديد، وسجل الملاحق</p>
        </div>
        <div className="flex gap-3">
          <DataControls 
            data={contracts} 
            fileName="contracts_data" 
            isAdmin={isAdmin}
            onImport={handleImport}
            headers={[
              { key: 'employeeName', label: 'الموظف' },
              { key: 'type', label: 'نوع العقد' },
              { key: 'startDate', label: 'تاريخ البدء' },
              { key: 'endDate', label: 'تاريخ الانتهاء' },
              { key: 'status', label: 'الحالة' }
            ]}
          />
          <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-md hover:bg-indigo-700 transition-all hover:shadow-lg active:scale-95">
            <Plus className="h-5 w-5" />
            <span>عقد جديد</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-green-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">عقود سارية</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{contracts.filter(c => c.status === 'active').length}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-yellow-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">أوشكت على الانتهاء</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{contracts.filter(c => c.status === 'expiring').length}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-red-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">منتهية</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{contracts.filter(c => c.status === 'expired').length}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-full">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Table */}
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
          <div className="flex items-center gap-2 relative">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pr-9 pl-8 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none cursor-pointer hover:border-gray-300 transition-colors w-48"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">ساري</option>
              <option value="expiring">ينتهي قريباً</option>
              <option value="expired">منتهي</option>
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">الموظف</th>
                <th className="px-6 py-4 font-semibold">نوع العقد</th>
                <th className="px-6 py-4 font-semibold">تاريخ البدء</th>
                <th className="px-6 py-4 font-semibold">تاريخ الانتهاء</th>
                <th className="px-6 py-4 font-semibold">الحالة</th>
                <th className="px-6 py-4 font-semibold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">{contract.employeeName}</td>
                    <td className="px-6 py-4 text-gray-600">{contract.type}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{contract.startDate}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{contract.endDate}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border
                        ${contract.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 
                          contract.status === 'expiring' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-red-50 text-red-700 border-red-100'}
                      `}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          contract.status === 'active' ? 'bg-green-500' : 
                          contract.status === 'expiring' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></span>
                        {contract.status === 'active' ? 'ساري' : contract.status === 'expiring' ? 'ينتهي قريباً' : 'منتهي'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => setSelectedContract(contract)}
                            className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition-colors flex items-center gap-1"
                            title="عرض السجل"
                          >
                            <History className="h-4 w-4" />
                         </button>
                         <button className="text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700 p-2 rounded-lg transition-colors" title="تحميل العقد">
                            <FileText className="h-4 w-4" />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 bg-gray-50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-gray-300" />
                      <p>لا توجد عقود مطابقة للبحث</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Details & History Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-gray-100 p-6">
                <div>
                   <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FilePenLine className="h-6 w-6 text-indigo-600" />
                      تفاصيل العقد والسجل
                   </h3>
                   <p className="text-sm text-gray-500 mt-1">سجل التغييرات والملاحق لـ <span className="font-medium text-gray-700">{selectedContract.employeeName}</span></p>
                </div>
                <button 
                  onClick={() => setSelectedContract(null)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                 {/* Current Contract Info */}
                 <div className="bg-indigo-50/50 rounded-xl p-5 mb-8 border border-indigo-100">
                    <h4 className="text-indigo-800 font-bold text-sm mb-4 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      الوضع الحالي
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <p className="text-xs text-gray-500 mb-1">نوع العقد</p>
                          <p className="font-medium text-gray-900">{selectedContract.type}</p>
                       </div>
                       <div>
                          <p className="text-xs text-gray-500 mb-1">الحالة</p>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                             ${selectedContract.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                             {selectedContract.status === 'active' ? 'ساري' : 'منتهي'}
                          </span>
                       </div>
                       <div>
                          <p className="text-xs text-gray-500 mb-1">تاريخ البداية</p>
                          <p className="font-mono font-medium text-gray-900">{selectedContract.startDate}</p>
                       </div>
                       <div>
                          <p className="text-xs text-gray-500 mb-1">تاريخ النهاية</p>
                          <p className="font-mono font-medium text-gray-900">{selectedContract.endDate}</p>
                       </div>
                    </div>
                 </div>

                 <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                    <History className="h-5 w-5 text-gray-400" />
                    الجدول الزمني للتغييرات
                 </h4>

                 {/* Timeline */}
                 <div className="relative border-r-2 border-gray-200 mr-3 pr-8 space-y-8 pb-4">
                    {getContractHistory(selectedContract.id).length > 0 ? (
                       getContractHistory(selectedContract.id).map((event) => (
                          <div key={event.id} className="relative group">
                             {/* Dot */}
                             <div className="absolute -right-[39px] top-1.5 h-5 w-5 rounded-full border-4 border-white bg-indigo-500 shadow-sm group-hover:scale-110 transition-transform"></div>
                             
                             <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 bg-white p-4 rounded-lg border border-gray-100 shadow-sm group-hover:border-indigo-100 transition-colors">
                                <div>
                                   <p className="font-bold text-gray-800 text-sm">{event.type}</p>
                                   <p className="text-gray-600 text-sm mt-1 leading-relaxed">{event.details}</p>
                                   {event.documentUrl && (
                                      <button className="mt-3 text-indigo-600 text-xs flex items-center gap-1 hover:underline font-medium bg-indigo-50 px-2 py-1 rounded-md w-fit">
                                         <FileText className="h-3 w-3" />
                                         عرض الملحق
                                      </button>
                                   )}
                                </div>
                                <div className="text-left sm:text-left shrink-0">
                                   <span className="text-xs font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded block mb-1">
                                      {event.date}
                                   </span>
                                   <p className="text-[10px] text-gray-400">بواسطة: {event.changedBy}</p>
                                </div>
                             </div>
                          </div>
                       ))
                    ) : (
                       <p className="text-gray-400 text-sm italic">لا يوجد سجل تغييرات سابق لهذا العقد.</p>
                    )}
                 </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                 <button 
                   onClick={() => setSelectedContract(null)}
                   className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium shadow-sm transition-colors"
                 >
                   إغلاق
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;