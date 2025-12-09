
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_USERS, MOCK_DATABASES } from '../constants';
import { SystemUser, SystemDatabase, UserRole } from '../types';
import { getDeviceId, validateLicenseKey } from '../utils/security';
import { 
  Users, 
  Database, 
  Lock, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Search,
  Key,
  Shield,
  Save,
  Server,
  CreditCard,
  RotateCcw,
  Copy,
  HardDrive,
  Download,
  Upload,
  FileJson,
  AlertTriangle,
  Building2,
  Image as ImageIcon,
  CheckSquare,
  Square,
  Edit,
  Star
} from 'lucide-react';

interface SettingsProps {
  onSubscriptionChange?: () => void;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'employees', label: 'إدارة الموظفين' },
  { id: 'org-chart', label: 'الهيكل التنظيمي' },
  { id: 'recruitment', label: 'التوظيف' },
  { id: 'transport', label: 'إدارة النقل' },
  { id: 'contracts', label: 'العقود' },
  { id: 'insurance', label: 'التأمينات' },
  { id: 'attendance', label: 'الحضور والانصراف' },
  { id: 'leaves', label: 'الإجازات' },
  { id: 'payroll', label: 'الرواتب' },
  { id: 'loans', label: 'السلف والخصومات' },
  { id: 'reports', label: 'التقارير' },
  { id: 'settings', label: 'الإعدادات' },
];

