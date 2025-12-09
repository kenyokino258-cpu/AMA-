import React, { useState, useEffect, useMemo, useContext } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area
} from 'recharts';
import { 
  FileText, Users, Clock, DollarSign, Briefcase, Download, 
  Filter, Calendar, Printer, Search, Table, PieChart as PieIcon, 
  ArrowRight, ChevronRight, FileSpreadsheet, ShieldCheck, Wallet
} from 'lucide-react';
import { AppContext } from '../App';
import { Employee, AttendanceRecord, PayrollRecord, Candidate, ApplicationStatus } from '../types';
import { 
  MOCK_EMPLOYEES, MOCK_ATTENDANCE, MOCK_PAYROLL, MOCK_CANDIDATES, 
  MOCK_LEAVES, MOCK_LOANS, DEPARTMENTS 
} from '../constants';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const Reports: React.FC = () => {
  const { t, language } = useContext(AppContext);
  const [activeCategory, setActiveCategory] = useState<'employees' | 'attendance' | 'financial' | 'recruitment'>('employees');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  
  // Filter States
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [selectedDept, setSelectedDept] = useState('all');
  
  // Raw Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Load Data
  useEffect(() => {
    const load = (key: string, mock: any) => {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : mock;
    };
    
    // In a real app, these would be API calls with query params
    setEmployees(load('employees_data', MOCK_EMPLOYEES));
    setAttendance(load('attendance_data', MOCK_ATTENDANCE));
    setPayroll(load('payroll_data', MOCK_PAYROLL));
    setCandidates(load('recruitment_candidates', MOCK_CANDIDATES));
  }, []);

  // --- REPORT PROCESSING LOGIC ---

  const reportData = useMemo(() => {
    switch (activeCategory) {
        case 'employees':
            let filteredEmps = employees;
            if (selectedDept !== 'all') filteredEmps = filteredEmps.filter(e => e.department === selectedDept);
            
            // Stats
            const deptStats = filteredEmps.reduce((acc: any, curr) => {
                acc[curr.department] = (acc[curr.department] || 0) + 1;
                return acc;
            }, {});
            const typeStats = filteredEmps.reduce((acc: any, curr) => {
                acc[curr.contractType] = (acc[curr.contractType] || 0) + 1;
                return acc;
            }, {});

            return {
                rows: filteredEmps,
                charts: {
                    dept: Object.keys(deptStats).map(k => ({ name: k, value: deptStats[k] })),
                    type: Object.keys(typeStats).map(k => ({ name: k, value: typeStats[k] })),
                },
                summary: {
                    total: filteredEmps.length,
                    active: filteredEmps.filter(e => e.status === 'active').length,
                    salary: filteredEmps.reduce((a, b) => a + b.salary, 0)
                }
            };

        case 'attendance':
            let filteredAtt = attendance.filter(a => a.date >= dateRange.start && a.date <= dateRange.end);
            // Link to Employee for Dept filtering
            if (selectedDept !== 'all') {
                filteredAtt = filteredAtt.filter(a => {
                    const emp = employees.find(e => e.employeeCode === a.employeeCode || e.name === a.employeeName);
                    return emp?.department === selectedDept;
                });
            }

            const statusStats = filteredAtt.reduce((acc: any, curr) => {
                const s = curr.status === 'present' ? 'حضور' : curr.status === 'late' ? 'تأخير' : curr.status === 'absent' ? 'غياب' : 'أخرى';
                acc[s] = (acc[s] || 0) + 1;
                return acc;
            }, {});

            return {
                rows: filteredAtt,
                charts: {
                    status: Object.keys(statusStats).map(k => ({ name: k, value: statusStats[k] })),
                    trend: [] // Can implementation daily trend logic here
                },
                summary: {
                    total: filteredAtt.length,
                    late: filteredAtt.filter(a => a.status === 'late').length,
                    absent: filteredAtt.filter(a => a.status === 'absent').length
                }
            };

        case 'financial':
            let filteredPay = payroll; // Filtering by date is complex on payroll mock as it's monthly
            
            const salaryDist = filteredPay.map(p => ({
                name: p.employeeName,
                basic: p.basicSalary,
                net: p.netSalary,
                deductions: p.deductions
            })).sort((a,b) => b.net - a.net).slice(0, 10); // Top 10

            return {
                rows: filteredPay,
                charts: {
                    dist: salaryDist
                },
                summary: {
                    total: filteredPay.reduce((a,b) => a + b.netSalary, 0),
                    deductions: filteredPay.reduce((a,b) => a + b.deductions, 0),
                    count: filteredPay.length
                }
            };

        case 'recruitment':
            const statusMap: any = { 'APPLIED': 'جديد', 'SCREENING': 'فرز', 'INTERVIEW': 'مقابلة', 'OFFER': 'عرض', 'HIRED': 'تعيين', 'REJECTED': 'مرفوض' };
            const funnel = candidates.reduce((acc: any, curr) => {
                const label = statusMap[curr.status] || curr.status;
                acc[label] = (acc[label] || 0) + 1;
                return acc;
            }, {});

            return {
                rows: candidates,
                charts: {
                    funnel: Object.keys(funnel).map(k => ({ name: k, value: funnel[k] }))
                },
                summary: {
                    total: candidates.length,
                    hired: candidates.filter(c => c.status === ApplicationStatus.HIRED).length,
                    active: candidates.filter(c => c.status !== ApplicationStatus.HIRED && c.status !== ApplicationStatus.REJECTED).length
                }
            };

        default:
            return { rows: [], charts: {}, summary: {} };
    }
  }, [activeCategory, employees, attendance, payroll, candidates, selectedDept, dateRange]);

  const handleExport = () => {
    if (!reportData.rows.length) return alert('لا توجد بيانات للتصدير');
    
    // Quick CSV Generation
    const headers = Object.keys(reportData.rows[0]);
    const csvContent = [
        headers.join(','),
        ...reportData.rows.map(row => headers.map(h => `"${String((row as any)[h] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Report_${activeCategory}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = [
      { id: 'employees', label: 'القوى العاملة', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { id: 'attendance', label: 'الحضور والانصراف', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
      { id: 'financial', label: 'الرواتب والمالية', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
      { id: 'recruitment', label: 'التوظيف', icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">التقارير المتقدمة</h2>
        <p className="text-sm text-gray-500">منشئ التقارير وتحليل البيانات</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
          {/* Sidebar Menu */}
          <div className="w-full lg:w-64 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col shrink-0">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                  <h3 className="font-bold text-gray-700 text-sm">نوع التقرير</h3>
              </div>
              <div className="p-2 space-y-1">
                  {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeCategory === cat.id ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                          <div className={`p-1.5 rounded-md ${activeCategory === cat.id ? 'bg-white' : 'bg-gray-100'}`}>
                              <cat.icon className={`h-4 w-4 ${activeCategory === cat.id ? 'text-indigo-600' : 'text-gray-500'}`} />
                          </div>
                          {cat.label}
                          {activeCategory === cat.id && <ChevronRight className="h-4 w-4 mr-auto" />}
                      </button>
                  ))}
              </div>
          </div>

          {/* Report Builder Area */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              {/* Controls Toolbar */}
              <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/30">
                  <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                      {(activeCategory === 'attendance' || activeCategory === 'financial') && (
                          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 px-2 shadow-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <input type="date" className="text-xs border-none outline-none bg-transparent" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                              <span className="text-gray-400">-</span>
                              <input type="date" className="text-xs border-none outline-none bg-transparent" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                          </div>
                      )}
                      
                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 px-2 shadow-sm">
                          <Filter className="h-4 w-4 text-gray-400" />
                          <select className="text-xs border-none outline-none bg-transparent w-32" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                              <option value="all">جميع الأقسام</option>
                              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                      </div>
                  </div>

                  <div className="flex items-center gap-2">
                      <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                          <button onClick={() => setViewMode('chart')} className={`p-1.5 rounded-md transition-all ${viewMode === 'chart' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} title="رسم بياني"><PieIcon className="h-4 w-4" /></button>
                          <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} title="جدول البيانات"><Table className="h-4 w-4" /></button>
                      </div>
                      <button onClick={handleExport} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition shadow-sm">
                          <Download className="h-4 w-4" /> تصدير
                      </button>
                  </div>
              </div>

              {/* Visualization / Content */}
              <div className="flex-1 p-6 overflow-y-auto bg-gray-50/20">
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">الإجمالي</p>
                          <p className="text-2xl font-bold text-gray-800">{reportData.summary.total}</p>
                      </div>
                      {activeCategory === 'financial' && (
                          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                              <p className="text-xs text-gray-500 mb-1">إجمالي الرواتب</p>
                              <p className="text-2xl font-bold text-green-600">{(reportData.summary.salary || reportData.summary.total).toLocaleString()}</p>
                          </div>
                      )}
                      {activeCategory === 'attendance' && (
                          <>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">حالات التأخير</p>
                                <p className="text-2xl font-bold text-yellow-600">{reportData.summary.late}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">حالات الغياب</p>
                                <p className="text-2xl font-bold text-red-600">{reportData.summary.absent}</p>
                            </div>
                          </>
                      )}
                  </div>

                  {viewMode === 'chart' ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
                          {/* Charts based on Category */}
                          {activeCategory === 'employees' && (
                              <>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                                    <h4 className="font-bold text-gray-700 mb-4 text-sm">توزيع الموظفين حسب القسم</h4>
                                    <div className="flex-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={reportData.charts.dept} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                    {reportData.charts.dept.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                                    <h4 className="font-bold text-gray-700 mb-4 text-sm">أنواع العقود</h4>
                                    <div className="flex-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={reportData.charts.type}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" fontSize={12} />
                                                <YAxis fontSize={12} />
                                                <RechartsTooltip cursor={{fill: '#f3f4f6'}} />
                                                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                              </>
                          )}

                          {activeCategory === 'attendance' && (
                              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:col-span-2">
                                  <h4 className="font-bold text-gray-700 mb-4 text-sm">ملخص الحالات</h4>
                                  <div className="flex-1">
                                      <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={reportData.charts.status} layout="vertical">
                                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                              <XAxis type="number" fontSize={12} />
                                              <YAxis dataKey="name" type="category" fontSize={12} width={80} />
                                              <RechartsTooltip cursor={{fill: '#f3f4f6'}} />
                                              <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20}>
                                                {reportData.charts.status.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                              </Bar>
                                          </BarChart>
                                      </ResponsiveContainer>
                                  </div>
                              </div>
                          )}

                          {activeCategory === 'financial' && (
                              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:col-span-2">
                                  <h4 className="font-bold text-gray-700 mb-4 text-sm">أعلى الرواتب والخصومات</h4>
                                  <div className="flex-1">
                                      <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={reportData.charts.dist}>
                                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                              <XAxis dataKey="name" fontSize={10} />
                                              <YAxis fontSize={12} />
                                              <RechartsTooltip />
                                              <Legend />
                                              <Bar dataKey="net" name="الصافي" fill="#10b981" stackId="a" />
                                              <Bar dataKey="deductions" name="الخصومات" fill="#ef4444" stackId="a" />
                                          </BarChart>
                                      </ResponsiveContainer>
                                  </div>
                              </div>
                          )}

                          {activeCategory === 'recruitment' && (
                              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:col-span-2">
                                  <h4 className="font-bold text-gray-700 mb-4 text-sm">مراحل التوظيف (Candidate Funnel)</h4>
                                  <div className="flex-1">
                                      <ResponsiveContainer width="100%" height="100%">
                                          <AreaChart data={reportData.charts.funnel}>
                                              <CartesianGrid strokeDasharray="3 3" />
                                              <XAxis dataKey="name" />
                                              <YAxis />
                                              <RechartsTooltip />
                                              <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                                          </AreaChart>
                                      </ResponsiveContainer>
                                  </div>
                              </div>
                          )}
                      </div>
                  ) : (
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                          <div className="overflow-x-auto">
                              <table className="w-full text-right text-sm">
                                  <thead className="bg-gray-50 text-gray-600">
                                      <tr>
                                          {reportData.rows.length > 0 && Object.keys(reportData.rows[0]).slice(0, 6).map(key => (
                                              <th key={key} className="p-3 font-medium border-b">{key}</th>
                                          ))}
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                      {reportData.rows.slice(0, 50).map((row: any, idx: number) => (
                                          <tr key={idx} className="hover:bg-gray-50">
                                              {Object.keys(row).slice(0, 6).map(key => (
                                                  <td key={key} className="p-3 border-b border-gray-50">
                                                      {typeof row[key] === 'object' ? JSON.stringify(row[key]) : row[key]}
                                                  </td>
                                              ))}
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                              {reportData.rows.length === 0 && <div className="p-8 text-center text-gray-400">لا توجد بيانات للعرض</div>}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Reports;