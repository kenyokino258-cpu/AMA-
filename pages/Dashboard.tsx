import React from 'react';
import { Users, UserCheck, AlertCircle, Clock, Calendar, TrendingUp, Wallet } from 'lucide-react';
import StatCard from '../components/StatCard';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';

const weeklyData = [
  { name: 'السبت', hours: 40 },
  { name: 'الأحد', hours: 150 },
  { name: 'الاثنين', hours: 160 },
  { name: 'الثلاثاء', hours: 155 },
  { name: 'الأربعاء', hours: 140 },
  { name: 'الخميس', hours: 130 },
];

const payrollTrendData = [
  { month: 'يناير', amount: 145000 },
  { month: 'فبراير', amount: 148000 },
  { month: 'مارس', amount: 152000 },
  { month: 'أبريل', amount: 150000 },
  { month: 'مايو', amount: 160000 },
  { month: 'يونيو', amount: 165000 },
];

const deptData = [
  { name: 'تكنولوجيا المعلومات', value: 12, color: '#4f46e5' },
  { name: 'الموارد البشرية', value: 5, color: '#10b981' },
  { name: 'المبيعات', value: 15, color: '#f59e0b' },
  { name: 'المالية', value: 8, color: '#ef4444' },
];

const Dashboard: React.FC = () => {
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
          value="48" 
          icon={<Users className="h-6 w-6" />} 
          color="indigo" 
          trend="+2 هذا الشهر"
        />
        <StatCard 
          title="حضور اليوم" 
          value="42" 
          icon={<UserCheck className="h-6 w-6" />} 
          color="green" 
          trend="87.5% نسبة الحضور"
        />
        <StatCard 
          title="تأخير" 
          value="3" 
          icon={<Clock className="h-6 w-6" />} 
          color="yellow" 
        />
        <StatCard 
          title="إجمالي الرواتب" 
          value="165k" 
          icon={<Wallet className="h-6 w-6" />} 
          color="red" 
          trend="آخر شهر"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance Bar Chart */}
        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="mb-4 text-lg font-bold text-gray-800">إحصائيات ساعات العمل الأسبوعية</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
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
          </div>
          <div className="mt-4 space-y-2">
             {deptData.map(dept => (
                <div key={dept.name} className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: dept.color}}></div>
                      <span className="text-gray-600">{dept.name}</span>
                   </div>
                   <span className="font-bold text-gray-800">{dept.value}</span>
                </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
         {/* Payroll Trend Area Chart */}
         <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-bold text-gray-800">تطور الرواتب (آخر 6 أشهر)</h3>
               <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={payrollTrendData}>
                     <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                     <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                     <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                     <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Notifications / Quick Alerts */}
         <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="mb-4 text-lg font-bold text-gray-800">تنبيهات النظام</h3>
            <div className="space-y-4">
               <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                     <p className="text-sm font-bold text-red-800">عقود تنتهي قريباً</p>
                     <p className="text-xs text-red-600 mt-1">يوجد 3 عقود تنتهي خلال أقل من شهر.</p>
                  </div>
               </div>
               <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                     <p className="text-sm font-bold text-yellow-800">طلبات إجازة معلقة</p>
                     <p className="text-xs text-yellow-700 mt-1">يوجد 5 طلبات إجازة بانتظار الموافقة.</p>
                  </div>
               </div>
               <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                  <Users className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div>
                     <p className="text-sm font-bold text-indigo-800">مقابلات اليوم</p>
                     <p className="text-xs text-indigo-600 mt-1">لديك مقابلتين للمرشحين لوظيفة "مسوق".</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;