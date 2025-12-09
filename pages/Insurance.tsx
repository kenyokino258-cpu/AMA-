import React, { useState } from 'react';
import { MOCK_INSURANCE } from '../constants';
import { InsuranceRecord } from '../types';
import { ShieldCheck, Plus, ExternalLink, Search, DollarSign, Users, FileSearch, X, AlertCircle } from 'lucide-react';
import DataControls from '../components/DataControls';

const Insurance: React.FC = () => {
  const [insuranceData, setInsuranceData] = useState<InsuranceRecord[]>(MOCK_INSURANCE);
  const [searchTerm, setSearchTerm] = useState('');
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [queryInput, setQueryInput] = useState('');
  const [queryResult, setQueryResult] = useState<InsuranceRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const isAdmin = true;

  const handleImport = (data: any[]) => {
    const newItems = data.map((d, i) => ({ ...MOCK_INSURANCE[0], ...d, id: `IMP-INS-${i}` }));
    setInsuranceData([...insuranceData, ...newItems]);
  };

  const filteredData = insuranceData.filter(item => 
    item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.insuranceNumber.includes(searchTerm)
  );

  const totalCompanyShare = insuranceData.reduce((acc, curr) => acc + curr.companyShare, 0);

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = insuranceData.find(r => r.insuranceNumber === queryInput);
    setQueryResult(found || null);
    setHasSearched(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">التأمينات الاجتماعية</h2>
          <p className="text-sm text-gray-500 mt-1">إدارة الملفات التأمينية وحصص الموظف والشركة</p>
        </div>
        <div className="flex gap-3">
          <DataControls 
            data={insuranceData} 
            fileName="social_insurance_data" 
            isAdmin={isAdmin}
            onImport={handleImport}
            headers={[
              { key: 'employeeName', label: 'الموظف' },
              { key: 'insuranceNumber', label: 'الرقم التأميني' },
              { key: 'salaryInsured', label: 'الأجر التأميني' },
              { key: 'companyShare', label: 'حصة الشركة' },
              { key: 'employeeShare', label: 'حصة الموظف' }
            ]}
          />
          <button 
            onClick={() => {
              setIsQueryModalOpen(true);
              setQueryInput('');
              setHasSearched(false);
              setQueryResult(null);
            }}
            className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <FileSearch className="h-5 w-5 text-gray-500" />
            <span>استعلام</span>
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-white shadow-md hover:bg-indigo-700 transition-all hover:shadow-lg active:scale-95">
            <Plus className="h-5 w-5" />
            <span>إضافة مؤمن عليه</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
             <div>
                 <p className="text-sm font-medium text-blue-600 mb-1">إجمالي المؤمن عليهم</p>
                 <p className="text-4xl font-bold text-gray-800">{insuranceData.length}</p>
             </div>
             <div className="bg-blue-100 p-4 rounded-full shadow-sm">
                 <Users className="h-8 w-8 text-blue-600" />
             </div>
         </div>
         <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-100 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
             <div>
                 <p className="text-sm font-medium text-green-600 mb-1">إجمالي تكلفة الشركة (شهرياً)</p>
                 <p className="text-4xl font-bold text-gray-800">{totalCompanyShare.toLocaleString()} <span className="text-lg text-gray-400 font-medium">ج.م</span></p>
             </div>
             <div className="bg-green-100 p-4 rounded-full shadow-sm">
                 <DollarSign className="h-8 w-8 text-green-600" />
             </div>
         </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center p-5 border-b border-gray-100 bg-gray-50/50">
           <div className="relative w-full sm:w-96">
             <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
             <input 
               type="text" 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="بحث بالاسم أو الرقم التأميني..."
               className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
             />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">الموظف</th>
                <th className="px-6 py-4 font-semibold">الرقم التأميني</th>
                <th className="px-6 py-4 font-semibold">الأجر التأميني</th>
                <th className="px-6 py-4 font-semibold">حصة الشركة</th>
                <th className="px-6 py-4 font-semibold">حصة الموظف</th>
                <th className="px-6 py-4 font-semibold">الحالة</th>
                <th className="px-6 py-4 font-semibold text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.length > 0 ? (
                filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                       <div className="bg-indigo-50 p-1.5 rounded text-indigo-600">
                          <ShieldCheck className="h-4 w-4" />
                       </div>
                       {record.employeeName}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono tracking-wide">{record.insuranceNumber}</td>
                    <td className="px-6 py-4 text-gray-900 font-bold font-mono">{record.salaryInsured.toLocaleString()} ج.م</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{record.companyShare.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{record.employeeShare.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border
                        ${record.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}
                      `}>
                        {record.status === 'active' ? 'مؤمن عليه' : 'قيد التسجيل'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all">
                          <ExternalLink className="h-4 w-4" />
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 bg-gray-50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="h-8 w-8 text-gray-300" />
                      <p>لا توجد سجلات مطابقة</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Query Modal */}
      {isQueryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800">استعلام عن الرقم التأميني</h3>
              <button 
                onClick={() => setIsQueryModalOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleQuerySubmit} className="relative mb-6">
                <input
                  type="text"
                  required
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="أدخل الرقم التأميني للبحث..."
                  className="w-full rounded-xl border border-gray-300 p-3 pr-12 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <button 
                  type="submit"
                  className="absolute left-2 top-1.5 bottom-1.5 bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                >
                  بحث
                </button>
                <FileSearch className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </form>

              {hasSearched && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  {queryResult ? (
                    <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-green-200/50 text-green-800 font-bold">
                        <div className="bg-white p-1 rounded-full shadow-sm">
                           <ShieldCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <span>بيانات تأمينية نشطة</span>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">الاسم:</span>
                          <span className="font-bold text-gray-900">{queryResult.employeeName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">الرقم التأميني:</span>
                          <span className="font-mono font-medium bg-white px-2 py-0.5 rounded border border-green-100">{queryResult.insuranceNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">الأجر التأميني:</span>
                          <span className="font-medium">{queryResult.salaryInsured.toLocaleString()} ج.م</span>
                        </div>
                         <div className="flex justify-between">
                          <span className="text-gray-600">حصة الشركة:</span>
                          <span className="font-medium">{queryResult.companyShare.toLocaleString()} ج.م</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 rounded-xl p-6 border border-red-100 text-center">
                      <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                         <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <p className="font-bold text-red-800 mb-1">لم يتم العثور على بيانات</p>
                      <p className="text-sm text-red-600 opacity-80">تأكد من صحة الرقم التأميني وحاول مرة أخرى.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insurance;