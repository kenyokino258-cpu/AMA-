
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_EMPLOYEES } from '../constants';
import { Search, Plus, Filter, MoreVertical, FileText, User, CreditCard, CalendarOff } from 'lucide-react';
import { Employee } from '../types';
import DataControls from '../components/DataControls';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

  // Simulated Admin Status
  const isAdmin = true;

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.includes(searchTerm) || 
                          emp.nationalId.includes(searchTerm) || 
                          emp.department.includes(searchTerm) || 
                          emp.employeeCode.includes(searchTerm); // Added code search
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleImport = (data: any[]) => {
    // In a real app, you would validate and map the data to the Employee interface
    // For this demo, we'll just log it and maybe append if valid
    console.log('Imported Employees:', data);
    // basic mapping simulation
    const newEmployees = data.map((d: any, idx) => ({
      ...MOCK_EMPLOYEES[0], // fallback defaults
      ...d,
      id: `IMP-${Date.now()}-${idx}`
    }));
    setEmployees([...employees, ...newEmployees]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة الموظفين</h2>
          <p className="text-sm text-gray-500">عرض وإدارة بيانات العاملين الأساسية والتعاقدية</p>
        </div>
        <div className="flex gap-3">
          <DataControls 
            data={employees} 
            fileName="employees_data" 
            onImport={handleImport}
            isAdmin={isAdmin}
            headers={[
              { key: 'employeeCode', label: 'الكود الوظيفي' }, // Added code to export
              { key: 'name', label: 'الاسم' },
              { key: 'nationalId', label: 'الرقم القومي' },
              { key: 'jobTitle', label: 'الوظيفة' },
              { key: 'department', label: 'القسم' },
              { key: 'contractType', label: 'نوع العقد' },
              { key: 'salary', label: 'الراتب' },
              { key: 'joinDate', label: 'تاريخ التعيين' },
              { key: 'endOfServiceDate', label: 'تاريخ نهاية الخدمة' }
            ]}
          />
          <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 transition">
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">إضافة موظف</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="بحث بالاسم، الكود الوظيفي، أو الرقم القومي..."
              className="w-full rounded-lg border border-gray-200 py-2 pr-10 pl-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white py-2 px-4 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none cursor-pointer hover:bg-gray-50"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="on_leave">إجازة</option>
              <option value="inactive">متوقف</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium">الكود الوظيفي</th> {/* New Column */}
                <th className="px-6 py-4 font-medium">الموظف</th>
                <th className="px-6 py-4 font-medium">القسم / الوظيفة</th>
                <th className="px-6 py-4 font-medium">الرقم القومي</th>
                <th className="px-6 py-4 font-medium">تاريخ التعيين</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map((emp) => (
                <tr 
                  key={emp.id} 
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded">{emp.employeeCode}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{emp.jobTitle}</p>
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-xs text-gray-500">{emp.department}</p>
                      <span className="inline-flex w-fit items-center rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                        {emp.contractType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2 text-gray-600" title="الرقم القومي">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-sm">{emp.nationalId}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-600 font-mono text-sm">{emp.joinDate}</div>
                    {emp.endOfServiceDate && (
                       <div className="flex items-center gap-1 text-red-500 text-xs mt-1 bg-red-50 px-1.5 py-0.5 rounded w-fit" title="تاريخ نهاية الخدمة">
                          <CalendarOff className="h-3 w-3" />
                          <span>{emp.endOfServiceDate}</span>
                       </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${emp.status === 'active' ? 'bg-green-100 text-green-800' : 
                        emp.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}
                    `}>
                      {emp.status === 'active' ? 'نشط' : emp.status === 'on_leave' ? 'إجازة' : 'متوقف'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                       <button 
                         onClick={() => navigate(`/employees/${emp.id}`)}
                         className="text-gray-400 hover:text-indigo-600" 
                         title="الملف الشخصي"
                       >
                          <User className="h-4 w-4" />
                       </button>
                       <button className="text-gray-400 hover:text-indigo-600" title="العقد">
                          <FileText className="h-4 w-4" />
                       </button>
                       <button className="text-gray-400 hover:text-indigo-600">
                          <MoreVertical className="h-4 w-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEmployees.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              لا توجد نتائج مطابقة للبحث
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Employees;
