
import React from 'react';
import { FileBarChart, Users, Clock, DollarSign, PieChart, Briefcase, Download, ArrowLeft, FileSpreadsheet } from 'lucide-react';

const Reports: React.FC = () => {
  // Helper to load data
  const loadData = (key: string) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  };

  const generateCSV = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
      alert('لا توجد بيانات متاحة لتصدير هذا التقرير.');
      return;
    }
    
    // Get headers
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const val = row[header] ? String(row[header]).replace(/"/g, '""') : '';
          return `"${val}"`;
        }).join(',')
      )
    ];
    
    const csvString = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadReport = (reportId: number) => {
    switch (reportId) {
      case 1: // Attendance
        const attendance = loadData('attendance_data');
        generateCSV(attendance, 'Attendance_Report');
        break;
      case 2: // Payroll
        const payroll = loadData('payroll_data');
        generateCSV(payroll, 'Payroll_Report');
        break;
      case 3: // Employees
        const employees = loadData('employees_data');
        generateCSV(employees, 'Employees_Master_List');
        break;
      case 4: // Recruitment
        const candidates = loadData('recruitment_candidates');
        generateCSV(candidates, 'Recruitment_Report');
        break;
      case 5: // Leaves
        const leaves = loadData('leaves_data');
        generateCSV(leaves, 'Leaves_Report');
        break;
      case 6: // Contracts (Simulating "End of Service" by filtering expiring contracts)
        const allEmps = loadData('employees_data');
        // Filter mock logic for end of service (if they have an end date)
        const endOfService = allEmps.filter((e: any) => e.endOfServiceDate).map((e: any) => ({
            Name: e.name,
            JoinDate: e.joinDate,
            EndOfService: e.endOfServiceDate,
            Status: e.status
        }));
        generateCSV(endOfService, 'End_Of_Service_Report');
        break;
      default:
        alert('التقرير قيد التطوير');
    }
  };

  const reports = [
    { id: 1, title: 'تقرير الحضور والغياب', desc: 'تفاصيل الحضور، التأخير، والغياب الشهري (بيانات فعلية)', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 2, title: 'كشف الرواتب الشهري', desc: 'ملخص الرواتب، البدلات، والخصومات (بيانات فعلية)', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 3, title: 'تقرير بيانات الموظفين', desc: 'قائمة شاملة ببيانات الموظفين وتواريخ التعيين', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 4, title: 'حركة التوظيف', desc: 'إحصائيات المتقدمين، المقابلات، والتعيينات', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 5, title: 'رصيد الإجازات والطلبات', desc: 'سجل طلبات الإجازات وحالاتها', icon: PieChart, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 6, title: 'نهاية الخدمة', desc: 'تقرير الموظفين وتواريخ نهاية الخدمة', icon: FileBarChart, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">التقارير والإحصائيات</h2>
        <p className="text-sm text-gray-500 mt-1">استخراج تقارير تفصيلية عن أداء المنشأة والموظفين (Excel / CSV)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div 
            key={report.id} 
            onClick={() => handleDownloadReport(report.id)}
            className="group relative bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
               <div className={`w-14 h-14 ${report.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                 <report.icon className={`h-7 w-7 ${report.color}`} />
               </div>
               <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                 <div className="bg-gray-50 p-2 rounded-full">
                    <Download className="h-5 w-5 text-gray-600" />
                 </div>
               </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-indigo-700 transition-colors">{report.title}</h3>
            <p className="text-sm text-gray-500 mb-6 min-h-[40px] leading-relaxed">{report.desc}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
               <span className="text-xs font-medium text-gray-400 group-hover:text-indigo-500 transition-colors flex items-center gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  Excel / CSV
               </span>
               <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium opacity-80 group-hover:opacity-100">
                  <span>تحميل</span>
                  <ArrowLeft className="h-4 w-4" />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
