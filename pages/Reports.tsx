import React from 'react';
import { FileBarChart, Users, Clock, DollarSign, PieChart, Briefcase, Download, ArrowLeft } from 'lucide-react';

const Reports: React.FC = () => {
  const reports = [
    { id: 1, title: 'تقرير الحضور والغياب', desc: 'تفاصيل الحضور، التأخير، والغياب الشهري', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 2, title: 'كشف الرواتب الشهري', desc: 'ملخص الرواتب، البدلات، والخصومات', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 3, title: 'تقرير بيانات الموظفين', desc: 'قائمة شاملة ببيانات الموظفين وتواريخ التعيين', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 4, title: 'حركة التوظيف', desc: 'إحصائيات المتقدمين، المقابلات، والتعيينات', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 5, title: 'رصيد الإجازات', desc: 'أرصدة الإجازات السنوية والمرضية المتبقية', icon: PieChart, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 6, title: 'نهاية الخدمة', desc: 'تقرير الموظفين المنتهية عقودهم والمستحقات', icon: FileBarChart, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">التقارير والإحصائيات</h2>
        <p className="text-sm text-gray-500 mt-1">استخراج تقارير تفصيلية عن أداء المنشأة والموظفين</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="group relative bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <div className="flex justify-between items-start mb-4">
               <div className={`w-14 h-14 ${report.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                 <report.icon className={`h-7 w-7 ${report.color}`} />
               </div>
               <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                 <div className="bg-gray-50 p-2 rounded-full">
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                 </div>
               </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-indigo-700 transition-colors">{report.title}</h3>
            <p className="text-sm text-gray-500 mb-6 min-h-[40px] leading-relaxed">{report.desc}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
               <span className="text-xs font-medium text-gray-400 group-hover:text-indigo-500 transition-colors">PDF, Excel</span>
               <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium opacity-80 group-hover:opacity-100">
                  <span>تحميل</span>
                  <Download className="h-4 w-4" />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;