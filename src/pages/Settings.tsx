
import React, { useState, useEffect, useRef, useContext } from 'react';
import { MOCK_USERS, MOCK_DATABASES, MOCK_EMPLOYEES, DEFAULT_ROLES, DEPARTMENTS as DEFAULT_DEPTS, DEFAULT_PAYROLL_CONFIG, MOCK_HOLIDAYS, MOCK_JOB_TITLES, MOCK_ASSET_TYPES, MOCK_DOCUMENT_TYPES } from '../constants';
import { SystemUser, SystemDatabase, UserRole, Employee, RoleDefinition, PayrollConfig, PublicHoliday, SystemDefinition } from '../types';
import { getDeviceId, validateLicenseKey } from '../utils/security';
import { 
  Users, Database, Lock, Plus, Trash2, CheckCircle, XCircle, Key, Shield, Save, Server, CreditCard, RotateCcw, Copy, HardDrive, Download, Upload, FileJson, AlertTriangle, Building2, Image as ImageIcon, CheckSquare, Square, Edit, Star, UserCheck, Briefcase, Network, DollarSign, Calendar, ListChecks, FileText, Box
} from 'lucide-react';
import { AppContext } from '../App';

interface SettingsProps {
  onSubscriptionChange?: () => void;
  isExpired?: boolean;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'employees', label: 'إدارة الموظفين' },
  { id: 'org-chart', label: 'الهيكل التنظيمي' },
  { id: 'shifts', label: 'إدارة الورديات' },
  { id: 'recruitment', label: 'التوظيف' },
  { id: 'transport', label: 'إدارة النقل' },
  { id: 'performance', label: 'إدارة الأداء' },
  { id: 'contracts', label: 'العقود' },
  { id: 'insurance', label: 'التأمينات' },
  { id: 'attendance', label: 'الحضور والانصراف' },
  { id: 'leaves', label: 'الإجازات' },
  { id: 'payroll', label: 'الرواتب' },
  { id: 'loans', label: 'السلف والخصومات' },
  { id: 'reports', label: 'التقارير' },
  { id: 'settings', label: 'الإعدادات' },
];

const DATA_KEYS = ['employees_data', 'attendance_data', 'contracts_data', 'insurance_data', 'leaves_data', 'leaves_balances', 'payroll_data', 'loans_data', 'biometric_devices', 'transport_vehicles', 'transport_drivers', 'transport_trips', 'transport_maintenance', 'recruitment_candidates', 'shifts_data', 'system_departments', 'performance_data', 'system_holidays', 'system_job_titles', 'system_asset_types', 'system_document_types'];

