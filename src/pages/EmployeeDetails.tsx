
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MOCK_EMPLOYEES, 
  MOCK_ATTENDANCE, 
  MOCK_INSURANCE, 
  MOCK_CONTRACTS, 
  MOCK_PAYROLL,
  MOCK_LEAVE_BALANCES,
  MOCK_LOANS,
  DEPARTMENTS as DEFAULT_DEPTS,
  MOCK_ASSET_TYPES,
  MOCK_DOCUMENT_TYPES
} from '../constants';
import { 
  ArrowRight, 
  User, 
  Briefcase, 
  CreditCard, 
  Phone, 
  Mail, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Download, 
  Hash,
  Car,
  Printer,
  Edit,
  X,
  Award,
  Plus,
  Trash2,
  Upload,
  Paperclip,
  Eye,
  RefreshCw,
  Box,
  Monitor,
  Users
} from 'lucide-react';
import { Employee, CustodyItem, Dependent, SystemDefinition } from '../types';
import { AppContext } from '../App';
import { api } from '../services/api';

const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isServerOnline, t } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState<'profile' | 'job' | 'financial' | 'custody' | 'documents'>('profile');
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isMasterCardOpen, setIsMasterCardOpen] = useState(false);
  const [isCustodyModalOpen, setIsCustodyModalOpen] = useState(false);
  const [isDependentModalOpen, setIsDependentModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [newCert, setNewCert] = useState({ name: '', date: '' });
  const [certFile, setCertFile] = useState<File | null>(null);
  
  // Custody Form
  const [custodyForm, setCustodyForm] = useState<Partial<CustodyItem>>({
      name: '', type: '', serialNumber: '', receivedDate: new Date().toISOString().split('T')[0], status: 'Active', notes: ''
  });

  // Dependent Form
  const [dependentForm, setDependentForm] = useState<Partial<Dependent>>({
      name: '', relation: 'Wife', birthDate: '', nationalId: '', isInsured: false
  });

  // Document Form
  const [newDoc, setNewDoc] = useState({ type: '', expiry: '' });
  const [docFile, setDocFile] = useState<File | null>(null);

  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPTS);
  const [assetTypes, setAssetTypes] = useState<SystemDefinition[]>(MOCK_ASSET_TYPES);
  const [docTypes, setDocTypes] = useState<SystemDefinition[]>(MOCK_DOCUMENT_TYPES);
  
  const contractInputRef = useRef<HTMLInputElement>(null);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
        let found: Employee | undefined;

        if (isServerOnline) {
            const data = await api.getEmployees();
            found = data.find((e: Employee) => e.id === id);
        } else {
            const savedEmployees = localStorage.getItem('employees_data');
            const allEmployees: Employee[] = savedEmployees ? JSON.parse(savedEmployees) : MOCK_EMPLOYEES;
            found = allEmployees.find(e => e.id === id);
        }

        if (found) {
            if (!found.certificates) found.certificates = [];
            if (!found.custody) found.custody = [];
            if (!found.dependents) found.dependents = [];
            // @ts-ignore
            if (!found.documents) found.documents = [
                { id: 'd1', name: 'صورة البطاقة الشخصية.pdf', type: 'PDF', category: 'بطاقة رقم قومي', size: '2.5 MB', date: '2023-01-01' },
                { id: 'd2', name: 'صحيفة الحالة الجنائية.pdf', type: 'PDF', category: 'صحيفة حالة جنائية', size: '1.2 MB', date: '2023-01-01' }
            ];
            setEmployee(found);
            setEditForm(found);
        }
    } catch (error) {
        console.error("Error fetching employee:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
    const savedDepts = localStorage.getItem('system_departments');
    if (savedDepts) setDepartments(JSON.parse(savedDepts));
    const savedAssets = localStorage.getItem('system_asset_types');
    if (savedAssets) setAssetTypes(JSON.parse(savedAssets));
    const savedDocs = localStorage.getItem('system_document_types');
    if (savedDocs) setDocTypes(JSON.parse(savedDocs));
  }, [id, isServerOnline]);

  if (!employee && !loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="bg-red-50 p-6 rounded-full mb-4">
           <User className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">الموظف غير موجود</h2>
        <p className="text-gray-500 mt-2">لم يتم العثور على بيانات لهذا الموظف، قد يكون تم حذفه.</p>
        <button 
          onClick={() => navigate('/employees')} 
          className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          العودة لقائمة الموظفين
        </button>
      </div>
    );
  }

  if (!employee) return <div className="p-10 text-center">جاري التحميل...</div>;

  const insurance = MOCK_INSURANCE.find(i => i.employeeName === employee.name);
  const contract = MOCK_CONTRACTS.find(c => c.employeeName === employee.name);
  const payroll = MOCK_PAYROLL.find(p => p.employeeName === employee.name);
  const recentAttendance = MOCK_ATTENDANCE.filter(a => a.employeeName === employee.name).slice(0, 5);
  const leaveBalance = MOCK_LEAVE_BALANCES.find(b => b.employeeName === employee.name);
  const activeLoans = MOCK_LOANS.filter(l => l.employeeName === employee.name && l.status === 'active');

  const calculateDuration = (startDate: string) => {
      const start = new Date(startDate);
      const end = new Date();
      let years = end.getFullYear() - start.getFullYear();
      let months = end.getMonth() - start.getMonth();
      if (months < 0) { years--; months += 12; }
      return { years, months };
  };
  const serviceDuration = calculateDuration(employee.joinDate);

  const handleUpdateEmployee = async (updatedData: Partial<Employee>) => {
      const newEmployeeData = { ...employee, ...updatedData } as Employee;
      
      if (isServerOnline) {
          try {
              await api.saveEmployee(newEmployeeData);
              setEmployee(newEmployeeData);
          } catch (err) {
              alert('فشل حفظ البيانات على السيرفر');
              console.error(err);
          }
      } else {
          const savedEmployees = localStorage.getItem('employees_data');
          let allEmployees: Employee[] = savedEmployees ? JSON.parse(savedEmployees) : MOCK_EMPLOYEES;
          allEmployees = allEmployees.map(e => e.id === employee.id ? newEmployeeData : e);
          localStorage.setItem('employees_data', JSON.stringify(allEmployees));
          setEmployee(newEmployeeData);
      }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdateEmployee(editForm);
    setIsEditModalOpen(false);
    alert('تم حفظ بيانات الموظف بنجاح');
  };

  const handleAddCertificate = (e: React.FormEvent) => {
      e.preventDefault();
      let fileData = {};
      if (certFile) {
          fileData = {
              fileName: certFile.name,
              fileUrl: URL.createObjectURL(certFile)
          };
      }
      const newCertificate = { 
          id: `CERT-${Date.now()}`,
          name: newCert.name, 
          date: newCert.date,
          ...fileData
      };
      const updatedCerts = [...(employee.certificates || []), newCertificate];
      handleUpdateEmployee({ certificates: updatedCerts });
      setIsCertModalOpen(false);
      setNewCert({ name: '', date: '' });
      setCertFile(null);
  };

  const handleAddCustody = (e: React.FormEvent) => {
      e.preventDefault();
      const newCustodyItem = {
          ...custodyForm,
          id: `CUST-${Date.now()}`,
          status: 'Active'
      } as CustodyItem;
      const updatedCustody = [...(employee.custody || []), newCustodyItem];
      handleUpdateEmployee({ custody: updatedCustody });
      setIsCustodyModalOpen(false);
      setCustodyForm({ name: '', type: '', serialNumber: '', receivedDate: new Date().toISOString().split('T')[0], status: 'Active', notes: '' });
  };

  const handleDeleteCustody = (index: number) => {
      if(window.confirm('هل أنت متأكد من حذف هذه العهدة؟')) {
          const updatedCustody = [...(employee.custody || [])];
          updatedCustody.splice(index, 1);
          handleUpdateEmployee({ custody: updatedCustody });
      }
  };

  const handleAddDependent = (e: React.FormEvent) => {
      e.preventDefault();
      const newDependent = {
          ...dependentForm,
          id: `DEP-${Date.now()}`
      } as Dependent;
      const updatedDeps = [...(employee.dependents || []), newDependent];
      handleUpdateEmployee({ dependents: updatedDeps });
      setIsDependentModalOpen(false);
      setDependentForm({ name: '', relation: 'Wife', birthDate: '', nationalId: '', isInsured: false });
  };

  const handleDeleteDependent = (index: number) => {
      if(window.confirm('هل أنت متأكد من حذف هذا التابع؟')) {
          const updatedDeps = [...(employee.dependents || [])];
          updatedDeps.splice(index, 1);
          handleUpdateEmployee({ dependents: updatedDeps });
      }
  };

  const handleDeleteCertificate = (index: number) => {
      if(window.confirm('هل أنت متأكد من حذف هذه الشهادة؟')) {
          const updatedCerts = [...(employee.certificates || [])];
          updatedCerts.splice(index, 1);
          handleUpdateEmployee({ certificates: updatedCerts });
      }
  };

  const handleAddDocument = (e: React.FormEvent) => {
      e.preventDefault();
      if (docFile) {
          const newDocItem = {
              id: `DOC-${Date.now()}`,
              name: docFile.name,
              type: docFile.name.split('.').pop()?.toUpperCase() || 'FILE',
              category: newDoc.type || 'عام',
              size: `${(docFile.size / 1024 / 1024).toFixed(1)} MB`,
              date: new Date().toISOString().split('T')[0],
              fileUrl: URL.createObjectURL(docFile)
          };
          // @ts-ignore
          const updatedDocs = [...(employee.documents || []), newDocItem];
          // @ts-ignore
          handleUpdateEmployee({ documents: updatedDocs });
          alert('تم رفع المستند بنجاح');
          setIsDocModalOpen(false);
          setNewDoc({ type: '', expiry: '' });
          setDocFile(null);
      }
  };

  const handleContractUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          handleUpdateEmployee({
              contractFile: {
                  fileName: file.name,
                  fileUrl: URL.createObjectURL(file)
              }
          });
          alert('تم إرفاق ملف العقد بنجاح');
      }
      if (contractInputRef.current) contractInputRef.current.value = '';
  };

  const handleDeleteDocument = (index: number) => {
      if(window.confirm('هل أنت متأكد من حذف هذا المستند؟')) {
          // @ts-ignore
          const updatedDocs = [...(employee.documents || [])];
          updatedDocs.splice(index, 1);
          // @ts-ignore
          handleUpdateEmployee({ documents: updatedDocs });
      }
  };

  const handleViewFile = (url?: string) => {
      if (url) {
          window.open(url, '_blank');
      } else {
          alert('لا يوجد ملف مرفق');
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/employees')} className="rounded-full bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-50"><ArrowRight className="h-5 w-5" /></button>
            <h2 className="text-2xl font-bold text-gray-800">ملف الموظف</h2>
        </div>
        <button onClick={fetchEmployeeData} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600" title="تحديث البيانات"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <img src={employee.avatar} alt={employee.name} className="h-24 w-24 rounded-full object-cover border-4 border-indigo-50" />
          <div className="flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
                <p className="text-gray-500">{employee.jobTitle} - {employee.department}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{employee.status === 'active' ? 'نشط' : 'غير نشط'}</span>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{employee.contractType}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700 border border-yellow-200"><Clock className="h-3 w-3" />{serviceDuration.years} سنة و {serviceDuration.months} شهر</span>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex gap-3">
                 <button onClick={() => setIsMasterCardOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm"><Briefcase className="h-4 w-4" />كارتة الموظف</button>
                 <button onClick={() => { setEditForm(employee); setIsEditModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors"><Edit className="h-4 w-4" />تعديل</button>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-gray-400" /><span className="font-mono font-bold text-gray-800">{employee.employeeCode}</span></div>
              <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-400" /><span className="font-mono">{employee.nationalId}</span></div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /><span>{employee.email || '-'}</span></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /><span>{employee.phone || '-'}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white px-4 rounded-t-xl overflow-x-auto">
        <nav className="-mb-px flex space-x-8 space-x-reverse min-w-max" aria-label="Tabs">
          {[
            { id: 'profile', label: 'البيانات الشخصية', icon: User },
            { id: 'job', label: 'معلومات العمل', icon: Briefcase },
            { id: 'financial', label: 'المالية والتأمين', icon: CreditCard },
            { id: 'custody', label: 'العهد المستلمة', icon: Box },
            { id: 'documents', label: 'المستندات والشهادات', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
            >
              <tab.icon className={`-ml-0.5 ml-2 h-5 w-5 ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-2">البيانات الأساسية</h3>
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-gray-500">الاسم الكامل</label><p className="font-medium">{employee.name}</p></div>
                  <div><label className="text-xs text-gray-500">الجنسية</label><p className="font-medium">مصر</p></div>
                  <div><label className="text-xs text-gray-500">تاريخ الميلاد</label><p className="font-medium">{employee.birthDate || '-'}</p></div>
                  <div><label className="text-xs text-gray-500">الحالة الاجتماعية</label><p className="font-medium">{employee.maritalStatus || '-'}</p></div>
                  <div className="col-span-2"><label className="text-xs text-gray-500">العنوان</label><p className="font-medium">{employee.address || '-'}</p></div>
              </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Users className="h-5 w-5 text-indigo-600" />الأسرة والتابعين</h3>
                        <button onClick={() => setIsDependentModalOpen(true)} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-100"><Plus className="h-3 w-3" /> إضافة</button>
                    </div>
                    {employee.dependents && employee.dependents.length > 0 ? (
                        <div className="space-y-2">
                            {employee.dependents.map((dep, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-bold text-sm text-gray-800">{dep.name}</p>
                                        <p className="text-xs text-gray-500">{dep.relation} - {dep.birthDate}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {dep.isInsured && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200">مؤمن عليه</span>}
                                        <button onClick={() => handleDeleteDependent(idx)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-gray-400 text-center py-4">لا يوجد تابعين مسجلين</p>}
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
                      <div><label className="text-xs text-gray-500">المسمى الوظيفي</label><p className="font-medium">{employee.jobTitle}</p></div>
                      <div><label className="text-xs text-gray-500">القسم</label><p className="font-medium">{employee.department}</p></div>
                      <div><label className="text-xs text-gray-500">تاريخ التعيين</label><p className="font-medium font-mono">{employee.joinDate}</p></div>
                      <div><label className="text-xs text-gray-500">نوع الدوام</label><p className="font-medium">{employee.contractType}</p></div>
                      <div><label className="text-xs text-gray-500">الوردية</label><p className="font-medium">{employee.shiftName || '-'}</p></div>
                      <div><label className="text-xs text-gray-500">تاريخ نهاية الخدمة</label><p className="font-medium font-mono text-gray-800">{employee.endOfServiceDate || '-'}</p></div>
                   </div>
                </div>

                {employee.isDriver && (
                   <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 text-indigo-700"><Car className="h-5 w-5" /><h3 className="font-bold text-lg">بيانات السائق</h3></div>
                      <div className="grid grid-cols-2 gap-4">
                         <div><label className="text-xs text-gray-500">رقم الرخصة</label><p className="font-mono font-bold text-gray-800">{employee.driverLicenseNumber}</p></div>
                         <div><label className="text-xs text-gray-500">تاريخ انتهاء الرخصة</label><p className="font-mono font-bold text-gray-800">{employee.driverLicenseExpiry}</p></div>
                      </div>
                   </div>
                )}

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                   <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-2">بيانات العقد</h3>
                   <div className="space-y-4">
                        {contract ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div><span className="text-gray-500 text-xs">نوع العقد</span><p className="font-medium">{contract.type}</p></div>
                                <div><span className="text-gray-500 text-xs">الحالة</span><p className={`text-xs ${contract.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{contract.status}</p></div>
                                <div><span className="text-gray-500 text-xs">البداية</span><p className="font-mono">{contract.startDate}</p></div>
                                <div><span className="text-gray-500 text-xs">الانتهاء</span><p className="font-mono">{contract.endDate}</p></div>
                            </div>
                        ) : <p className="text-gray-400 text-sm text-center py-2">لا توجد بيانات عقد مسجلة</p>}
                        
                        <div className="pt-4 border-t border-gray-100">
                            {employee.contractFile ? (
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 overflow-hidden"><FileText className="h-5 w-5 text-indigo-500 flex-shrink-0" /><span className="text-sm truncate text-gray-700">{employee.contractFile.fileName}</span></div>
                                    <button onClick={() => handleViewFile(employee.contractFile?.fileUrl)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded" title="عرض العقد"><Eye className="h-4 w-4" /></button>
                                </div>
                            ) : (
                                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                                    <input type="file" accept=".pdf,image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" ref={contractInputRef} onChange={handleContractUpload} />
                                    <div className="flex flex-col items-center text-gray-500"><Upload className="h-6 w-6 mb-1" /><span className="text-xs">اضغط لرفع نسخة العقد (PDF)</span></div>
                                </div>
                            )}
                        </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-indigo-500" />الراتب والبدلات</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"><span className="text-gray-600">الراتب الأساسي</span><span className="font-bold text-lg">{employee.salary.toLocaleString()} ج.م</span></div>
                   {payroll && (
                      <>
                         <div className="flex justify-between items-center border-b border-gray-100 pb-2"><span className="text-gray-500">بدلات ثابتة</span><span className="font-medium text-green-600">+{payroll.allowances.toLocaleString()} ج.م</span></div>
                         <div className="flex justify-between items-center border-b border-gray-100 pb-2"><span className="text-gray-500">حوافز ومكافآت</span><span className="font-medium text-green-600">+{payroll.incentives.toLocaleString()} ج.م</span></div>
                         <div className="flex justify-between items-center border-b border-gray-100 pb-2"><span className="text-gray-500">استقطاعات (تأمين/ضرائب)</span><span className="font-medium text-red-600">-{payroll.deductions.toLocaleString()} ج.م</span></div>
                         <div className="flex justify-between items-center pt-2"><span className="font-bold text-gray-800">صافي الراتب المتوقع</span><span className="font-bold text-xl text-indigo-600">{payroll.netSalary.toLocaleString()} ج.م</span></div>
                      </>
                   )}
                </div>
             </div>
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-indigo-500" />بيانات التأمين</h3>
                {insurance ? (
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div><label className="text-xs text-gray-500">الرقم التأميني</label><p className="font-mono font-medium">{insurance.insuranceNumber}</p></div>
                         <div><label className="text-xs text-gray-500">تاريخ الاشتراك</label><p className="font-mono font-medium">{employee.joinDate}</p></div>
                         <div><label className="text-xs text-gray-500">الأجر التأميني</label><p className="font-medium">{insurance.salaryInsured.toLocaleString()} ج.م</p></div>
                         <div><label className="text-xs text-gray-500">الحالة</label><span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">مؤمن عليه</span></div>
                      </div>
                   </div>
                ) : <div className="text-center py-8 text-gray-400"><p>لا توجد بيانات تأمينية مرتبطة</p><button onClick={() => navigate('/insurance')} className="mt-2 text-indigo-600 text-sm hover:underline">إضافة سجل تأميني</button></div>}
             </div>
          </div>
        )}

        {/* CUSTODY TAB */}
        {activeTab === 'custody' && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Box className="h-5 w-5 text-orange-500" />
                        سجل العهد المستلمة
                    </h3>
                    <button onClick={() => setIsCustodyModalOpen(true)} className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 shadow-sm">
                        <Plus className="h-4 w-4" /> تسليم عهدة
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="p-3">الصنف</th>
                                <th className="p-3">النوع</th>
                                <th className="p-3">الرقم التسلسلي</th>
                                <th className="p-3">تاريخ الاستلام</th>
                                <th className="p-3">الحالة</th>
                                <th className="p-3">ملاحظات</th>
                                <th className="p-3">إجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {employee.custody && employee.custody.length > 0 ? (
                                employee.custody.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-800">{item.name}</td>
                                        <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{item.type}</span></td>
                                        <td className="p-3 font-mono text-gray-600">{item.serialNumber || '-'}</td>
                                        <td className="p-3 font-mono">{item.receivedDate}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs ${item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.status === 'Active' ? 'في العهدة' : 'تم الارجاع'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-500 text-xs">{item.notes}</td>
                                        <td className="p-3">
                                            <button onClick={() => handleDeleteCustody(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="h-4 w-4" /></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-400">لا يوجد عهد مسجلة لهذا الموظف</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'documents' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                 <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Award className="h-5 w-5 text-yellow-500" />الشهادات والكورسات</h3>
                    <button onClick={() => setIsCertModalOpen(true)} className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100"><Plus className="h-3 w-3" /> إضافة شهادة</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employee.certificates && employee.certificates.length > 0 ? (
                        employee.certificates.map((cert, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-indigo-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-yellow-50 p-2 rounded text-yellow-600"><Award className="h-5 w-5" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate" title={cert.name}>{cert.name}</p>
                                        <p className="text-xs text-gray-500">{cert.date}</p>
                                        {cert.fileName && <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 truncate"><Paperclip className="h-3 w-3" /> {cert.fileName}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {cert.fileUrl && <button onClick={() => handleViewFile(cert.fileUrl)} className="text-indigo-500 hover:text-indigo-700 p-1" title="عرض المرفق"><Eye className="h-4 w-4" /></button>}
                                    <button onClick={() => handleDeleteCertificate(idx)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))
                    ) : <p className="text-gray-400 text-sm col-span-2 text-center py-4">لا توجد شهادات مسجلة</p>}
                 </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800">الأوراق الرسمية</h3>
                    <button onClick={() => setIsDocModalOpen(true)} className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center gap-1"><Upload className="h-4 w-4" />رفع مستند جديد</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* @ts-ignore */}
                    {employee.documents && employee.documents.map((doc: any, i: number) => (
                       <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-indigo-200 transition-colors">
                          <div className="flex items-center gap-3 overflow-hidden">
                             <div className="p-2 bg-gray-50 rounded-lg text-gray-500 flex-shrink-0"><FileText className="h-5 w-5" /></div>
                             <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate" title={doc.name}>{doc.name}</p>
                                <p className="text-xs text-indigo-600 font-medium">{doc.category || 'مستند عام'}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{doc.size || 'Unknown'} • {doc.type}</p>
                             </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button className="text-gray-400 hover:text-indigo-600" onClick={() => handleViewFile(doc.fileUrl)} title="تحميل / عرض"><Download className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteDocument(i)} className="text-gray-400 hover:text-red-600" title="حذف"><Trash2 className="h-4 w-4" /></button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* Document Upload Modal (NEW) */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-800">إضافة مستند جديد</h3><button onClick={() => setIsDocModalOpen(false)}><X className="h-5 w-5" /></button></div>
              <form onSubmit={handleAddDocument} className="space-y-4">
                 <div>
                    <label className="block text-sm text-gray-600 mb-1">نوع الوثيقة</label>
                    <select className="w-full border rounded p-2" value={newDoc.type} onChange={e => setNewDoc({...newDoc, type: e.target.value})} required>
                        <option value="">اختر نوع الوثيقة...</option>
                        {docTypes.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                        <option value="أخرى">أخرى</option>
                    </select>
                 </div>
                 
                 <div>
                    <label className="block text-sm text-gray-600 mb-1">ملف المستند</label>
                    <div className="border border-dashed border-gray-300 rounded p-4 text-center bg-gray-50 relative cursor-pointer hover:bg-gray-100">
                        <input type="file" required className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)} />
                        <div className="text-xs text-gray-500 flex flex-col items-center gap-1"><Upload className="h-5 w-5 mb-1" />{docFile ? <span className="text-indigo-600 font-bold">{docFile.name}</span> : <span>اضغط لرفع الملف (PDF/Image)</span>}</div>
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">حفظ المستند</button>
              </form>
           </div>
        </div>
      )}

      {/* ... Other modals (Edit, Cert, MasterCard, Custody, Dependent) kept same ... */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-gray-100 p-6 bg-gray-50"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Edit className="h-5 w-5 text-indigo-600" />تعديل بيانات الموظف</h3><button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button></div>
              <div className="p-6 overflow-y-auto">
                 <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div><label className="block text-sm text-gray-600 mb-1">الاسم الكامل</label><input type="text" className="w-full border rounded p-2" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
                       <div><label className="block text-sm text-gray-600 mb-1">المسمى الوظيفي</label><input type="text" className="w-full border rounded p-2" value={editForm.jobTitle || ''} onChange={e => setEditForm({...editForm, jobTitle: e.target.value})} /></div>
                       <div><label className="block text-sm text-gray-600 mb-1">القسم</label><select className="w-full border rounded p-2" value={editForm.department || ''} onChange={e => setEditForm({...editForm, department: e.target.value})}><option value="">اختر القسم</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                       <div><label className="block text-sm text-gray-600 mb-1">الراتب</label><input type="number" className="w-full border rounded p-2" value={editForm.salary || ''} onChange={e => setEditForm({...editForm, salary: Number(e.target.value)})} /></div>
                       <div><label className="block text-sm text-gray-600 mb-1">الرقم القومي</label><input type="text" className="w-full border rounded p-2" value={editForm.nationalId || ''} onChange={e => setEditForm({...editForm, nationalId: e.target.value})} /></div>
                       <div><label className="block text-sm text-gray-600 mb-1">الكود الوظيفي</label><input type="text" className="w-full border rounded p-2" value={editForm.employeeCode || ''} onChange={e => setEditForm({...editForm, employeeCode: e.target.value})} /></div>
                       <div><label className="block text-sm text-gray-600 mb-1">العنوان</label><input type="text" className="w-full border rounded p-2" value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} /></div>
                       <div><label className="block text-sm text-gray-600 mb-1">رقم الهاتف</label><input type="text" className="w-full border rounded p-2" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} /></div>
                    </div>
                    <div className="pt-4 flex justify-end gap-2"><button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-50">إلغاء</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">حفظ التغييرات</button></div>
                 </form>
              </div>
           </div>
        </div>
      )}

      {isCustodyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800">تسليم عهدة جديدة</h3>
                      <button onClick={() => setIsCustodyModalOpen(false)}><X className="h-5 w-5" /></button>
                  </div>
                  <form onSubmit={handleAddCustody} className="space-y-4">
                      <div><label className="block text-sm text-gray-600 mb-1">اسم الصنف</label><input type="text" required className="w-full border rounded p-2" value={custodyForm.name} onChange={e => setCustodyForm({...custodyForm, name: e.target.value})} placeholder="مثال: لابتوب Dell" /></div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm text-gray-600 mb-1">النوع</label>
                              <select className="w-full border rounded p-2" value={custodyForm.type} onChange={e => setCustodyForm({...custodyForm, type: e.target.value})}>
                                  {assetTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                              </select>
                          </div>
                          <div><label className="block text-sm text-gray-600 mb-1">تاريخ الاستلام</label><input type="date" className="w-full border rounded p-2" value={custodyForm.receivedDate} onChange={e => setCustodyForm({...custodyForm, receivedDate: e.target.value})} /></div>
                      </div>
                      <div><label className="block text-sm text-gray-600 mb-1">الرقم التسلسلي</label><input type="text" className="w-full border rounded p-2" value={custodyForm.serialNumber} onChange={e => setCustodyForm({...custodyForm, serialNumber: e.target.value})} /></div>
                      <div><label className="block text-sm text-gray-600 mb-1">ملاحظات</label><input type="text" className="w-full border rounded p-2" value={custodyForm.notes} onChange={e => setCustodyForm({...custodyForm, notes: e.target.value})} /></div>
                      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">حفظ</button>
                  </form>
              </div>
          </div>
      )}

      {isDependentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800">إضافة تابع (فرد أسرة)</h3>
                      <button onClick={() => setIsDependentModalOpen(false)}><X className="h-5 w-5" /></button>
                  </div>
                  <form onSubmit={handleAddDependent} className="space-y-4">
                      <div><label className="block text-sm text-gray-600 mb-1">الاسم</label><input type="text" required className="w-full border rounded p-2" value={dependentForm.name} onChange={e => setDependentForm({...dependentForm, name: e.target.value})} /></div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm text-gray-600 mb-1">صلة القرابة</label>
                              <select className="w-full border rounded p-2" value={dependentForm.relation} onChange={e => setDependentForm({...dependentForm, relation: e.target.value})}>
                                  <option value="Wife">زوجة</option>
                                  <option value="Husband">زوج</option>
                                  <option value="Son">ابن</option>
                                  <option value="Daughter">ابنة</option>
                                  <option value="Father">أب</option>
                                  <option value="Mother">أم</option>
                              </select>
                          </div>
                          <div><label className="block text-sm text-gray-600 mb-1">تاريخ الميلاد</label><input type="date" required className="w-full border rounded p-2" value={dependentForm.birthDate} onChange={e => setDependentForm({...dependentForm, birthDate: e.target.value})} /></div>
                      </div>
                      <div><label className="block text-sm text-gray-600 mb-1">الرقم القومي (اختياري)</label><input type="text" className="w-full border rounded p-2" value={dependentForm.nationalId} onChange={e => setDependentForm({...dependentForm, nationalId: e.target.value})} /></div>
                      <div className="flex items-center gap-2">
                          <input type="checkbox" id="isInsured" checked={dependentForm.isInsured} onChange={e => setDependentForm({...dependentForm, isInsured: e.target.checked})} />
                          <label htmlFor="isInsured" className="text-sm text-gray-600">مشمول بالتأمين الطبي</label>
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">حفظ</button>
                  </form>
              </div>
          </div>
      )}

      {isCertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-800">إضافة شهادة جديدة</h3><button onClick={() => setIsCertModalOpen(false)}><X className="h-5 w-5" /></button></div>
              <form onSubmit={handleAddCertificate} className="space-y-4">
                 <div><label className="block text-sm text-gray-600 mb-1">اسم الشهادة / الكورس</label><input type="text" required className="w-full border rounded p-2" value={newCert.name} onChange={e => setNewCert({...newCert, name: e.target.value})} /></div>
                 <div><label className="block text-sm text-gray-600 mb-1">تاريخ الحصول عليها</label><input type="date" required className="w-full border rounded p-2" value={newCert.date} onChange={e => setNewCert({...newCert, date: e.target.value})} /></div>
                 <div>
                    <label className="block text-sm text-gray-600 mb-1">مرفق الشهادة (اختياري)</label>
                    <div className="border border-dashed border-gray-300 rounded p-3 text-center bg-gray-50 relative cursor-pointer hover:bg-gray-100">
                        <input type="file" accept=".pdf,image/*" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" onChange={(e) => setCertFile(e.target.files ? e.target.files[0] : null)} />
                        <div className="text-xs text-gray-500 flex flex-col items-center gap-1"><Upload className="h-4 w-4" />{certFile ? <span className="text-indigo-600 font-bold">{certFile.name}</span> : <span>اضغط لرفع ملف الشهادة</span>}</div>
                    </div>
                 </div>
                 <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">إضافة</button>
              </form>
           </div>
        </div>
      )}

      {isMasterCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
           <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
              <div className="flex items-center justify-between border-b border-gray-200 p-4 bg-gray-50 rounded-t-xl no-print">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2"><Briefcase className="h-5 w-5 text-indigo-600" />كارتة الموظف (Job Card)</h3>
                 <div className="flex gap-2"><button onClick={() => window.print()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2"><Printer className="h-4 w-4" /> طباعة</button><button onClick={() => setIsMasterCardOpen(false)} className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50"><X className="h-5 w-5" /></button></div>
              </div>
              <div className="p-8 print:p-0 print:m-0 bg-white" id="printable-master-card">
                 <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-end">
                    <div><h1 className="text-2xl font-bold text-gray-900">شركة النور للتجارة</h1><p className="text-sm text-gray-600">إدارة الموارد البشرية - سجل الموظفين</p></div>
                    <div className="text-left"><h2 className="text-xl font-bold text-indigo-900 bg-indigo-50 px-4 py-1 rounded border border-indigo-200">بطاقة وصف وظيفي</h2><p className="text-xs text-gray-500 mt-1">Date: {new Date().toLocaleDateString('en-GB')}</p></div>
                 </div>
                 <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="col-span-1"><div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 mx-auto"><img src={employee.avatar} alt="Profile" className="w-full h-full object-cover" /></div></div>
                    <div className="col-span-3 grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div className="border-b border-gray-100 pb-1"><span className="text-gray-500 block text-xs">الاسم الرباعي</span><span className="font-bold text-gray-900 text-base">{employee.name}</span></div>
                        <div className="border-b border-gray-100 pb-1"><span className="text-gray-500 block text-xs">الكود الوظيفي</span><span className="font-mono font-bold text-indigo-700 text-base">{employee.employeeCode}</span></div>
                        <div className="border-b border-gray-100 pb-1"><span className="text-gray-500 block text-xs">المسمى الوظيفي</span><span className="font-bold text-gray-900">{employee.jobTitle}</span></div>
                        <div className="border-b border-gray-100 pb-1"><span className="text-gray-500 block text-xs">القسم / الإدارة</span><span className="font-bold text-gray-900">{employee.department}</span></div>
                        <div className="border-b border-gray-100 pb-1"><span className="text-gray-500 block text-xs">تاريخ التعيين</span><span className="font-mono text-gray-900">{employee.joinDate}</span></div>
                        <div className="border-b border-gray-100 pb-1"><span className="text-gray-500 block text-xs">الرقم القومي</span><span className="font-mono text-gray-900">{employee.nationalId}</span></div>
                    </div>
                 </div>
                 <div className="mb-8">
                    <h4 className="text-sm font-bold text-gray-700 bg-gray-100 p-2 rounded mb-3">البيانات المالية والتعاقدية</h4>
                    <table className="w-full text-sm text-right border border-gray-300"><thead className="bg-gray-50"><tr><th className="border border-gray-300 p-2">نوع العقد</th><th className="border border-gray-300 p-2">الراتب الأساسي</th><th className="border border-gray-300 p-2">التأمين الاجتماعي</th><th className="border border-gray-300 p-2">حالة العمل</th></tr></thead><tbody><tr><td className="border border-gray-300 p-2">{employee.contractType}</td><td className="border border-gray-300 p-2">{employee.salary.toLocaleString()} ج.م</td><td className="border border-gray-300 p-2">{insurance ? insurance.insuranceNumber : 'غير مؤمن'}</td><td className="border border-gray-300 p-2">{employee.status === 'active' ? 'على رأس العمل' : 'متوقف/إجازة'}</td></tr></tbody></table>
                 </div>
                 <div className="mb-8">
                    <h4 className="text-sm font-bold text-gray-700 bg-gray-100 p-2 rounded mb-3">أرصدة الإجازات (السنة الحالية)</h4>
                    <table className="w-full text-sm text-right border border-gray-300"><thead className="bg-gray-50"><tr><th className="border border-gray-300 p-2">نوع الرصيد</th><th className="border border-gray-300 p-2">الإجمالي</th><th className="border border-gray-300 p-2">المستهلك</th><th className="border border-gray-300 p-2">المتبقي</th></tr></thead><tbody><tr><td className="border border-gray-300 p-2 font-bold">سنوي</td><td className="border border-gray-300 p-2">{leaveBalance?.annualTotal || 0}</td><td className="border border-gray-300 p-2">{leaveBalance?.annualUsed || 0}</td><td className="border border-gray-300 p-2 font-bold text-indigo-700">{(leaveBalance?.annualTotal || 0) - (leaveBalance?.annualUsed || 0)}</td></tr><tr><td className="border border-gray-300 p-2 font-bold">عارضة</td><td className="border border-gray-300 p-2">{leaveBalance?.casualTotal || 0}</td><td className="border border-gray-300 p-2">{leaveBalance?.casualUsed || 0}</td><td className="border border-gray-300 p-2 font-bold text-indigo-700">{(leaveBalance?.casualTotal || 0) - (leaveBalance?.casualUsed || 0)}</td></tr></tbody></table>
                 </div>
                 {employee.custody && employee.custody.length > 0 && (
                     <div className="mb-8">
                        <h4 className="text-sm font-bold text-gray-700 bg-gray-100 p-2 rounded mb-3">العهد الشخصية</h4>
                        <table className="w-full text-sm text-right border border-gray-300">
                            <thead className="bg-gray-50"><tr><th className="border border-gray-300 p-2">الصنف</th><th className="border border-gray-300 p-2">الرقم التسلسلي</th><th className="border border-gray-300 p-2">تاريخ الاستلام</th></tr></thead>
                            <tbody>
                                {employee.custody.filter(c => c.status === 'Active').map((c, i) => (
                                    <tr key={i}><td className="border border-gray-300 p-2">{c.name}</td><td className="border border-gray-300 p-2">{c.serialNumber}</td><td className="border border-gray-300 p-2">{c.receivedDate}</td></tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                 )}
                 <div className="grid grid-cols-3 gap-8 mt-20 pt-8 border-t border-gray-200 text-center text-sm font-bold text-gray-800"><div><p className="mb-12">توقيع الموظف</p><div className="border-t border-dotted border-gray-400 w-2/3 mx-auto"></div></div><div><p className="mb-12">مدير الموارد البشرية</p><div className="border-t border-dotted border-gray-400 w-2/3 mx-auto"></div></div><div><p className="mb-12">المدير العام</p><div className="border-t border-dotted border-gray-400 w-2/3 mx-auto"></div></div></div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeDetails;
