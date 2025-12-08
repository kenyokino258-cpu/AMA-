
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEPARTMENTS as DEFAULT_DEPTS, MOCK_SHIFTS, MOCK_JOB_TITLES } from '../constants';
import { Search, Plus, Filter, List, Trash2, Save, RefreshCw, LayoutGrid, Edit, Phone, Mail } from 'lucide-react';
import { Employee, EmploymentType, Shift, SystemDefinition } from '../types';
import DataControls from '../components/DataControls';
import { api } from '../services/api'; 
import { AppContext } from '../App';

const Employees: React.FC = () => {
  const { isServerOnline } = useContext(AppContext);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const [shifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('shifts_data');
    return saved ? JSON.parse(saved) : MOCK_SHIFTS;
  });

  const [departments] = useState<string[]>(() => {
      const saved = localStorage.getItem('system_departments');
      return saved ? JSON.parse(saved) : DEFAULT_DEPTS;
  });

  const [jobTitles] = useState<SystemDefinition[]>(() => {
      const saved = localStorage.getItem('system_job_titles');
      return saved ? JSON.parse(saved) : MOCK_JOB_TITLES;
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [colFilters, setColFilters] = useState({
    code: '',
    name: '',
    department: 'all',
    nationalId: '',
    joinDate: '',
    status: 'all'
  });
  
  const [cardEmployee, setCardEmployee] = useState<Employee | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'personal' | 'job' | 'contact'>('personal');
  
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({
    name: '',
    nationalId: '',
    gender: 'male',
    maritalStatus: 'single',
    birthDate: '',
    
    employeeCode: '',
    jobTitle: '',
    department: '',
    managerId: '',
    joinDate: new Date().toISOString().split('T')[0],
    salary: 0,
    contractType: EmploymentType.FULL_TIME,
    shiftId: '',
    status: 'active',
    
    phone: '',
    email: '',
    address: ''
  });

  const navigate = useNavigate();
  const isAdmin = true;

  const fetchEmployees = useCallback(async () => {
      setLoading(true);
      try {
          if (isServerOnline) {
              const data = await api.getEmployees();
              setEmployees(data);
          } else {
              const saved = localStorage.getItem('employees_data');
              if (saved) setEmployees(JSON.parse(saved));
          }
      } catch (err) {
          console.error("Failed to fetch employees", err);
      } finally {
          setLoading(false);
      }
  }, [isServerOnline]);

  useEffect(() => {
      fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = employees.filter(emp => {
    const matchesGlobal = (emp.name || '').includes(searchTerm) || 
                          (emp.nationalId || '').includes(searchTerm) || 
                          (emp.employeeCode || '').includes(searchTerm) ||
                          (emp.phone || '').includes(searchTerm) ||
                          (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCode = (emp.employeeCode || '').toLowerCase().includes(colFilters.code.toLowerCase());
    const matchesName = (emp.name || '').toLowerCase().includes(colFilters.name.toLowerCase());
    const matchesDept = colFilters.department === 'all' || emp.department === colFilters.department;
    const matchesNID = (emp.nationalId || '').includes(colFilters.nationalId);
    const matchesDate = (emp.joinDate || '').includes(colFilters.joinDate);
    const matchesStatus = colFilters.status === 'all' || emp.status === colFilters.status;
    
    return matchesGlobal && matchesCode && matchesName && matchesDept && matchesNID && matchesDate && matchesStatus;
  });

  const handleImport = (data: any[]) => {
    data.forEach(async (d: any) => {
        const emp = { ...d, id: `E${Date.now()}_${Math.random()}` };
        if(isServerOnline) await api.saveEmployee(emp);
    });
    setTimeout(fetchEmployees, 1000); 
  };

  const handleOpenModal = (employee?: Employee) => {
      if (employee) {
          setEditingId(employee.id);
          setEmployeeForm(employee);
      } else {
          setEditingId(null);
          setEmployeeForm({
            name: '', nationalId: '', gender: 'male', maritalStatus: 'single', birthDate: '',
            employeeCode: '', jobTitle: '', department: '', managerId: '', joinDate: new Date().toISOString().split('T')[0],
            salary: 0, contractType: EmploymentType.FULL_TIME, shiftId: '', status: 'active',
            phone: '', email: '', address: ''
          });
      }
      setActiveModalTab('personal');
      setIsAddModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedShift = shifts.find(s => s.id === employeeForm.shiftId);

    const employeeData: Employee = {
      ...employeeForm as Employee,
      id: editingId || `E${Date.now()}`,
      employeeCode: employeeForm.employeeCode || `EMP-${Math.floor(Math.random() * 10000)}`,
      avatar: employeeForm.avatar || `https://ui-avatars.com/api/?name=${employeeForm.name}&background=random`,
      shiftName: selectedShift ? selectedShift.name : '',
    };

    if (isServerOnline) {
        try {
            await api.saveEmployee(employeeData);
            fetchEmployees();
        } catch (err) {
            alert('فشل الحفظ في قاعدة البيانات');
        }
    } else {
        let updated;
        if (editingId) {
            updated = employees.map(e => e.id === editingId ? employeeData : e);
        } else {
            updated = [...employees, employeeData];
        }
        setEmployees(updated);
        localStorage.setItem('employees_data', JSON.stringify(updated));
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف نهائياً؟')) {
        if (isServerOnline) {
            await api.deleteEmployee(id);
            fetchEmployees();
        } else {
            const updated = employees.filter(e => e.id !== id);
            setEmployees(updated);
            localStorage.setItem('employees_data', JSON.stringify(updated));
        }
    }
  };

  const handleBulkDelete = async () => {
      if (selectedIds.size === 0) return;
      if (window.confirm(`هل أنت متأكد من حذف ${selectedIds.size} موظف؟`)) {
          for (const id of selectedIds) {
              if (isServerOnline) await api.deleteEmployee(id);
          }
          if (!isServerOnline) {
              const updated = employees.filter(e => !selectedIds.has(e.id));
              setEmployees(updated);
              localStorage.setItem('employees_data', JSON.stringify(updated));
          } else {
              fetchEmployees();
          }
          setSelectedIds(new Set());
      }
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const selectAll = () => {
      if (selectedIds.size === filteredEmployees.length) setSelectedIds(new Set());
      else setSelectedIds(new Set(filteredEmployees.map(e => e.id)));
  };

  const handlePrintCard = () => {
    const printContent = document.getElementById('employee-id-card-content');
    if (!printContent) return;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head><title>بطاقة - ${cardEmployee?.name}</title><script src="https://cdn.tailwindcss.com"></script><style>body{font-family:'Arial';display:flex;justify-content:center;align-items:center;min-height:100vh}</style></head>
          <body>${printContent.innerHTML}<script>setTimeout(()=>{window.print();window.close()},500);</script></body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              إدارة الموظفين (Master Data)
              {!isServerOnline && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded border border-red-200">Local Mode</span>}
          </h2>
          <p className="text-sm text-gray-500">مركز البيانات الرئيسي للموظفين، العقود، والهيكل الوظيفي</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchEmployees} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors" title="تحديث البيانات">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="bg-white border border-gray-300 rounded-lg flex overflow-hidden">
              <button onClick={() => setViewMode('table')} className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-gray-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`} title="عرض قائمة"><List className="h-5 w-5" /></button>
              <div className="w-px bg-gray-200"></div>
              <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`} title="عرض بطاقات"><LayoutGrid className="h-5 w-5" /></button>
          </div>

          <DataControls data={employees} fileName="employees_data" onImport={handleImport} isAdmin={isAdmin} />
          
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 transition">
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">إضافة موظف</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex justify-between items-center animate-in slide-in-from-top-2">
              <span className="text-indigo-800 font-medium px-2">تم تحديد {selectedIds.size} موظف</span>
              <div className="flex gap-2">
                  <button onClick={handleBulkDelete} className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition text-sm"><Trash2 className="h-4 w-4" /> حذف المحدد</button>
                  <button onClick={() => setSelectedIds(new Set())} className="text-gray-500 hover:text-gray-700 px-3 text-sm">إلغاء</button>
              </div>
          </div>
      )}

      {/* Main Content Area */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 lg:flex-row lg:items-center justify-between bg-gray-50/50">
          <div className="relative w-full lg:w-96">
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="بحث سريع (الاسم، الكود، الهاتف)..." className="w-full rounded-lg border border-gray-200 py-2.5 pr-10 pl-4 focus:border-indigo-500 focus:outline-none bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              <span>إجمالي السجلات: {filteredEmployees.length}</span>
          </div>
        </div>

        {/* View: Table */}
        {viewMode === 'table' && (
            <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-gray-500">
                <tr>
                    <th className="px-4 py-4 w-10 text-center"><input type="checkbox" className="rounded border-gray-300" checked={selectedIds.size === filteredEmployees.length && filteredEmployees.length > 0} onChange={selectAll} /></th>
                    <th className="px-4 py-4 font-medium">الكود الوظيفي</th>
                    <th className="px-6 py-4 font-medium">الموظف</th>
                    <th className="px-6 py-4 font-medium">القسم / الوظيفة</th>
                    <th className="px-6 py-4 font-medium">الاتصال</th>
                    <th className="px-6 py-4 font-medium">تاريخ التعيين</th>
                    <th className="px-6 py-4 font-medium">الحالة</th>
                    <th className="px-6 py-4 font-medium">إجراءات</th>
                </tr>
                <tr className="bg-gray-50 border-b border-gray-100">
                    <th></th>
                    <th className="px-4 py-2"><input type="text" className="w-full text-xs p-1.5 border rounded bg-white" value={colFilters.code} onChange={(e) => setColFilters({...colFilters, code: e.target.value})} placeholder="تصفية..." /></th>
                    <th className="px-6 py-2"><input type="text" className="w-full text-xs p-1.5 border rounded bg-white" value={colFilters.name} onChange={(e) => setColFilters({...colFilters, name: e.target.value})} placeholder="تصفية..." /></th>
                    <th className="px-6 py-2"><select className="w-full text-xs p-1.5 border rounded bg-white" value={colFilters.department} onChange={(e) => setColFilters({...colFilters, department: e.target.value})}><option value="all">الكل</option>{departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}</select></th>
                    <th className="px-6 py-2"></th>
                    <th className="px-6 py-2"><input type="text" placeholder="YYYY-MM-DD" className="w-full text-xs p-1.5 border rounded bg-white" value={colFilters.joinDate} onChange={(e) => setColFilters({...colFilters, joinDate: e.target.value})} /></th>
                    <th className="px-6 py-2"><select className="w-full text-xs p-1.5 border rounded bg-white" value={colFilters.status} onChange={(e) => setColFilters({...colFilters, status: e.target.value})}><option value="all">الكل</option><option value="active">نشط</option><option value="on_leave">إجازة</option><option value="inactive">متوقف</option></select></th>
                    <th className="px-6 py-2"></th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((emp) => (
                    <tr key={emp.id} onClick={() => navigate(`/employees/${emp.id}`)} className={`hover:bg-indigo-50/30 transition cursor-pointer ${selectedIds.has(emp.id) ? 'bg-indigo-50' : ''}`}>
                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-300" checked={selectedIds.has(emp.id)} onChange={() => toggleSelection(emp.id)} /></td>
                    <td className="px-4 py-4"><span className="font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">{emp.employeeCode}</span></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><img src={emp.avatar || 'https://via.placeholder.com/40'} alt="" className="h-9 w-9 rounded-full object-cover border border-gray-200" /><div><p className="font-semibold text-gray-900 text-sm">{emp.name}</p><p className="text-[10px] text-gray-400">{emp.nationalId}</p></div></div></td>
                    <td className="px-6 py-4"><p className="font-medium text-gray-900 text-sm">{emp.jobTitle}</p><p className="text-xs text-gray-500">{emp.department}</p></td>
                    <td className="px-6 py-4"><div className="text-gray-600 text-xs flex flex-col gap-1">{emp.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {emp.phone}</span>}{emp.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3"/> {emp.email}</span>}</div></td>
                    <td className="px-6 py-4"><div className="text-gray-600 font-mono text-xs">{emp.joinDate}</div></td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{emp.status === 'active' ? 'نشط' : 'متوقف'}</span></td>
                    <td className="px-6 py-4 relative">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleOpenModal(emp)} className="text-gray-400 hover:text-blue-600 bg-white border border-gray-200 p-1.5 rounded shadow-sm" title="تعديل سريع"><Edit className="h-3.5 w-3.5" /></button>
                        <button onClick={() => navigate(`/employees/${emp.id}`)} className="text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 p-1.5 rounded shadow-sm" title="الملف"><Filter className="h-3.5 w-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id); }} className="text-gray-400 hover:text-red-600 bg-white border border-gray-200 p-1.5 rounded shadow-sm" title="حذف"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}

        {/* View: Grid */}
        {viewMode === 'grid' && (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-gray-50/30">
                {filteredEmployees.map((emp) => (
                    <div key={emp.id} className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all group relative cursor-pointer ${selectedIds.has(emp.id) ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'}`} onClick={() => navigate(`/employees/${emp.id}`)}>
                        <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-300 w-4 h-4 cursor-pointer" checked={selectedIds.has(emp.id)} onChange={() => toggleSelection(emp.id)} /></div>
                        <div className="flex flex-col items-center text-center">
                            <div className="relative">
                                <img src={emp.avatar} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm mb-3" />
                                <div className={`absolute bottom-3 right-0 w-4 h-4 rounded-full border-2 border-white ${emp.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                            <h3 className="font-bold text-gray-900">{emp.name}</h3>
                            <p className="text-sm text-indigo-600 font-medium mb-1">{emp.jobTitle}</p>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mb-3">{emp.department}</span>
                            <div className="flex gap-2 mb-3">
                                {emp.phone && <a href={`tel:${emp.phone}`} onClick={e => e.stopPropagation()} className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100"><Phone className="h-3 w-3" /></a>}
                                {emp.email && <a href={`mailto:${emp.email}`} onClick={e => e.stopPropagation()} className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Mail className="h-3 w-3" /></a>}
                            </div>
                            <div className="w-full border-t border-gray-100 pt-3 flex justify-between items-center text-xs text-gray-500">
                                <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">{emp.employeeCode}</span>
                                <span>{emp.joinDate}</span>
                            </div>
                        </div>
                        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleOpenModal(emp)} className="p-1.5 bg-white rounded-full shadow border border-gray-200 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 bg-white rounded-full shadow border border-gray-200 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* ID Card Modal - Kept Same */}
      {cardEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
             <div id="employee-id-card-content" className="border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white relative">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-600 to-indigo-800"></div>
                <div className="p-6 text-center relative pt-12">
                    <img src={cardEmployee.avatar} alt="Avatar" className="w-28 h-28 rounded-full mx-auto border-4 border-white shadow-lg mb-4 bg-white" />
                    <h3 className="text-xl font-bold text-gray-900">{cardEmployee.name}</h3>
                    <p className="text-indigo-600 font-medium mb-1">{cardEmployee.jobTitle}</p>
                    <p className="text-gray-400 text-xs mb-6">{cardEmployee.department}</p>
                    <div className="grid grid-cols-2 gap-3 text-left bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
                        <div><span className="text-[10px] text-gray-400 uppercase tracking-wider block">ID Code</span><span className="font-mono font-bold text-gray-800">{cardEmployee.employeeCode}</span></div>
                        <div><span className="text-[10px] text-gray-400 uppercase tracking-wider block">Join Date</span><span className="font-mono font-bold text-gray-800">{cardEmployee.joinDate}</span></div>
                        <div className="col-span-2"><span className="text-[10px] text-gray-400 uppercase tracking-wider block">National ID</span><span className="font-mono font-bold text-gray-800 tracking-wide">{cardEmployee.nationalId}</span></div>
                    </div>
                </div>
             </div>
             <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setCardEmployee(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">إغلاق</button>
                <button onClick={handlePrintCard} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">طباعة</button>
             </div>
          </div>
        </div>
      )}

      {/* Add/Edit Employee Modal (Tabbed) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 p-6 bg-gray-50">
                 <div>
                    <h3 className="text-xl font-bold text-gray-800">{editingId ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h3>
                    <p className="text-sm text-gray-500 mt-1">البيانات الأساسية، الوظيفية، والتعاقدية</p>
                 </div>
                 <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><List className="h-6 w-6" /></button>
              </div>
              
              <div className="flex border-b border-gray-200">
                  <button onClick={() => setActiveModalTab('personal')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeModalTab === 'personal' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>البيانات الشخصية</button>
                  <button onClick={() => setActiveModalTab('job')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeModalTab === 'job' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>العمل والتعاقد</button>
                  <button onClick={() => setActiveModalTab('contact')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeModalTab === 'contact' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>الاتصال والمالية</button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                 <form id="add-employee-form" onSubmit={handleSaveEmployee}>
                    {activeModalTab === 'personal' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-sm font-medium block mb-1">الاسم الكامل <span className="text-red-500">*</span></label><input type="text" required className="w-full border rounded-lg p-2.5" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} placeholder="الاسم رباعي" /></div>
                                <div><label className="text-sm font-medium block mb-1">الرقم القومي <span className="text-red-500">*</span></label><input type="text" required className="w-full border rounded-lg p-2.5" value={employeeForm.nationalId} onChange={e => setEmployeeForm({...employeeForm, nationalId: e.target.value})} placeholder="14 رقم" maxLength={14} /></div>
                                <div><label className="text-sm font-medium block mb-1">تاريخ الميلاد</label><input type="date" className="w-full border rounded-lg p-2.5" value={employeeForm.birthDate} onChange={e => setEmployeeForm({...employeeForm, birthDate: e.target.value})} /></div>
                                <div><label className="text-sm font-medium block mb-1">الجنس</label><select className="w-full border rounded-lg p-2.5" value={employeeForm.gender} onChange={e => setEmployeeForm({...employeeForm, gender: e.target.value as any})}><option value="male">ذكر</option><option value="female">أنثى</option></select></div>
                                <div><label className="text-sm font-medium block mb-1">الحالة الاجتماعية</label><select className="w-full border rounded-lg p-2.5" value={employeeForm.maritalStatus} onChange={e => setEmployeeForm({...employeeForm, maritalStatus: e.target.value as any})}><option value="single">أعزب</option><option value="married">متزوج</option><option value="divorced">مطلق</option><option value="widowed">أرمل</option></select></div>
                            </div>
                        </div>
                    )}

                    {activeModalTab === 'job' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-sm font-medium block mb-1">الكود الوظيفي</label><input type="text" className="w-full border rounded-lg p-2.5 bg-gray-50" value={employeeForm.employeeCode} onChange={e => setEmployeeForm({...employeeForm, employeeCode: e.target.value})} placeholder="اتركه فارغاً للتوليد التلقائي" /></div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">المسمى الوظيفي <span className="text-red-500">*</span></label>
                                    <input list="job-titles" required className="w-full border rounded-lg p-2.5" value={employeeForm.jobTitle} onChange={e => setEmployeeForm({...employeeForm, jobTitle: e.target.value})} placeholder="اكتب أو اختر..." />
                                    <datalist id="job-titles">{jobTitles.map(t => <option key={t.id} value={t.name} />)}</datalist>
                                </div>
                                <div><label className="text-sm font-medium block mb-1">القسم <span className="text-red-500">*</span></label><select required className="w-full border rounded-lg p-2.5" value={employeeForm.department} onChange={e => setEmployeeForm({...employeeForm, department: e.target.value})}><option value="">اختر القسم</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">المدير المباشر</label>
                                    <select className="w-full border rounded-lg p-2.5" value={employeeForm.managerId || ''} onChange={e => setEmployeeForm({...employeeForm, managerId: e.target.value})}>
                                        <option value="">لا يوجد مدير مباشر</option>
                                        {employees.filter(e => e.status === 'active' && e.id !== editingId).map(emp => (<option key={emp.id} value={emp.id}>{emp.name} - {emp.jobTitle}</option>))}
                                    </select>
                                </div>
                                <div><label className="text-sm font-medium block mb-1">تاريخ التعيين <span className="text-red-500">*</span></label><input type="date" required className="w-full border rounded-lg p-2.5" value={employeeForm.joinDate} onChange={e => setEmployeeForm({...employeeForm, joinDate: e.target.value})} /></div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">الوردية (Shift)</label>
                                    <select required className="w-full border rounded-lg p-2.5" value={employeeForm.shiftId} onChange={e => setEmployeeForm({...employeeForm, shiftId: e.target.value})}>
                                        <option value="">اختر الوردية</option>
                                        {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>)}
                                    </select>
                                </div>
                                <div><label className="text-sm font-medium block mb-1">نوع العقد</label><select className="w-full border rounded-lg p-2.5" value={employeeForm.contractType} onChange={e => setEmployeeForm({...employeeForm, contractType: e.target.value as any})}>{Object.values(EmploymentType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                <div><label className="text-sm font-medium block mb-1">الحالة</label><select className="w-full border rounded-lg p-2.5" value={employeeForm.status} onChange={e => setEmployeeForm({...employeeForm, status: e.target.value as any})}><option value="active">نشط</option><option value="inactive">موقف</option><option value="on_leave">إجازة</option></select></div>
                            </div>
                        </div>
                    )}

                    {activeModalTab === 'contact' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-sm font-medium block mb-1">رقم الهاتف</label><input type="tel" className="w-full border rounded-lg p-2.5" value={employeeForm.phone} onChange={e => setEmployeeForm({...employeeForm, phone: e.target.value})} placeholder="01xxxxxxxxx" /></div>
                                <div><label className="text-sm font-medium block mb-1">البريد الإلكتروني</label><input type="email" className="w-full border rounded-lg p-2.5" value={employeeForm.email} onChange={e => setEmployeeForm({...employeeForm, email: e.target.value})} placeholder="email@example.com" /></div>
                                <div className="md:col-span-2"><label className="text-sm font-medium block mb-1">العنوان</label><input type="text" className="w-full border rounded-lg p-2.5" value={employeeForm.address} onChange={e => setEmployeeForm({...employeeForm, address: e.target.value})} placeholder="العنوان بالتفصيل" /></div>
                                <div className="md:col-span-2"><hr className="my-2"/></div>
                                <div><label className="text-sm font-medium block mb-1">الراتب الأساسي <span className="text-red-500">*</span></label><div className="relative"><input type="number" required className="w-full border rounded-lg p-2.5 pl-8 font-bold text-gray-700" value={employeeForm.salary} onChange={e => setEmployeeForm({...employeeForm, salary: Number(e.target.value)})} /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">ج.م</span></div></div>
                            </div>
                        </div>
                    )}
                 </form>
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                 <button type="button" onClick={() => {
                     if(activeModalTab === 'contact') setActiveModalTab('job');
                     else if(activeModalTab === 'job') setActiveModalTab('personal');
                 }} className={`px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium ${activeModalTab === 'personal' ? 'invisible' : ''}`}>السابق</button>
                 
                 {activeModalTab !== 'contact' ? (
                     <button type="button" onClick={() => {
                        if(activeModalTab === 'personal') setActiveModalTab('job');
                        else if(activeModalTab === 'job') setActiveModalTab('contact');
                     }} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm">التالي</button>
                 ) : (
                     <button type="submit" form="add-employee-form" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm flex items-center gap-2"><Save className="h-4 w-4" /> حفظ البيانات</button>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