const Settings: React.FC<SettingsProps> = ({ onSubscriptionChange, isExpired }) => {
  const { t } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState<'general' | 'departments' | 'definitions' | 'users' | 'roles' | 'payroll' | 'databases' | 'security' | 'subscription' | 'backup'>('general');
  const [activeDefType, setActiveDefType] = useState<'holidays' | 'jobs' | 'assets' | 'docs'>('holidays');

  const [users, setUsers] = useState<SystemUser[]>(MOCK_USERS);
  const [employeesList, setEmployeesList] = useState<Employee[]>(MOCK_EMPLOYEES);
  
  // Departments State
  const [departments, setDepartments] = useState<string[]>(() => {
      const saved = localStorage.getItem('system_departments');
      return saved ? JSON.parse(saved) : DEFAULT_DEPTS;
  });
  const [newDept, setNewDept] = useState('');

  // Definitions State
  const [holidays, setHolidays] = useState<PublicHoliday[]>(() => {
      const saved = localStorage.getItem('system_holidays');
      return saved ? JSON.parse(saved) : MOCK_HOLIDAYS;
  });
  const [jobTitles, setJobTitles] = useState<SystemDefinition[]>(() => {
      const saved = localStorage.getItem('system_job_titles');
      return saved ? JSON.parse(saved) : MOCK_JOB_TITLES;
  });
  const [assetTypes, setAssetTypes] = useState<SystemDefinition[]>(() => {
      const saved = localStorage.getItem('system_asset_types');
      return saved ? JSON.parse(saved) : MOCK_ASSET_TYPES;
  });
  const [docTypes, setDocTypes] = useState<SystemDefinition[]>(() => {
      const saved = localStorage.getItem('system_document_types');
      return saved ? JSON.parse(saved) : MOCK_DOCUMENT_TYPES;
  });

  // Forms for Definitions
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '' });
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newAssetType, setNewAssetType] = useState('');
  const [newDocType, setNewDocType] = useState('');

  // Roles State
  const [roles, setRoles] = useState<RoleDefinition[]>(() => {
      const savedRoles = localStorage.getItem('system_roles');
      return savedRoles ? JSON.parse(savedRoles) : DEFAULT_ROLES;
  });

  // Payroll Config State
  const [payrollConfig, setPayrollConfig] = useState<PayrollConfig>(() => {
      const saved = localStorage.getItem('payroll_config');
      return saved ? JSON.parse(saved) : DEFAULT_PAYROLL_CONFIG;
  });

  const [databases, setDatabases] = useState<SystemDatabase[]>(() => {
    const saved = localStorage.getItem('system_databases');
    return saved ? JSON.parse(saved) : MOCK_DATABASES;
  });
  const [activeDatabaseId, setActiveDatabaseId] = useState<string>(() => {
    return localStorage.getItem('active_db_id') || 'DB1';
  });
  const [editingDbId, setEditingDbId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState({ name: 'اسم الشركة', address: '', phone: '', email: '', website: '', taxNumber: '', logo: '' });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [backupName, setBackupName] = useState(`Nizam_Backup_${new Date().toISOString().split('T')[0]}`);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDBModalOpen, setIsDBModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); 
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  
  // Forms
  const [userForm, setUserForm] = useState({ id: '', username: '', fullName: '', email: '', role: UserRole.EMPLOYEE as string, password: '', permissions: [] as string[], linkedEmployeeId: '' });
  const [roleForm, setRoleForm] = useState<Partial<RoleDefinition>>({ name: '', permissions: [] });
  const [dbForm, setDbForm] = useState({ name: '', companyName: '' });
  const [adminPasswordForm, setAdminPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [userPasswordForm, setUserPasswordForm] = useState('');

  // Enforce Subscription Tab if Expired
  useEffect(() => {
      if (isExpired) {
          setActiveTab('subscription');
      }
  }, [isExpired]);

  // Persist Definitions
  useEffect(() => { localStorage.setItem('system_holidays', JSON.stringify(holidays)); }, [holidays]);
  useEffect(() => { localStorage.setItem('system_job_titles', JSON.stringify(jobTitles)); }, [jobTitles]);
  useEffect(() => { localStorage.setItem('system_asset_types', JSON.stringify(assetTypes)); }, [assetTypes]);
  useEffect(() => { localStorage.setItem('system_document_types', JSON.stringify(docTypes)); }, [docTypes]);

  useEffect(() => { localStorage.setItem('system_databases', JSON.stringify(databases)); }, [databases]);
  useEffect(() => { localStorage.setItem('system_roles', JSON.stringify(roles)); }, [roles]);
  useEffect(() => { localStorage.setItem('system_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('payroll_config', JSON.stringify(payrollConfig)); }, [payrollConfig]);

  useEffect(() => {
    const savedCompany = localStorage.getItem('company_settings');
    if (savedCompany) setCompanyForm(JSON.parse(savedCompany));
    const storedUsers = localStorage.getItem('system_users');
    if (storedUsers) setUsers(JSON.parse(storedUsers));
    const storedEmployees = localStorage.getItem('employees_data');
    if (storedEmployees) setEmployeesList(JSON.parse(storedEmployees));
    const currentDeviceId = getDeviceId();
    setDeviceId(currentDeviceId);
    const storedKey = localStorage.getItem('licenseKey');
    if (storedKey) {
        const validation = validateLicenseKey(storedKey, currentDeviceId);
        if (validation.isValid) {
            setIsPaid(true);
            setExpiryDate(validation.expiryDate || 'Unknown');
        } else {
            setIsPaid(false);
        }
    }
  }, []);

  const handleCompanySave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('company_settings', JSON.stringify(companyForm));
    alert('تم حفظ بيانات الشركة بنجاح');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setCompanyForm(prev => ({ ...prev, logo: reader.result as string })); };
      reader.readAsDataURL(file);
    }
  };

  const handlePayrollConfigSave = (e: React.FormEvent) => {
      e.preventDefault();
      localStorage.setItem('payroll_config', JSON.stringify(payrollConfig));
      alert('تم حفظ إعدادات الرواتب بنجاح');
  };

  // Departments Handlers
  const handleAddDepartment = (e: React.FormEvent) => {
      e.preventDefault();
      if (newDept && !departments.includes(newDept)) {
          setDepartments([...departments, newDept]);
          setNewDept('');
      } else {
          alert('القسم موجود بالفعل أو الحقل فارغ');
      }
  };

  const handleDeleteDepartment = (dept: string) => {
      if (window.confirm(`هل أنت متأكد من حذف قسم "${dept}"؟`)) {
          setDepartments(departments.filter(d => d !== dept));
      }
  };

  // Definitions Handlers
  const handleAddHoliday = (e: React.FormEvent) => {
      e.preventDefault();
      if (newHoliday.name && newHoliday.date) {
          setHolidays([...holidays, { id: `H-${Date.now()}`, ...newHoliday }]);
          setNewHoliday({ name: '', date: '' });
      }
  };

  const handleDeleteHoliday = (id: string) => {
      if (window.confirm('حذف هذه العطلة؟')) setHolidays(holidays.filter(h => h.id !== id));
  };

  const handleAddJobTitle = (e: React.FormEvent) => {
      e.preventDefault();
      if (newJobTitle) {
          setJobTitles([...jobTitles, { id: `JT-${Date.now()}`, name: newJobTitle, type: 'job_title' }]);
          setNewJobTitle('');
      }
  };

  const handleDeleteJobTitle = (id: string) => {
      setJobTitles(jobTitles.filter(j => j.id !== id));
  };

  const handleAddAssetType = (e: React.FormEvent) => {
      e.preventDefault();
      if (newAssetType) {
          setAssetTypes([...assetTypes, { id: `AT-${Date.now()}`, name: newAssetType, type: 'asset_type' }]);
          setNewAssetType('');
      }
  };

  const handleDeleteAssetType = (id: string) => {
      setAssetTypes(assetTypes.filter(a => a.id !== id));
  };

  const handleAddDocType = (e: React.FormEvent) => {
      e.preventDefault();
      if (newDocType) {
          setDocTypes([...docTypes, { id: `DT-${Date.now()}`, name: newDocType, type: 'document_type' }]);
          setNewDocType('');
      }
  };

  const handleDeleteDocType = (id: string) => {
      setDocTypes(docTypes.filter(d => d.id !== id));
  };

  // User Handlers
  const handleOpenUserModal = (user?: SystemUser) => {
    if (user) {
      setUserForm({
        id: user.id, username: user.username, fullName: user.fullName, email: user.email, role: user.role, password: '', permissions: user.permissions || [], linkedEmployeeId: user.linkedEmployeeId || ''
      });
    } else {
      setUserForm({ id: '', username: '', fullName: '', email: '', role: UserRole.EMPLOYEE, password: '', permissions: [], linkedEmployeeId: '' });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (userForm.id) {
      const updatedUsers = users.map(u => u.id === userForm.id ? { ...u, username: userForm.username, fullName: userForm.fullName, email: userForm.email, role: userForm.role as UserRole, permissions: userForm.permissions, linkedEmployeeId: userForm.linkedEmployeeId } : u);
      setUsers(updatedUsers);
      localStorage.setItem('system_users', JSON.stringify(updatedUsers));
    } else {
      const newUser: SystemUser = { id: `U${Date.now()}`, username: userForm.username, fullName: userForm.fullName, email: userForm.email, role: userForm.role as UserRole, active: true, lastLogin: '-', permissions: userForm.permissions, linkedEmployeeId: userForm.linkedEmployeeId };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('system_users', JSON.stringify(updatedUsers));
    }
    setIsUserModalOpen(false);
  };

  // Role Handlers
  const handleOpenRoleModal = (role?: RoleDefinition) => {
      if (role) {
          setRoleForm(role);
      } else {
          setRoleForm({ id: '', name: '', permissions: [] });
      }
      setIsRoleModalOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
      e.preventDefault();
      if (roleForm.id) {
          setRoles(prev => prev.map(r => r.id === roleForm.id ? { ...r, name: roleForm.name!, permissions: roleForm.permissions! } : r));
      } else {
          const newRole: RoleDefinition = {
              id: `R-${Date.now()}`,
              name: roleForm.name!,
              permissions: roleForm.permissions!,
              isSystem: false
          };
          setRoles([...roles, newRole]);
      }
      setIsRoleModalOpen(false);
  };

  const handleDeleteRole = (id: string) => {
      if (window.confirm('هل أنت متأكد من حذف هذا الدور؟')) {
          setRoles(prev => prev.filter(r => r.id !== id));
      }
  };

  const toggleRolePermission = (permId: string) => {
      setRoleForm(prev => {
          const current = prev.permissions || [];
          if (current.includes(permId)) {
              return { ...prev, permissions: current.filter(p => p !== permId) };
          } else {
              return { ...prev, permissions: [...current, permId] };
          }
      });
  };

  // Role selection on user form change - auto populate permissions
  const handleUserRoleChange = (roleName: string) => {
      const roleDef = roles.find(r => r.name === roleName);
      setUserForm(prev => ({
          ...prev,
          role: roleName,
          permissions: roleDef ? roleDef.permissions : []
      }));
  };

  const togglePermission = (permId: string) => {
    setUserForm(prev => {
      const exists = prev.permissions.includes(permId);
      return exists ? { ...prev, permissions: prev.permissions.filter(p => p !== permId) } : { ...prev, permissions: [...prev.permissions, permId] };
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

  const handleActivateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateLicenseKey(licenseKey, deviceId);
    if (validation.isValid) {
      localStorage.setItem('subscriptionStatus', 'paid');
      localStorage.setItem('licenseKey', licenseKey); 
      if (validation.expiryDate) {
          localStorage.setItem('subscriptionExpiry', validation.expiryDate);
          setExpiryDate(validation.expiryDate);
      }
      setIsPaid(true);
      alert(`تم التفعيل بنجاح! \nصلاحية النسخة حتى: ${validation.expiryDate}`);
      if (onSubscriptionChange) onSubscriptionChange();
      window.location.reload();
    } else {
      alert(validation.message);
    }
  };

  const handleResetTrial = () => {
    if (window.confirm('هل أنت متأكد من العودة للنسخة التجريبية؟')) {
      localStorage.removeItem('subscriptionStatus');
      localStorage.removeItem('subscriptionExpiry');
      localStorage.removeItem('licenseKey');
      setIsPaid(false);
      setLicenseKey('');
      setExpiryDate(null);
      if (onSubscriptionChange) onSubscriptionChange();
      alert('تمت العودة للنسخة التجريبية');
      window.location.reload();
    }
  };

  const copyDeviceId = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(deviceId)
        .then(() => alert('تم نسخ رقم الجهاز'))
        .catch(() => alert('فشل النسخ التلقائي، يرجى النسخ يدوياً'));
    } else {
      // Fallback
      alert('فشل النسخ التلقائي. الجهاز: ' + deviceId);
    }
  };

  const handleCreateBackup = () => {
    const backupData = { meta: { version: '1.0.0', date: new Date().toISOString(), type: 'full_backup', system: 'Nizam HR' }, data: { localStorage: { ...localStorage }, runtime: { users, databases } } };
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
              Object.entries(parsed.data.localStorage).forEach(([key, value]) => { localStorage.setItem(key, value as string); });
            }
            alert('تمت استعادة البيانات بنجاح. سيتم إعادة التشغيل.');
            window.location.reload();
          }
        } else {
          alert('ملف النسخة الاحتياطية غير صالح أو تالف.');
        }
      } catch (error) { console.error(error); alert('حدث خطأ أثناء قراءة الملف.'); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConnectDatabase = (id: string) => {
    const dbName = databases.find(d => d.id === id)?.companyName;
    const confirmed = window.confirm(`هل أنت متأكد من الانتقال إلى قاعدة البيانات: ${dbName}؟`);
    if(confirmed) {
        setIsConnecting(id);
        setTimeout(() => {
            const oldDbId = activeDatabaseId;
            DATA_KEYS.forEach(key => {
                const currentData = localStorage.getItem(key);
                if (currentData) localStorage.setItem(`${oldDbId}_${key}`, currentData);
            });
            DATA_KEYS.forEach(key => {
                const savedData = localStorage.getItem(`${id}_${key}`);
                if (savedData) localStorage.setItem(key, savedData);
                else localStorage.setItem(key, '[]'); 
            });
            localStorage.setItem('active_db_id', id);
            setActiveDatabaseId(id);
            window.location.reload(); 
        }, 1000); 
    }
  };

  const handleEditDatabase = (db: SystemDatabase) => { setDbForm({ name: db.name, companyName: db.companyName }); setEditingDbId(db.id); setIsDBModalOpen(true); };

  const handleDeleteDatabase = (id: string) => {
    if (id === activeDatabaseId) { alert('لا يمكن حذف قاعدة البيانات النشطة حالياً.'); return; }
    if (window.confirm('هل أنت متأكد من حذف قاعدة البيانات هذه نهائياً؟')) {
      setDatabases(databases.filter(d => d.id !== id));
      DATA_KEYS.forEach(key => { localStorage.removeItem(`${id}_${key}`); });
      alert('تم حذف قاعدة البيانات بنجاح.');
    }
  };

  const handleSaveDatabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDbId) {
      const updatedDBs = databases.map(db => db.id === editingDbId ? { ...db, name: dbForm.name, companyName: dbForm.companyName } : db);
      setDatabases(updatedDBs);
      alert('تم تحديث بيانات قاعدة البيانات بنجاح');
    } else {
      const newDB: SystemDatabase = { id: `DB${Date.now()}`, name: dbForm.name, companyName: dbForm.companyName, status: 'active', createdAt: new Date().toISOString().split('T')[0], usersCount: 0 };
      setDatabases([...databases, newDB]);
      alert('تم إنشاء قاعدة البيانات بنجاح.');
    }
    setIsDBModalOpen(false);
    setDbForm({ name: '', companyName: '' });
    setEditingDbId(null);
  };

  const handleChangeAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordForm.new !== adminPasswordForm.confirm) { alert('كلمات المرور غير متطابقة'); return; }
    alert('تم تحديث كلمة المرور الخاصة بك بنجاح');
    setAdminPasswordForm({ current: '', new: '', confirm: '' });
  };

  const handleLinkEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const empId = e.target.value;
      const emp = employeesList.find(emp => emp.id === empId);
      if (emp && !userForm.id) {
          setUserForm(prev => ({ ...prev, linkedEmployeeId: empId, fullName: emp.name, username: emp.employeeCode.toLowerCase().replace(/[^a-z0-9]/g, ''), role: UserRole.EMPLOYEE }));
      } else {
          setUserForm(prev => ({ ...prev, linkedEmployeeId: empId }));
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div><h2 className="text-2xl font-bold text-gray-800">{t('systemSettings')}</h2><p className="text-sm text-gray-500">إدارة المستخدمين، الصلاحيات، والنسخ الاحتياطي</p></div>
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-xl overflow-x-auto">
        <button disabled={isExpired} onClick={() => setActiveTab('general')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><Building2 className="h-5 w-5" />{t('companyInfo')}</button>
        <button disabled={isExpired} onClick={() => setActiveTab('departments')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'departments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><Network className="h-5 w-5" />الأقسام</button>
        <button disabled={isExpired} onClick={() => setActiveTab('definitions')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'definitions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><ListChecks className="h-5 w-5" />التعريفات العامة</button>
        <button disabled={isExpired} onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><Users className="h-5 w-5" />{t('users')}</button>
        <button disabled={isExpired} onClick={() => setActiveTab('roles')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'roles' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><Shield className="h-5 w-5" />الأدوار</button>
        <button disabled={isExpired} onClick={() => setActiveTab('payroll')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'payroll' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><DollarSign className="h-5 w-5" />{t('payrollConfig')}</button>
        <button disabled={isExpired} onClick={() => setActiveTab('databases')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'databases' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><Database className="h-5 w-5" />{t('databases')}</button>
        <button disabled={isExpired} onClick={() => setActiveTab('security')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'security' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><Lock className="h-5 w-5" />{t('security')}</button>
        <button disabled={isExpired} onClick={() => setActiveTab('backup')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'backup' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}><HardDrive className="h-5 w-5" />{t('backup')}</button>
        <button onClick={() => setActiveTab('subscription')} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium whitespace-nowrap ${activeTab === 'subscription' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><CreditCard className="h-5 w-5" />{t('subscription')}</button>
      </div>

      <div className="bg-white p-6 rounded-b-xl shadow-sm border border-gray-100 border-t-0 min-h-[500px]">
        
        {/* DEFINITIONS TAB (NEW) */}
        {!isExpired && activeTab === 'definitions' && (
            <div className="flex flex-col md:flex-row gap-6 min-h-[400px]">
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-2 shrink-0">
                    <button onClick={() => setActiveDefType('holidays')} className={`text-right px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeDefType === 'holidays' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}>
                        <Calendar className="h-4 w-4" /> العطلات الرسمية
                    </button>
                    <button onClick={() => setActiveDefType('jobs')} className={`text-right px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeDefType === 'jobs' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}>
                        <Briefcase className="h-4 w-4" /> المسميات الوظيفية
                    </button>
                    <button onClick={() => setActiveDefType('assets')} className={`text-right px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeDefType === 'assets' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}>
                        <Box className="h-4 w-4" /> أنواع الأصول/العهد
                    </button>
                    <button onClick={() => setActiveDefType('docs')} className={`text-right px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeDefType === 'docs' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}>
                        <FileText className="h-4 w-4" /> أنواع الوثائق
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                    {activeDefType === 'holidays' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Calendar className="h-5 w-5 text-indigo-600" /> تعريف العطلات الرسمية</h3>
                            <form onSubmit={handleAddHoliday} className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">اسم العطلة</label>
                                    <input type="text" className="w-full border rounded p-2" value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} placeholder="مثال: عيد الفطر" required />
                                </div>
                                <div className="w-40">
                                    <label className="block text-xs text-gray-500 mb-1">التاريخ</label>
                                    <input type="date" className="w-full border rounded p-2" value={newHoliday.date} onChange={e => setNewHoliday({...newHoliday, date: e.target.value})} required />
                                </div>
                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">إضافة</button>
                            </form>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {holidays.map(h => (
                                    <div key={h.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                                        <div>
                                            <p className="font-bold text-gray-800">{h.name}</p>
                                            <p className="text-xs text-gray-500 font-mono">{h.date}</p>
                                        </div>
                                        <button onClick={() => handleDeleteHoliday(h.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeDefType === 'jobs' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Briefcase className="h-5 w-5 text-indigo-600" /> المسميات الوظيفية (Job Titles)</h3>
                            <form onSubmit={handleAddJobTitle} className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">المسمى الوظيفي</label>
                                    <input type="text" className="w-full border rounded p-2" value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} placeholder="مثال: محاسب أول" required />
                                </div>
                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">إضافة</button>
                            </form>
                            <div className="flex flex-wrap gap-2">
                                {jobTitles.map(j => (
                                    <div key={j.id} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-800 px-3 py-1.5 rounded-full text-sm">
                                        <span>{j.name}</span>
                                        <button onClick={() => handleDeleteJobTitle(j.id)} className="text-indigo-400 hover:text-red-500"><XCircle className="h-4 w-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeDefType === 'assets' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Box className="h-5 w-5 text-indigo-600" /> أنواع الأصول والعهد</h3>
                            <form onSubmit={handleAddAssetType} className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">نوع الأصل</label>
                                    <input type="text" className="w-full border rounded p-2" value={newAssetType} onChange={e => setNewAssetType(e.target.value)} placeholder="مثال: لابتوب، سيارة..." required />
                                </div>
                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">إضافة</button>
                            </form>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {assetTypes.map(a => (
                                    <div key={a.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                                        <span className="font-medium text-gray-700">{a.name}</span>
                                        <button onClick={() => handleDeleteAssetType(a.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeDefType === 'docs' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-600" /> أنواع الوثائق والمستندات</h3>
                            <form onSubmit={handleAddDocType} className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">نوع الوثيقة</label>
                                    <input type="text" className="w-full border rounded p-2" value={newDocType} onChange={e => setNewDocType(e.target.value)} placeholder="مثال: بطاقة رقم قومي، شهادة ميلاد..." required />
                                </div>
                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">إضافة</button>
                            </form>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {docTypes.map(d => (
                                    <div key={d.id} className="flex justify-between items-center p-3 border rounded-lg bg-blue-50/50">
                                        <span className="font-medium text-gray-700">{d.name}</span>
                                        <button onClick={() => handleDeleteDocType(d.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* ... (Rest of the tabs: Payroll, Databases, Security, Backup, Subscription) - Unchanged ... */}
        {/* PAYROLL CONFIG TAB */}
        {!isExpired && activeTab === 'payroll' && (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <div>
                        <h4 className="font-bold text-sm text-green-800">إعدادات محرك الرواتب</h4>
                        <p className="text-xs text-green-700 mt-1">تحديد النسب المئوية للضرائب والتأمينات التي سيتم استخدامها عند حساب الرواتب تلقائياً.</p>
                    </div>
                </div>

                <form onSubmit={handlePayrollConfigSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <h5 className="font-bold text-gray-700 mb-3 border-b pb-2">الاستقطاعات الإلزامية</h5>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">نسبة الضرائب (%)</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={payrollConfig.taxPercentage} onChange={e => setPayrollConfig({...payrollConfig, taxPercentage: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">تأمين اجتماعي (حصة الموظف %)</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={payrollConfig.insuranceEmployeePercentage} onChange={e => setPayrollConfig({...payrollConfig, insuranceEmployeePercentage: Number(e.target.value)})} />
                    </div>
                    
                    <div className="md:col-span-2">
                        <h5 className="font-bold text-gray-700 mb-3 border-b pb-2 mt-4">البدلات والحصص</h5>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">تأمين اجتماعي (حصة الشركة %)</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={payrollConfig.insuranceCompanyPercentage} onChange={e => setPayrollConfig({...payrollConfig, insuranceCompanyPercentage: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">بدل سكن (نسبة من الأساسي)</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={payrollConfig.housingAllowancePercentage} onChange={e => setPayrollConfig({...payrollConfig, housingAllowancePercentage: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">بدل انتقال (نسبة من الأساسي)</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={payrollConfig.transportAllowancePercentage} onChange={e => setPayrollConfig({...payrollConfig, transportAllowancePercentage: Number(e.target.value)})} />
                    </div>

                    <div className="md:col-span-2 flex justify-end pt-4">
                        <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition">
                            <Save className="h-5 w-5" /> حفظ الإعدادات
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === 'subscription' && (
           <div className="max-w-2xl mx-auto text-center animate-in fade-in duration-300">
              {isExpired && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-xl font-bold text-red-700 flex items-center justify-center gap-2">
                          <Lock className="h-6 w-6" />
                          النظام معطل (منتهي الصلاحية)
                      </h3>
                      <p className="text-red-600 mt-2">يرجى إدخال كود تفعيل جديد لاستعادة الوصول إلى بياناتك.</p>
                  </div>
              )}

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

        {/* GENERAL / COMPANY SETTINGS TAB */}
        {!isExpired && activeTab === 'general' && (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">التفاصيل الأساسية</h3>
                <form onSubmit={handleCompanySave} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">اسم المنشأة</label><input type="text" value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label><input type="text" value={companyForm.phone} onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300" dir="ltr" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label><input type="email" value={companyForm.email} onChange={e => setCompanyForm({...companyForm, email: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300" dir="ltr" /></div>
                        <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label><input type="text" value={companyForm.address} onChange={e => setCompanyForm({...companyForm, address: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">الرقم الضريبي</label><input type="text" value={companyForm.taxNumber} onChange={e => setCompanyForm({...companyForm, taxNumber: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">الموقع الإلكتروني</label><input type="text" value={companyForm.website} onChange={e => setCompanyForm({...companyForm, website: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300" dir="ltr" /></div>
                    </div>
                    <div className="pt-4 flex justify-end"><button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700"><Save className="h-5 w-5" /> حفظ البيانات</button></div>
                </form>
                </div>
                <div className="w-full md:w-80 shrink-0">
                <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">شعار الشركة</h3>
                <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center">
                    {companyForm.logo ? <img src={companyForm.logo} alt="Logo" className="w-40 h-40 object-contain mb-4" /> : <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4"><ImageIcon className="h-12 w-12 text-gray-400" /></div>}
                    <button onClick={() => logoInputRef.current?.click()} className="text-indigo-600 text-sm font-bold hover:underline">رفع شعار جديد</button>
                    <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
                </div>
                </div>
            </div>
        </div>
        )}

        {/* DEPARTMENTS TAB */}
        {!isExpired && activeTab === 'departments' && (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-center gap-3">
                    <Network className="h-6 w-6 text-indigo-600" />
                    <div>
                        <h4 className="font-bold text-sm text-indigo-800">الهيكل الإداري للشركة</h4>
                        <p className="text-xs text-indigo-700 mt-1">قم بإضافة وتعديل أقسام الشركة لتظهر في قوائم الموظفين.</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="اسم القسم الجديد..." 
                        className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none"
                        value={newDept}
                        onChange={e => setNewDept(e.target.value)}
                    />
                    <button 
                        onClick={handleAddDepartment}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" /> إضافة
                    </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-700 text-sm">
                        الأقسام الحالية ({departments.length})
                    </div>
                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {departments.map((dept, index) => (
                            <div key={index} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group">
                                <span className="text-gray-800 font-medium">{dept}</span>
                                <button 
                                    onClick={() => handleDeleteDepartment(dept)}
                                    className="text-gray-400 hover:text-red-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="حذف"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {departments.length === 0 && (
                            <div className="p-6 text-center text-gray-400 text-sm">
                                لا توجد أقسام مضافة حالياً.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* USERS TAB */}
        {!isExpired && activeTab === 'users' && (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
            <button onClick={() => handleOpenUserModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"><Plus className="h-5 w-5" /> مستخدم جديد</button>
            </div>
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-gray-500"><tr><th className="px-6 py-4">المستخدم</th><th className="px-6 py-4">الدور</th><th className="px-6 py-4">ارتباط بموظف</th><th className="px-6 py-4">الحالة</th><th className="px-6 py-4">إجراءات</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{user.fullName} ({user.username})</td>
                    <td className="px-6 py-4"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs border border-indigo-100">{user.role}</span></td>
                    <td className="px-6 py-4">{user.linkedEmployeeId ? <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded w-fit"><UserCheck className="h-3 w-3" /> تم الربط</span> : '-'}</td>
                    <td className="px-6 py-4"><button onClick={() => toggleUserStatus(user.id)} className={`px-2 py-1 rounded text-xs ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.active ? 'نشط' : 'موقف'}</button></td>
                    <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => handleOpenUserModal(user)}><Edit className="h-4 w-4 text-blue-600" /></button><button onClick={() => { setSelectedUser(user); setIsPasswordModalOpen(true); }}><Key className="h-4 w-4 text-indigo-600" /></button></div></td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
        )}

        {/* ROLES TAB */}
        {!isExpired && activeTab === 'roles' && (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="text-gray-600 text-sm">قم بإنشاء أدوار مخصصة وتحديد الصلاحيات لكل دور.</div>
                    <button onClick={() => handleOpenRoleModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"><Plus className="h-5 w-5" /> دور جديد</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map(role => (
                        <div key={role.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-indigo-600" />
                                    {role.name}
                                </h4>
                                {!role.isSystem && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenRoleModal(role)} className="text-gray-400 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => handleDeleteRole(role.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                )}
                                {role.isSystem && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded">نظام</span>}
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                                {role.permissions.slice(0, 5).map(perm => (
                                    <span key={perm} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{AVAILABLE_PERMISSIONS.find(p => p.id === perm)?.label || perm}</span>
                                ))}
                                {role.permissions.length > 5 && <span className="text-[10px] text-gray-500">+{role.permissions.length - 5} المزيد</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* DATABASES TAB */}
        {!isExpired && activeTab === 'databases' && (
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
                <div key={db.id} className={`border rounded-xl p-5 hover:shadow-md transition-all ${db.id === activeDatabaseId ? 'border-green-500 ring-2 ring-green-100 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg border ${db.id === activeDatabaseId ? 'bg-green-100 border-green-200' : 'bg-white border-gray-200'}`}>
                            <Database className={`h-6 w-6 ${db.id === activeDatabaseId ? 'text-green-600' : 'text-indigo-600'}`} />
                        </div>
                        {db.id === activeDatabaseId && <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded-full">نشط الآن</span>}
                    </div>
                    <h3 className="font-bold text-gray-800">{db.companyName}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1 mb-4">{db.name}</p>
                    <div className="mt-4 flex gap-2">
                        <button onClick={() => handleConnectDatabase(db.id)} disabled={db.id === activeDatabaseId} className="flex-1 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isConnecting === db.id ? 'جاري الاتصال...' : (db.id === activeDatabaseId ? 'متصل' : 'اتصال')}
                        </button>
                        <button onClick={() => handleEditDatabase(db)} className="px-3 py-1.5 text-xs font-medium border border-gray-300 bg-white rounded hover:bg-gray-50"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteDatabase(db.id)} disabled={db.id === activeDatabaseId} className="px-3 py-1.5 text-xs font-medium border border-red-200 bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                </div>
                ))}
            </div>
        </div>
        )}

        {/* SECURITY TAB */}
        {!isExpired && activeTab === 'security' && (
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
        {!isExpired && activeTab === 'backup' && (
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
      </div>

      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                 <h3 className="font-bold text-gray-800">{userForm.id ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</h3>
                 <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSaveUser} className="p-6 space-y-6">
                   <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <label className="block text-sm font-medium text-blue-800 mb-2">ربط بموظف (للخدمة الذاتية)</label>
                        <select className="w-full border border-blue-200 rounded-lg p-2 text-sm bg-white" value={userForm.linkedEmployeeId} onChange={handleLinkEmployeeChange}>
                            <option value="">-- حساب إداري (غير مرتبط) --</option>
                            {employeesList.map(emp => (<option key={emp.id} value={emp.id}>{emp.name} - {emp.employeeCode}</option>))}
                        </select>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="text-sm block mb-1">اسم المستخدم</label><input type="text" required className="w-full border rounded p-2" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} /></div>
                      <div><label className="text-sm block mb-1">الاسم الكامل</label><input type="text" required className="w-full border rounded p-2" value={userForm.fullName} onChange={e => setUserForm({...userForm, fullName: e.target.value})} /></div>
                      <div><label className="text-sm block mb-1">البريد الإلكتروني</label><input type="email" required className="w-full border rounded p-2" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} /></div>
                      
                      <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">الدور (Role)</label>
                          <select 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-indigo-500 outline-none" 
                            value={userForm.role} 
                            onChange={e => handleUserRoleChange(e.target.value)}
                          >
                             {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                          </select>
                      </div>

                      {!userForm.id && <div className="md:col-span-2"><label className="text-sm block mb-1">كلمة المرور</label><input type="password" required className="w-full border rounded p-2" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} /></div>}
                   </div>
                   
                   <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-gray-700">صلاحيات الوصول</h4>
                            <span className="text-xs text-gray-500">تم تحديدها تلقائياً بناءً على الدور</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {AVAILABLE_PERMISSIONS.map(p => (
                                <div key={p.id} onClick={() => togglePermission(p.id)} className={`p-2 border rounded cursor-pointer ${userForm.permissions.includes(p.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''}`}>
                                    {userForm.permissions.includes(p.id) ? <CheckSquare className="h-3 w-3 inline mr-1" /> : <Square className="h-3 w-3 inline mr-1" />}
                                    {p.label}
                                </div>
                            ))}
                        </div>
                   </div>
                </form>
              </div>
              <div className="p-4 border-t flex justify-end gap-2"><button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 border rounded">إلغاء</button><button onClick={handleSaveUser} className="px-4 py-2 bg-indigo-600 text-white rounded">حفظ</button></div>
           </div>
        </div>
      )}

      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                 <h3 className="font-bold text-gray-800">{roleForm.id ? 'تعديل الدور' : 'إنشاء دور جديد'}</h3>
                 <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                 <form onSubmit={handleSaveRole} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم الدور</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:border-indigo-500 outline-none" 
                            placeholder="مثال: مشرف مبيعات"
                            value={roleForm.name} 
                            onChange={e => setRoleForm({...roleForm, name: e.target.value})} 
                            disabled={roleForm.isSystem} 
                        />
                        {roleForm.isSystem && <p className="text-xs text-orange-600 mt-1">هذا دور أساسي في النظام.</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">الصلاحيات الافتراضية</label>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                            {AVAILABLE_PERMISSIONS.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => toggleRolePermission(p.id)} 
                                    className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${roleForm.permissions?.includes(p.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200'}`}
                                >
                                    {roleForm.permissions?.includes(p.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-gray-400" />}
                                    <span className="text-sm">{p.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                 </form>
              </div>
              <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
                 <button onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">إلغاء</button>
                 <button onClick={handleSaveRole} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">حفظ الدور</button>
              </div>
           </div>
        </div>
      )}
      
      {isDBModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800">
                    {editingDbId ? 'تعديل قاعدة البيانات' : 'إنشاء قاعدة بيانات جديدة'}
                 </h3>
                 <button onClick={() => setIsDBModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleSaveDatabase} className="p-6 space-y-4">
                 <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">اسم الشركة</label>
                    <input type="text" required placeholder="مثال: شركة النور فرع القاهرة" className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={dbForm.companyName} onChange={e => setDbForm({...dbForm, companyName: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">اسم قاعدة البيانات (System Name)</label>
                    <input type="text" required placeholder="db_company_branch" className="w-full border border-gray-300 rounded-lg p-2 text-sm font-mono" value={dbForm.name} onChange={e => setDbForm({...dbForm, name: e.target.value})} />
                 </div>
                 <div className="pt-2"><button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">{editingDbId ? 'حفظ التعديلات' : 'إنشاء القاعدة'}</button></div>
              </form>
           </div>
        </div>
      )}

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
