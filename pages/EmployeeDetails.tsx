
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MOCK_EMPLOYEES, 
  MOCK_ATTENDANCE, 
  MOCK_INSURANCE, 
  MOCK_CONTRACTS, 
  MOCK_PAYROLL,
  MOCK_LEAVES
} from '../constants';
import { 
  ArrowRight, 
  User, 
  Briefcase, 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  ShieldCheck,
  Clock,
  Download,
  Hash, // Added Hash icon
  Car
} from 'lucide-react';

const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'job' | 'financial' | 'documents'>('profile');

  const employee = MOCK_EMPLOYEES.find(e => e.id === id);

  if (!employee) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800">الموظف غير موجود</h2>
        <button 
          onClick={() => navigate('/employees')} 
          className="mt-4 text-indigo-600 hover:underline"
        >
          العودة لقائمة الموظفين
        </button>
      </div>
    );
  }

  // Find related data based on name (mock relationship)
  const insurance = MOCK_INSURANCE.find(i => i.employeeName === employee.name);
  const contract = MOCK_CONTRACTS.find(c => c.employeeName === employee.name);
  const payroll = MOCK_PAYROLL.find(p => p.employeeName === employee.name);
  const recentAttendance = MOCK_ATTENDANCE.filter(a => a.employeeName === employee.name).slice(0, 5);
  const leaves = MOCK_LEAVES.filter(l => l.employeeName === employee.name);

  return (
    <div className="space-y-6">
      {/* Header / Back Button */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/employees')} 
          className="rounded-full bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-50"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">ملف الموظف</h2>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <img 
            src={employee.avatar} 
            alt={employee.name} 
            className="h-24 w-24 rounded-full object-cover border-4 border-indigo-50"
          />
          <div className="flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
                <p className="text-gray-500">{employee.jobTitle} - {employee.department}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.status === 'active' ? 'نشط' : 'غير نشط'}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {employee.contractType}
                  </span>
                  {employee.isDriver && (
                     <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                        <Car className="h-3 w-3 mr-1" /> سائق
                     </span>
                  )}
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex gap-3">
                 <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">تعديل</button>
                 <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">طباعة التقرير</button>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                 <Hash className="h-4 w-4 text-gray-400" />
                 <span className="font-mono font-bold text-gray-800">{employee.employeeCode}</span>
              </div>
              <div className="flex items-center gap-2">
                 <CreditCard className="h-4 w-4 text-gray-400" />
                 <span className="font-mono">{employee.nationalId}</span>
              </div>
              <div className="flex items-center gap-2">
                 <Mail className="h-4 w-4 text-gray-400" />
                 <span>employee@company.com</span>
              </div>
              <div className="flex items-center gap-2">
                 <Phone className="h-4 w-4 text-gray-400" />
                 <span>+20 123 456 7890</span>
              </div>
              <div className="flex items-center gap-2">
                 <MapPin className="h-4 w-4 text-gray-400" />
                 <span>القاهرة، مصر</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 space-x-reverse" aria-label="Tabs">
          {[
            { id: 'profile', label: 'البيانات الشخصية', icon: User },
            { id: 'job', label: 'معلومات العمل', icon: Briefcase },
            { id: 'financial', label: 'المالية والتأمين', icon: CreditCard },
            { id: 'documents', label: 'المستندات', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
              `}
            >
              <tab.icon className={`-ml-0.5 ml-2 h-5 w-5 ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-2">البيانات الأساسية</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">الاسم الكامل</label>
                    <p className="font-medium">{employee.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">الكود الوظيفي</label>
                    <p className="font-medium text-indigo-600 font-mono">{employee.employeeCode}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">الجنسية</label>
                    <p className="font-medium">مصر</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">تاريخ الميلاد</label>
                    <p className="font-medium">01/01/1990</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">الحالة الاجتماعية</label>
                    <p className="font-medium">متزوج</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">النوع</label>
                    <p className="font-medium">ذكر</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">الديانة</label>
                    <p className="font-medium">مسلم</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-2">الهوية والمؤهلات</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <CreditCard className="h-6 w-6 text-indigo-500" />
                    <div>
                       <p className="text-xs text-gray-500">الرقم القومي</p>
                       <p className="font-mono font-medium">{employee.nationalId}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    <div>
                       <label className="text-xs text-gray-500">المؤهل الدراسي</label>
                       <p className="font-medium">بكالوريوس حاسبات ومعلومات - جامعة القاهرة</p>
                    </div>
                    <div>
                       <label className="text-xs text-gray-500">سنة التخرج</label>
                       <p className="font-medium">2012</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'job' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                   <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-2">معلومات الوظيفة</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-xs text-gray-500">المسمى الوظيفي</label>
                         <p className="font-medium">{employee.jobTitle}</p>
                      </div>
                      <div>
                         <label className="text-xs text-gray-500">القسم</label>
                         <p className="font-medium">{employee.department}</p>
                      </div>
                      <div>
                         <label className="text-xs text-gray-500">تاريخ التعيين</label>
                         <p className="font-medium font-mono">{employee.joinDate}</p>
                      </div>
                      <div>
                         <label className="text-xs text-gray-500">موقع العمل</label>
                         <p className="font-medium">المقر الرئيسي</p>
                      </div>
                      <div>
                         <label className="text-xs text-gray-500">نوع الدوام</label>
                         <p className="font-medium">{employee.contractType}</p>
                      </div>
                      <div>
                         <label className="text-xs text-gray-500">تاريخ نهاية الخدمة</label>
                         <p className="font-medium font-mono text-gray-800">{employee.endOfServiceDate || '-'}</p>
                      </div>
                   </div>
                </div>

                {/* Driver Information Block - Only visible if isDriver */}
                {employee.isDriver && (
                   <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 text-indigo-700">
                         <Car className="h-5 w-5" />
                         <h3 className="font-bold text-lg">بيانات السائق</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs text-gray-500">رقم الرخصة</label>
                            <p className="font-mono font-bold text-gray-800">{employee.driverLicenseNumber}</p>
                         </div>
                         <div>
                            <label className="text-xs text-gray-500">تاريخ انتهاء الرخصة</label>
                            <p className="font-mono font-bold text-gray-800">{employee.driverLicenseExpiry}</p>
                         </div>
                      </div>
                   </div>
                )}

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                   <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-2">بيانات العقد</h3>
                   {contract ? (
                      <div className="space-y-4">
                         <div className="flex justify-between">
                            <span className="text-gray-500">نوع العقد:</span>
                            <span className="font-medium">{contract.type}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-gray-500">تاريخ البدء:</span>
                            <span className="font-medium font-mono">{contract.startDate}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-gray-500">تاريخ الانتهاء:</span>
                            <span className="font-medium font-mono">{contract.endDate}</span>
                         </div>
                         <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500">الحالة:</span>
                            <span className={`px-2 py-1 rounded text-xs ${contract.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                               {contract.status === 'active' ? 'ساري' : 'منتهي'}
                            </span>
                         </div>
                      </div>
                   ) : (
                      <p className="text-gray-400 text-sm text-center py-4">لا توجد بيانات عقد مسجلة</p>
                   )}
                </div>
             </div>

             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">سجل الحضور الأخير</h3>
                {recentAttendance.length > 0 ? (
                   <table className="w-full text-right text-sm">
                      <thead className="bg-gray-50">
                         <tr>
                            <th className="px-4 py-2">التاريخ</th>
                            <th className="px-4 py-2">دخول</th>
                            <th className="px-4 py-2">خروج</th>
                            <th className="px-4 py-2">الحالة</th>
                         </tr>
                      </thead>
                      <tbody>
                         {recentAttendance.map(a => (
                            <tr key={a.id} className="border-b border-gray-50 last:border-0">
                               <td className="px-4 py-3 font-mono text-gray-600">{a.date}</td>
                               <td className="px-4 py-3 font-mono">{a.checkIn}</td>
                               <td className="px-4 py-3 font-mono">{a.checkOut}</td>
                               <td className="px-4 py-3">
                                  <span className={`text-xs px-2 py-1 rounded ${a.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                     {a.status === 'present' ? 'حضور' : a.status}
                                  </span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                ) : (
                   <p className="text-gray-400 text-sm text-center py-4">لا يوجد سجل حضور حديث</p>
                )}
             </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <CreditCard className="h-5 w-5 text-indigo-500" />
                   الراتب والبدلات
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">الراتب الأساسي</span>
                      <span className="font-bold text-lg">{employee.salary.toLocaleString()} ج.م</span>
                   </div>
                   {payroll && (
                      <>
                         <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="text-gray-500">بدلات ثابتة</span>
                            <span className="font-medium text-green-600">+{payroll.allowances.toLocaleString()} ج.م</span>
                         </div>
                         <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="text-gray-500">حوافز ومكافآت</span>
                            <span className="font-medium text-green-600">+{payroll.incentives.toLocaleString()} ج.م</span>
                         </div>
                         {/* Transport Allowance Display */}
                         {payroll.transportAllowance > 0 && (
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2 bg-blue-50 px-2 rounded">
                               <span className="text-blue-600 text-sm">بدل انتقال / رحلات</span>
                               <span className="font-medium text-blue-600">+{payroll.transportAllowance.toLocaleString()} ج.م</span>
                            </div>
                         )}
                         <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="text-gray-500">استقطاعات (تأمين/ضرائب)</span>
                            <span className="font-medium text-red-600">-{payroll.deductions.toLocaleString()} ج.م</span>
                         </div>
                         <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-gray-800">صافي الراتب المتوقع</span>
                            <span className="font-bold text-xl text-indigo-600">{payroll.netSalary.toLocaleString()} ج.م</span>
                         </div>
                      </>
                   )}
                </div>
             </div>

             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <ShieldCheck className="h-5 w-5 text-indigo-500" />
                   بيانات التأمين
                </h3>
                {insurance ? (
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs text-gray-500">الرقم التأميني</label>
                            <p className="font-mono font-medium">{insurance.insuranceNumber}</p>
                         </div>
                         <div>
                            <label className="text-xs text-gray-500">تاريخ الاشتراك</label>
                            <p className="font-mono font-medium">{employee.joinDate}</p>
                         </div>
                         <div>
                            <label className="text-xs text-gray-500">الأجر التأميني</label>
                            <p className="font-medium">{insurance.salaryInsured.toLocaleString()} ج.م</p>
                         </div>
                         <div>
                            <label className="text-xs text-gray-500">الحالة</label>
                            <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">مؤمن عليه</span>
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="text-center py-8 text-gray-400">
                      <p>لا توجد بيانات تأمينية مرتبطة</p>
                      <button className="mt-2 text-indigo-600 text-sm hover:underline">إضافة سجل تأميني</button>
                   </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'documents' && (
           <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-gray-800">مستندات الموظف</h3>
                 <button className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100">
                    رفع مستند جديد
                 </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {[
                    { name: 'صورة البطاقة الشخصية.pdf', type: 'PDF', size: '2.5 MB' },
                    { name: 'عقد العمل.pdf', type: 'PDF', size: '1.8 MB' },
                    { name: 'شهادة التخرج.jpg', type: 'Image', size: '4.2 MB' },
                    { name: 'صحيفة الحالة الجنائية.pdf', type: 'PDF', size: '1.2 MB' },
                 ].map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-indigo-200 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                             <FileText className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                             <p className="text-xs text-gray-500">{doc.size} • {doc.type}</p>
                          </div>
                       </div>
                       <button className="text-gray-400 hover:text-indigo-600">
                          <Download className="h-4 w-4" />
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetails;
