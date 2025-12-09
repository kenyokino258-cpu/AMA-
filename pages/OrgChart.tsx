import React from 'react';
import { Users, Download } from 'lucide-react';

const OrgChart: React.FC = () => {
  // Mock structure for demo
  const structure = {
    name: 'المدير العام',
    role: 'CEO',
    image: 'https://picsum.photos/id/1005/100/100',
    children: [
      {
        name: 'مدير الموارد البشرية',
        role: 'HR Manager',
        image: 'https://picsum.photos/id/1011/100/100',
        children: [
          { name: 'أخصائي توظيف', role: 'Recruiter', image: 'https://picsum.photos/id/1027/100/100' },
          { name: 'مسؤول رواتب', role: 'Payroll', image: 'https://picsum.photos/id/1025/100/100' }
        ]
      },
      {
        name: 'مدير التقنية',
        role: 'CTO',
        image: 'https://picsum.photos/id/1012/100/100',
        children: [
          { 
             name: 'قائد فريق التطوير', 
             role: 'Team Lead', 
             image: 'https://picsum.photos/id/1005/100/100',
             children: [
                { name: 'مهندس واجهات', role: 'Frontend', image: 'https://picsum.photos/id/1025/100/100' },
                { name: 'مهندس خلفيات', role: 'Backend', image: 'https://picsum.photos/id/1011/100/100' }
             ]
          }
        ]
      },
      {
        name: 'مدير المبيعات',
        role: 'Sales Manager',
        image: 'https://picsum.photos/id/1001/100/100',
        children: [
           { name: 'مندوب مبيعات', role: 'Sales Rep', image: 'https://picsum.photos/id/1014/100/100' },
           { name: 'مندوب مبيعات', role: 'Sales Rep', image: 'https://picsum.photos/id/1013/100/100' }
        ]
      }
    ]
  };

  const renderNode = (node: any) => (
    <div className="flex flex-col items-center">
      <div className="relative flex flex-col items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all w-48 z-10 cursor-pointer group">
        <img 
           src={node.image} 
           alt={node.name} 
           className="w-12 h-12 rounded-full object-cover border-2 border-indigo-50 mb-2 group-hover:border-indigo-500 transition-colors"
        />
        <h4 className="font-bold text-gray-800 text-sm text-center">{node.name}</h4>
        <p className="text-xs text-indigo-600 font-medium">{node.role}</p>
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center">
          {/* Connecting Line Vertical */}
          <div className="h-8 w-px bg-gray-300"></div>
          
          <div className="flex gap-8 relative">
             {/* Horizontal Connector Line logic */}
             {node.children.length > 1 && (
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-12rem)] h-px bg-gray-300 hidden md:block"></div>
             )}
             
             {node.children.map((child: any, index: number) => (
               <div key={index} className="flex flex-col items-center relative">
                  {/* Horizontal Connector for small nodes */}
                  {index > 0 && index < node.children.length - 1 && <div className="absolute top-0 w-full h-px bg-gray-300 md:hidden"></div>}
                  
                  {/* Top Vertical Connector */}
                  <div className="h-4 w-px bg-gray-300"></div>
                  {renderNode(child)}
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">الهيكل التنظيمي</h2>
           <p className="text-sm text-gray-500 mt-1">عرض التسلسل الإداري للشركة وتوزيع الموظفين</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2">
           <Download className="h-4 w-4" />
           <span>تصدير صورة</span>
        </button>
      </div>

      <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-8 overflow-x-auto min-h-[600px] flex justify-center items-start">
         <div className="min-w-fit pt-8">
            {renderNode(structure)}
         </div>
      </div>
    </div>
  );
};

export default OrgChart;