const Settings: React.FC<SettingsProps> = ({ onSubscriptionChange }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'databases' | 'security' | 'subscription' | 'backup'>('general');
  const [users, setUsers] = useState<SystemUser[]>(MOCK_USERS);
  const [databases, setDatabases] = useState<SystemDatabase[]>(MOCK_DATABASES);
  
  // Company Settings State
  const [companyForm, setCompanyForm] = useState({
    name: 'اسم الشركة',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxNumber: '',
    logo: ''
  });
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Subscription State
  const [licenseKey, setLicenseKey] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [expiryDate, setExpiryDate] = useState<string | null>(null);

  // Backup State
  const [backupName, setBackupName] = useState(`Nizam_Backup_${new Date().toISOString().split('T')[0]}`);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDBModalOpen, setIsDBModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); 
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  // Forms
  const [userForm, setUserForm] = useState({ 
    id: '',
    username: '', 
    fullName: '', 
    email: '', 
    role: UserRole.EMPLOYEE, 
    password: '',
    permissions: [] as string[]
  });
  const [dbForm, setDbForm] = useState({ name: '', companyName: '' });
  const [adminPasswordForm, setAdminPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [userPasswordForm, setUserPasswordForm] = useState('');

  useEffect(() => {
    // Load Company Data
    const savedCompany = localStorage.getItem('company_settings');
    if (savedCompany) {
      setCompanyForm(JSON.parse(savedCompany));
    }

    // Load Users (simulate loading enriched users with permissions)
    const storedUsers = localStorage.getItem('system_users');
    if (storedUsers) {
       setUsers(JSON.parse(storedUsers));
    }

    const status = localStorage.getItem('subscriptionStatus');
    const savedExpiry = localStorage.getItem('subscriptionExpiry');
    
    if (status === 'paid') {
        setIsPaid(true);
        if (savedExpiry) setExpiryDate(savedExpiry);
    }
    setDeviceId(getDeviceId());
  }, []);

  // Handlers - Company Settings
  const handleCompanySave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('company_settings', JSON.stringify(companyForm));
    alert('تم حفظ بيانات الشركة بنجاح');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyForm(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handlers - User Management
  const handleOpenUserModal = (user?: SystemUser) => {
    if (user) {
      setUserForm({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        password: '',
        permissions: user.permissions || []
      });
    } else {
      setUserForm({ 
        id: '',
        username: '', 
        fullName: '', 
        email: '', 
        role: UserRole.EMPLOYEE, 
        password: '',
        permissions: []
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userForm.id) {
      // Edit Existing
      const updatedUsers = users.map(u => u.id === userForm.id ? {
        ...u,
        username: userForm.username,
        fullName: userForm.fullName,
        email: userForm.email,
        role: userForm.role,
        permissions: userForm.permissions
      } : u);
      setUsers(updatedUsers);
      localStorage.setItem('system_users', JSON.stringify(updatedUsers));
    } else {
      // Add New
      const newUser: SystemUser = {
        id: `U${Date.now()}`,
        username: userForm.username,
        fullName: userForm.fullName,
        email: userForm.email,
        role: userForm.role,
        active: true,
        lastLogin: '-',
        permissions: userForm.permissions
      };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('system_users', JSON.stringify(updatedUsers));
    }
    
    setIsUserModalOpen(false);
  };

  const togglePermission = (permId: string) => {
    setUserForm(prev => {
      const exists = prev.permissions.includes(permId);
      if (exists) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== permId) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permId] };
      }
    });
  };

  const toggleUserStatus = (id: string) => {
    const updated = users.map(u => u.id === id ? { ...u, active: !u.active } : u);
    setUsers(updated);
    localStorage.setItem('system_users', JSON.stringify(updated));
  };

  const handleChangeUserPassword = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`تم تغيير كلمة المرور للمستخدم ${selectedUser?.username} بنجاح`);
    setIsPasswordModalOpen(false);
    setUserPasswordForm('');
    setSelectedUser(null);
  };

  // Handlers - Subscription
  const handleActivateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateLicenseKey(licenseKey, deviceId);
    if (validation.isValid) {
      localStorage.setItem('subscriptionStatus', 'paid');
      if (validation.expiryDate) {
          localStorage.setItem('subscriptionExpiry', validation.expiryDate);
          setExpiryDate(validation.expiryDate);
      }
      setIsPaid(true);
      alert(`تم التفعيل بنجاح! \nصلاحية النسخة حتى: ${validation.expiryDate}`);
      if (onSubscriptionChange) onSubscriptionChange();
    } else {
      alert(validation.message);
    }
  };

  const handleResetTrial = () => {
    if (window.confirm('هل أنت متأكد من العودة للنسخة التجريبية؟')) {
      localStorage.removeItem('subscriptionStatus');
      localStorage.removeItem('subscriptionExpiry');
      setIsPaid(false);
      setLicenseKey('');
      setExpiryDate(null);
      if (onSubscriptionChange) onSubscriptionChange();
      alert('تمت العودة للنسخة التجريبية');
    }
  };

  const copyDeviceId = () => {
    navigator.clipboard.writeText(deviceId);
    alert('تم نسخ رقم الجهاز');
  };

  // Handlers - Backup
  const handleCreateBackup = () => {
    const backupData = {
      meta: {
        version: '1.0.0',
        date: new Date().toISOString(),
        type: 'full_backup',
        system: 'Nizam HR'
      },
      data: {
        localStorage: { ...localStorage },
        runtime: { users, databases }
      }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${backupName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.meta && parsed.meta.system === 'Nizam HR') {
          if (window.confirm(`سيتم استعادة نسخة احتياطية بتاريخ ${parsed.meta.date}.\nسيتم إعادة تحميل النظام، هل أنت متأكد؟`)) {
            localStorage.clear();
            if (parsed.data && parsed.data.localStorage) {
              Object.entries(parsed.data.localStorage).forEach(([key, value]) => {
                localStorage.setItem(key, value as string);
              });
            }
            alert('تمت استعادة البيانات بنجاح. سيتم إعادة التشغيل.');
            window.location.reload();
          }
        } else {
          alert('ملف النسخة الاحتياطية غير صالح أو تالف.');
        }
      } catch (error) {
        console.error(error);
        alert('حدث خطأ أثناء قراءة الملف.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handlers - Database Management
  const handleCreateDatabase = (e: React.FormEvent) => {
    e.preventDefault();
    const newDB: SystemDatabase = {
      id: `DB${Date.now()}`,
      name: dbForm.name,
      companyName: dbForm.companyName,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      usersCount: 0
    };
    setDatabases([...databases, newDB]);
    setIsDBModalOpen(false);
    setDbForm({ name: '', companyName: '' });
  };

  // Handlers - Admin Security
  const handleChangeAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordForm.new !== adminPasswordForm.confirm) {
      alert('كلمات المرور غير متطابقة');
      return;
    }
    alert('تم تحديث كلمة المرور الخاصة بك بنجاح');
    setAdminPasswordForm({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">إعدادات النظام</h2>
        <p className="text-sm text-gray-500">إدارة المستخدمين، الصلاحيات، بيانات الشركة، والأمان</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-xl overflow-x-auto">
        <button onClick={() => setActiveTab('general')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Building2 className="h-5 w-5" />بيانات الشركة</button>
        <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Users className="h-5 w-5" />المستخدمين والصلاحيات</button>
        <button onClick={() => setActiveTab('databases')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'databases' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Database className="h-5 w-5" />قواعد البيانات</button>
        <button onClick={() => setActiveTab('security')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'security' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Lock className="h-5 w-5" />الأمان</button>
        <button onClick={() => setActiveTab('backup')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'backup' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><HardDrive className="h-5 w-5" />النسخ الاحتياطي</button>
        <button onClick={() => setActiveTab('subscription')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'subscription' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><CreditCard className="h-5 w-5" />النسخة والتفعيل</button>
      </div>

      <div className="bg-white p-6 rounded-b-xl shadow-sm border border-gray-100 border-t-0 min-h-[500px]">
        
        {/* GENERAL / COMPANY SETTINGS TAB */}
        {activeTab === 'general' && (
          <div className="max-w-4xl mx-auto">
             <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                   <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">التفاصيل الأساسية</h3>
                   <form onSubmit={handleCompanySave} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنشأة / الشركة</label>
                            <input type="text" value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                            <input type="text" value={companyForm.phone} onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" dir="ltr" />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                            <input type="email" value={companyForm.email} onChange={e => setCompanyForm({...companyForm, email: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" dir="ltr" />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                            <input type="text" value={companyForm.address} onChange={e => setCompanyForm({...companyForm, address: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الرقم الضريبي</label>
                            <input type="text" value={companyForm.taxNumber} onChange={e => setCompanyForm({...companyForm, taxNumber: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الموقع الإلكتروني</label>
                            <input type="text" value={companyForm.website} onChange={e => setCompanyForm({...companyForm, website: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" dir="ltr" />
                         </div>
                      </div>
                      <div className="pt-4 flex justify-end">
                         <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition">
                            <Save className="h-5 w-5" /> حفظ البيانات
                         </button>
                      </div>
                   </form>
                </div>

                <div className="w-full md:w-80 shrink-0">
                   <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">شعار الشركة</h3>
                   <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center hover:bg-gray-100 transition-colors">
                      {companyForm.logo ? (
                         <div className="relative w-40 h-40 mb-4 group">
                            <img src={companyForm.logo} alt="Logo" className="w-full h-full object-contain" />
                            <button onClick={() => setCompanyForm({...companyForm, logo: ''})} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                         </div>
                      ) : (
                         <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <ImageIcon className="h-12 w-12" />
                         </div>
                      )}
                      <p className="text-sm text-gray-500 mb-4">اختر صورة الشعار (PNG, JPG)</p>
                      <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
                      <button onClick={() => logoInputRef.current?.click()} className="text-indigo-600 text-sm font-bold hover:underline">رفع شعار جديد</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative w-72">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="بحث عن مستخدم..." className="w-full rounded-lg border border-gray-200 py-2 pr-9 pl-4 focus:border-indigo-500 focus:outline-none" />
              </div>
              <button onClick={() => handleOpenUserModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"><Plus className="h-5 w-5" /> مستخدم جديد</button>
            </div>
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-4">المستخدم</th>
                    <th className="px-6 py-4">البريد الإلكتروني</th>
                    <th className="px-6 py-4">الدور (Role)</th>
                    <th className="px-6 py-4">الصلاحيات</th>
                    <th className="px-6 py-4">آخر دخول</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"><div className="font-medium text-gray-900">{user.fullName}</div><div className="text-xs text-gray-500">@{user.username}</div></td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4"><span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium border border-indigo-100"><Shield className="h-3 w-3" />{user.role}</span></td>
                      <td className="px-6 py-4">
                         <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {user.permissions ? user.permissions.length : 0} صلاحيات
                         </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">{user.lastLogin}</td>
                      <td className="px-6 py-4"><button onClick={() => toggleUserStatus(user.id)} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${user.active ? 'text-green-700 bg-green-50 hover:bg-green-100' : 'text-red-700 bg-red-50 hover:bg-red-100'}`}>{user.active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}{user.active ? 'نشط' : 'موقف'}</button></td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                            <button onClick={() => handleOpenUserModal(user)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="تعديل"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => { setSelectedUser(user); setIsPasswordModalOpen(true); }} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="تغيير كلمة المرور"><Key className="h-4 w-4" /></button>
                            <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="حذف"><Trash2 className="h-4 w-4" /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DATABASES TAB */}
        {activeTab === 'databases' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-lg flex items-start gap-3 max-w-2xl">
                   <Server className="h-5 w-5 mt-0.5" />
                   <div><h4 className="font-bold text-sm">نظام تعدد الشركات (Multi-Tenancy)</h4><p className="text-xs mt-1 opacity-90">يمكنك إنشاء قواعد بيانات منفصلة لكل فرع أو شركة شقيقة.</p></div>
                </div>
                <button onClick={() => setIsDBModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"><Plus className="h-5 w-5" /> قاعدة بيانات جديدة</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {databases.map(db => (
                   <div key={db.id} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-all hover:shadow-md bg-gray-50">
                      <div className="flex justify-between items-start mb-4"><div className="bg-white p-2 rounded-lg border border-gray-200"><Database className="h-6 w-6 text-indigo-600" /></div><span className={`px-2 py-1 text-xs rounded-full ${db.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{db.status === 'active' ? 'نشط' : 'مؤرشف'}</span></div>
                      <h3 className="font-bold text-gray-800">{db.companyName}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-1 mb-4">{db.name}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200 pt-3"><span>المستخدمين: {db.usersCount}</span><span>تاريخ الإنشاء: {db.createdAt}</span></div>
                      <div className="mt-4 flex gap-2"><button className="flex-1 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700">اتصال</button><button className="px-3 py-1.5 text-xs font-medium border border-gray-300 bg-white rounded hover:bg-gray-50">إعدادات</button></div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="max-w-2xl mx-auto">
             <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg mb-8 flex gap-3">
                <Lock className="h-5 w-5 text-yellow-600" />
                <div><h4 className="font-bold text-sm text-yellow-800">حماية حساب المسؤول</h4><p className="text-xs text-yellow-700 mt-1">يُنصح بتغيير كلمة المرور بشكل دوري.</p></div>
             </div>
             <form onSubmit={handleChangeAdminPassword} className="space-y-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الحالية</label><input type="password" required className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={adminPasswordForm.current} onChange={(e) => setAdminPasswordForm({...adminPasswordForm, current: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الجديدة</label><input type="password" required className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={adminPasswordForm.new} onChange={(e) => setAdminPasswordForm({...adminPasswordForm, new: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور الجديدة</label><input type="password" required className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={adminPasswordForm.confirm} onChange={(e) => setAdminPasswordForm({...adminPasswordForm, confirm: e.target.value})} /></div>
                <div className="pt-4 flex justify-end"><button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition"><Save className="h-5 w-5" />حفظ التغييرات</button></div>
             </form>
          </div>
        )}

        {/* BACKUP TAB */}
        {activeTab === 'backup' && (
          <div className="max-w-3xl mx-auto">
             <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-8 flex gap-3">
                <HardDrive className="h-6 w-6 text-indigo-600" />
                <div><h4 className="font-bold text-sm text-indigo-800">النسخ الاحتياطي واستعادة النظام</h4><p className="text-xs text-indigo-700 mt-1">قم بحفظ نسخة من بيانات النظام الحالية لاستعادتها لاحقاً.</p></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-indigo-300 transition-all">
                   <div className="flex items-center gap-2 mb-4"><div className="bg-blue-50 p-2 rounded-full"><Download className="h-6 w-6 text-blue-600" /></div><h3 className="font-bold text-gray-800">إنشاء نسخة احتياطية</h3></div>
                   <div className="space-y-4">
                      <div><label className="block text-xs text-gray-500 mb-1">اسم ملف النسخة</label><div className="relative"><input type="text" className="w-full border border-gray-300 rounded-lg p-2 pl-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={backupName} onChange={(e) => setBackupName(e.target.value)} /><FileJson className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /></div></div>
                      <button onClick={handleCreateBackup} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"><Download className="h-4 w-4" />تحميل النسخة</button>
                   </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-orange-300 transition-all">
                   <div className="flex items-center gap-2 mb-4"><div className="bg-orange-50 p-2 rounded-full"><Upload className="h-6 w-6 text-orange-600" /></div><h3 className="font-bold text-gray-800">استعادة نسخة سابقة</h3></div>
                   <div className="space-y-4">
                      <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg"><div className="flex items-center gap-2 text-orange-800 mb-1"><AlertTriangle className="h-4 w-4" /><span className="text-xs font-bold">تنبيه هام</span></div><p className="text-xs text-orange-700">استعادة النسخة ستقوم بمسح البيانات الحالية.</p></div>
                      <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestoreBackup} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2 dashed-border"><Upload className="h-4 w-4" />اختيار ملف النسخة (.json)</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === 'subscription' && (
           <div className="max-w-2xl mx-auto text-center animate-in fade-in duration-300">
              {isPaid ? (
                 <div className="py-10">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><CheckCircle className="h-12 w-12 text-green-600" /></div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">النسخة الأصلية مفعلة</h3>
                    <p className="text-gray-500 mb-8">شكراً لاشتراكك في نظام HR المتكامل.</p>
                    <div className="bg-gray-50 rounded-xl p-6 text-right max-w-md mx-auto mb-8 border border-gray-200">
                       <div className="flex justify-between mb-3 border-b border-gray-200 pb-2"><span className="text-gray-600 text-sm">نوع الترخيص</span><span className="font-bold text-gray-800 text-sm">جهاز واحد (Single Device)</span></div>
                       <div className="flex justify-between mb-3 border-b border-gray-200 pb-2"><span className="text-gray-600 text-sm">رقم الجهاز</span><span className="font-mono text-gray-800 text-xs">{deviceId}</span></div>
                       <div className="flex justify-between mb-3 border-b border-gray-200 pb-2"><span className="text-gray-600 text-sm">ينتهي في</span><span className="font-mono text-indigo-600 font-bold">{expiryDate || 'غير محدود'}</span></div>
                       <div className="flex justify-between items-center"><span className="text-gray-600 text-sm">الحالة</span><span className="inline-flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-2 py-0.5 rounded"><CheckCircle className="h-3 w-3" />نشط</span></div>
                    </div>
                    <button onClick={handleResetTrial} className="flex items-center gap-2 mx-auto text-xs text-gray-400 hover:text-red-500 hover:underline transition-colors"><RotateCcw className="h-3 w-3" />إلغاء التفعيل والعودة للنسخة التجريبية</button>
                 </div>
              ) : (
                 <div className="py-6">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Star className="h-10 w-10 text-indigo-600" /></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">تفعيل النسخة الكاملة</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm leading-relaxed">لتفعيل النظام، يرجى إرسال "رقم الجهاز" إلى الدعم الفني للحصول على كود التفعيل.</p>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-8 text-right max-w-md mx-auto">
                        <p className="text-xs text-gray-500 mb-1">رقم الجهاز (Device ID):</p>
                        <div className="flex gap-2"><code className="flex-1 bg-white border border-gray-200 p-2 rounded text-center font-mono font-bold text-gray-700 tracking-widest select-all">{deviceId}</code><button onClick={copyDeviceId} className="bg-white border border-gray-200 p-2 rounded text-gray-500 hover:text-indigo-600 hover:border-indigo-300" title="نسخ"><Copy className="h-5 w-5" /></button></div>
                    </div>
                    <form onSubmit={handleActivateLicense} className="max-w-sm mx-auto space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                       <div className="text-right">
                          <label className="block text-sm font-bold text-gray-700 mb-2">كود التفعيل (License Key)</label>
                          <div className="relative"><Key className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><input type="text" placeholder="NZM-XXXX-XXXX" className="w-full text-center font-mono tracking-widest rounded-lg border border-gray-300 p-3 pr-10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none uppercase bg-white shadow-sm" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} /></div>
                       </div>
                       <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:opacity-90 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"><CheckCircle className="h-5 w-5" />تفعيل الآن</button>
                    </form>
                 </div>
              )}
           </div>
        )}
      </div>

      {/* USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                 <h3 className="font-bold text-gray-800">{userForm.id ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</h3>
                 <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSaveUser} className="p-6 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">اسم المستخدم</label>
                          <input type="text" required className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-indigo-500 outline-none" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">الاسم الكامل</label>
                          <input type="text" required className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-indigo-500 outline-none" value={userForm.fullName} onChange={e => setUserForm({...userForm, fullName: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">البريد الإلكتروني</label>
                          <input type="email" required className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-indigo-500 outline-none" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">الدور الرئيسي</label>
                          <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-indigo-500 outline-none" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>
                             {Object.values(UserRole).map(role => (<option key={role} value={role}>{role}</option>))}
                          </select>
                      </div>
                      {!userForm.id && (
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700 block mb-1">كلمة المرور</label>
                            <input type="password" required className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-indigo-500 outline-none" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                        </div>
                      )}
                   </div>

                   {/* Detailed Permissions */}
                   <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-bold text-gray-700 mb-3">صلاحيات الوصول المحددة</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                         {AVAILABLE_PERMISSIONS.map(perm => (
                            <div 
                              key={perm.id}
                              onClick={() => togglePermission(perm.id)}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border ${userForm.permissions.includes(perm.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                            >
                               {userForm.permissions.includes(perm.id) 
                                  ? <CheckSquare className="h-4 w-4 text-indigo-600" /> 
                                  : <Square className="h-4 w-4 text-gray-400" />
                               }
                               <span className={`text-xs font-medium ${userForm.permissions.includes(perm.id) ? 'text-indigo-700' : 'text-gray-600'}`}>
                                  {perm.label}
                               </span>
                            </div>
                         ))}
                      </div>
                   </div>
                </form>
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 shrink-0">
                 <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">إلغاء</button>
                 <button onClick={handleSaveUser} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">{userForm.id ? 'حفظ التعديلات' : 'إنشاء المستخدم'}</button>
              </div>
           </div>
        </div>
      )}
      
      {/* DB Modal - Unchanged */}
      {isDBModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800">إنشاء قاعدة بيانات جديدة</h3>
                 <button onClick={() => setIsDBModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleCreateDatabase} className="p-6 space-y-4">
                 <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">اسم الشركة</label>
                    <input type="text" required placeholder="مثال: شركة النور فرع القاهرة" className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={dbForm.companyName} onChange={e => setDbForm({...dbForm, companyName: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">اسم قاعدة البيانات (System Name)</label>
                    <input type="text" required placeholder="db_company_branch" className="w-full border border-gray-300 rounded-lg p-2 text-sm font-mono" value={dbForm.name} onChange={e => setDbForm({...dbForm, name: e.target.value})} />
                 </div>
                 <div className="pt-2"><button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">إنشاء القاعدة</button></div>
              </form>
           </div>
        </div>
      )}

      {/* Password Modal - Unchanged */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800">تغيير كلمة مرور</h3>
                 <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleChangeUserPassword} className="p-6 space-y-4">
                 <p className="text-sm text-gray-600">تعيين كلمة مرور جديدة للمستخدم: <span className="font-bold text-gray-900">{selectedUser.username}</span></p>
                 <div><input type="password" required placeholder="كلمة المرور الجديدة" className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={userPasswordForm} onChange={e => setUserPasswordForm(e.target.value)} /></div>
                 <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">حفظ</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
