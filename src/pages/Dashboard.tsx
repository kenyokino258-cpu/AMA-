
import React, { useContext, useEffect, useState } from 'react';
import { Users, UserCheck, AlertCircle, Clock, Calendar, TrendingUp, Wallet, CheckCircle, XCircle, Briefcase, CalendarOff } from 'lucide-react';
import StatCard from '../components/StatCard';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { AppContext } from '../App';
import { UserRole, Employee, AttendanceRecord, PayrollRecord, LeaveRequest, LeaveBalance } from '../types';
import { MOCK_EMPLOYEES, MOCK_ATTENDANCE, MOCK_PAYROLL, MOCK_LEAVES, MOCK_LEAVE_BALANCES } from '../constants';

const Dashboard: React.FC = () => {
  const { currentUser } = useContext(AppContext);
  
  // Real Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);

  // Statistics State
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    totalPayroll: 0,
    pendingLeaves: 0,
    contractsExpiring: 0
  });

  const [deptData, setDeptData] = useState<any[]>([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState<any[]>([]);

  useEffect(() => {
    // 1. Load Data from LocalStorage (Simulating Database Fetch)
    const activeDb = localStorage.getItem('active_db_id');
    const isDefaultDb = !activeDb || activeDb === 'DB1';

    const loadData = (key: string, mock: any) => {
        const saved = localStorage.getItem(key);
        if (saved) return JSON.parse(saved);
        return isDefaultDb ? mock : [];
    };

    const loadedEmps = loadData('employees_data', MOCK_EMPLOYEES);
    const loadedAtt = loadData('attendance_data', MOCK_ATTENDANCE);
    const loadedPay = loadData('payroll_data', MOCK_PAYROLL);
    const loadedLeaves = loadData('leaves_data', MOCK_LEAVES);
    const loadedBalances = loadData('leaves_balances', MOCK_LEAVE_BALANCES);

    setEmployees(loadedEmps);
    setAttendance(loadedAtt);
    setPayroll(loadedPay);
    setLeaves(loadedLeaves);
    setBalances(loadedBalances);

    // 2. Calculate Stats
    const today = new Date().toISOString().split('T')[0];
    
    // Attendance Stats
    const todayAttendance = loadedAtt.filter((a: AttendanceRecord) => a.date === today);
    const presentCount = todayAttendance.filter((a: AttendanceRecord) => a.status === 'present' || a.status === 'late').length;
    const lateCount = todayAttendance.filter((a: AttendanceRecord) => a.status === 'late').length;

    // Payroll Stats
    const totalSalaries = loadedPay.reduce((acc: number, curr: PayrollRecord) => acc + curr.netSalary, 0);

    // Pending Leaves
    const pending = loadedLeaves.filter((l: LeaveRequest) => l.status === 'pending').length;

    setStats({
        totalEmployees: loadedEmps.length,
        presentToday: presentCount,
        lateToday: lateCount,
        totalPayroll: totalSalaries,
        pendingLeaves: pending,
        contractsExpiring: loadedEmps.filter((e: Employee) => e.contractType === 'عقد محدد').length // Simplified
    });

    // 3. Prepare Charts Data
    // Department Distribution
    const departments: Record<string, number> = {};
    loadedEmps.forEach((e: Employee) => {
        departments[e.department] = (departments[e.department] || 0) + 1;
    });
    const pieData = Object.keys(departments).map((dept, idx) => ({
        name: dept,
        value: departments[dept],
        color: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]
    }));
    setDeptData(pieData);

    // Weekly Attendance (Mock logic for graph visualization)
    setWeeklyAttendance([
        { name: 'السبت', hours: 40 },
        { name: 'الأحد', hours: 150 },
        { name: 'الاثنين', hours: 160 },
        { name: 'الثلاثاء', hours: 155 },
        { name: 'الأربعاء', hours: 140 },
        { name: 'الخميس', hours: 130 },
    ]);

  }, []);

  // --- EMPLOYEE VIEW (Self-Service) ---
  if (currentUser?.role === UserRole.EMPLOYEE) {
      const myEmployee = employees.find(e => e.name === currentUser.fullName || e.id === currentUser.linkedEmployeeId);
      const myBalance = balances.find(b => b.employeeName === currentUser.fullName);
      const myAttendance = attendance.filter(a => a.employeeName === currentUser.fullName).sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5);
      const today = new Date().toISOString().split('T')[0];
      const todaysRecord = attendance.find(a => a.employeeName === currentUser.fullName && a.date === today);

      return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">مرحباً، {currentUser.fullName}</h2>
                    <p className="text-sm text-gray-500">بوابة الخدمة الذاتية</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">رصيد الإجازات السنوي</p>
                        <h3 className="text-3xl font-bold text-indigo-600">{myBalance ? (myBalance.annualTotal - myBalance.annualUsed) : 0} يوم</h3>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-full"><CalendarOff className="h-6 w-6 text-indigo-600" /></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">حالة اليوم</p>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${todaysRecord ? 'text-green-600' : 'text-gray-400'}`}>
                            {todaysRecord ? (
                                <><CheckCircle className="h-5 w-5" /> تم الحضور</>
                            ) : (
                                <><XCircle className="h-5 w-5" /> لم يسجل بعد</>
                            )}
                        </h3>
                        {todaysRecord && <p className="text-xs text-gray-400 mt-1">دخول: {todaysRecord.checkIn}</p>}
                    </div>
                    <div className={`p-3 rounded-full ${todaysRecord ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}><Clock className="h-6 w-6" /></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">الوردية الحالية</p>
                        <h3 className="text-xl font-bold text-gray-800">{myEmployee?.shiftName || 'غير محدد'}</h3>
                        <p className="text-xs text-gray-400 mt-1">راجع الجدول</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-full"><Briefcase className="h-6 w-6 text-yellow-600" /></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">آخر حركات الحضور</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr><th className="p-3">التاريخ</th><th className="p-3">دخول</th><th className="p-3">خروج</th><th className="p-3">ساعات العمل</th><th className="p-3">الحالة</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {myAttendance.length > 0 ? myAttendance.map(a => (
                                <tr key={a.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-mono">{a.date}</td>
                                    <td className="p-3 font-mono">{a.checkIn}</td>
                                    <td className="p-3 font-mono">{a.checkOut}</td>
                                    <td className="p-3 font-bold text-gray-700">{a.workHours}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs border ${
                                            a.status === 'present' ? 'bg-green-50 text-green-700 border-green-100' :
                                            a.status === 'late' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                            'bg-red-50 text-red-700 border-red-100'
                                        }`}>
                                            {a.status === 'present' ? 'حضور' : a.status === 'late' ? 'تأخير' : 'غياب'}
                                        </span>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={5} className="p-8 text-center text-gray-400">لا يوجد سجلات حديثة</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
  }

  // --- ADMIN / HR VIEW ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">لوحة التحكم</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="إجمالي الموظفين" 
          value={stats.totalEmployees} 
          icon={<Users className="h-6 w-6" />} 
          color="indigo" 
          trend="نشط"
        />
        <StatCard 
          title="حضور اليوم" 
          value={stats.presentToday} 
          icon={<UserCheck className="h-6 w-6" />} 
          color="green" 
          trend={`${Math.round((stats.presentToday / (stats.totalEmployees || 1)) * 100)}% نسبة الحضور`}
        />
        <StatCard 
          title="تأخير" 
          value={stats.lateToday} 
          icon={<Clock className="h-6 w-6" />} 
          color="yellow" 
        />
        <StatCard 
          title="إجمالي الرواتب" 
          value={`${(stats.totalPayroll / 1000).toFixed(1)}k`} 
          icon={<Wallet className="h-6 w-6" />} 
          color="red" 
          trend="الشهر الحالي"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance Bar Chart */}
        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="mb-4 text-lg font-bold text-gray-800">إحصائيات ساعات العمل الأسبوعية</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAttendance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Pie Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="mb-4 text-lg font-bold text-gray-800">توزيع الموظفين حسب القسم</h3>
          <div className="h-48 w-full">
            {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات</div>
            )}
          </div>
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
             {deptData.map(dept => (
                <div key={dept.name} className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: dept.color}}></div>
                      <span className="text-gray-600 truncate max-w-[150px]">{dept.name}</span>
                   </div>
                   <span className="font-bold text-gray-800">{dept.value}</span>
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Notifications / Quick Alerts */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h3 className="mb-4 text-lg font-bold text-gray-800">تنبيهات النظام</h3>
        <div className="space-y-4">
            {stats.pendingLeaves > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-yellow-800">طلبات إجازة معلقة</p>
                        <p className="text-xs text-yellow-700 mt-1">يوجد {stats.pendingLeaves} طلبات إجازة بانتظار الموافقة.</p>
                    </div>
                </div>
            )}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <Users className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-indigo-800">تحديث النظام</p>
                    <p className="text-xs text-indigo-600 mt-1">النظام يعمل بشكل صحيح. تم التحديث: {new Date().toLocaleTimeString('ar-EG')}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
