
import React, { useState, useEffect } from 'react';
import { Download, Users, ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react';
import { MOCK_EMPLOYEES } from '../constants';
import { Employee } from '../types';

interface TreeNode {
  employee: Employee;
  children: TreeNode[];
}

const OrgChart: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  // 1. Load Employees
  useEffect(() => {
    const saved = localStorage.getItem('employees_data');
    if (saved) {
        setEmployees(JSON.parse(saved));
    } else {
        setEmployees(MOCK_EMPLOYEES);
    }
  }, []);

  // 2. Build Tree Hierarchy
  useEffect(() => {
    if (employees.length === 0) return;

    const buildTree = (): TreeNode[] => {
        const nodes: Record<string, TreeNode> = {};
        const roots: TreeNode[] = [];

        // Create a node for each employee
        employees.forEach(emp => {
            nodes[emp.id] = { employee: emp, children: [] };
        });

        // Link nodes
        employees.forEach(emp => {
            if (emp.managerId && nodes[emp.managerId]) {
                // If has manager, add to manager's children
                nodes[emp.managerId].children.push(nodes[emp.id]);
            } else {
                // If no manager (or manager not found), it's a root
                roots.push(nodes[emp.id]);
            }
        });

        return roots;
    };

    setTreeData(buildTree());
  }, [employees]);

  // Render a single tree node recursively
  const renderNode = (node: TreeNode) => (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div className="relative flex flex-col items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all w-52 z-10 cursor-pointer group">
        <div className="relative">
            <img 
            src={node.employee.avatar} 
            alt={node.employee.name} 
            className="w-14 h-14 rounded-full object-cover border-4 border-indigo-50 mb-2 group-hover:border-indigo-100 transition-colors"
            />
            {/* Active Status Dot */}
            <div className={`absolute bottom-2 right-0 w-3 h-3 rounded-full border-2 border-white ${node.employee.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        </div>
        <h4 className="font-bold text-gray-800 text-sm text-center truncate w-full" title={node.employee.name}>{node.employee.name}</h4>
        <p className="text-xs text-indigo-600 font-medium truncate w-full text-center">{node.employee.jobTitle}</p>
        <p className="text-[10px] text-gray-400 mt-1">{node.employee.department}</p>
      </div>
      
      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
          {/* Vertical Line Down */}
          <div className="h-8 w-px bg-gray-300"></div>
          
          <div className="flex gap-8 relative">
             {/* Horizontal Connector Line */}
             {node.children.length > 1 && (
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-13rem)] h-px bg-gray-300 hidden md:block"></div>
             )}
             
             {node.children.map((child: TreeNode, index: number) => (
               <div key={child.employee.id} className="flex flex-col items-center relative">
                  {/* Small screen connector fallback */}
                  {index > 0 && index < node.children.length - 1 && <div className="absolute top-0 w-full h-px bg-gray-300 md:hidden"></div>}
                  
                  {/* Vertical Line to Child */}
                  <div className="h-6 w-px bg-gray-300"></div>
                  {renderNode(child)}
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">الهيكل التنظيمي</h2>
           <p className="text-sm text-gray-500 mt-1">
               يتم بناء الهيكل تلقائياً بناءً على "المدير المباشر" في ملف الموظف.
           </p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ZoomOut className="h-5 w-5" /></button>
            <button onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ZoomIn className="h-5 w-5" /></button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2 shadow-sm">
                <Download className="h-4 w-4" />
                <span>تصدير صورة</span>
            </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-50/50 border border-gray-200 rounded-xl p-8 overflow-auto flex justify-center items-start shadow-inner relative">
         {/* Background Grid Pattern */}
         <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

         <div 
            className="min-w-fit pt-8 transition-transform duration-200 origin-top"
            style={{ transform: `scale(${zoomLevel})` }}
         >
            {treeData.length > 0 ? (
                <div className="flex gap-16">
                    {treeData.map(root => (
                        <div key={root.employee.id} className="flex flex-col items-center">
                            {/* If multiple roots, label them */}
                            {treeData.length > 1 && <span className="mb-4 text-xs font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded">مسار مستقل</span>}
                            {renderNode(root)}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Users className="h-12 w-12 mb-4 opacity-50" />
                    <p>لا يوجد موظفين لعرض الهيكل التنظيمي.</p>
                </div>
            )}
         </div>
      </div>
      
      {treeData.length > 1 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm text-sm text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>ملاحظة: يوجد أكثر من رأس للهرم الوظيفي ({treeData.length}). تأكد من تعيين "المدير المباشر" لجميع الموظفين لربطهم في شجرة واحدة.</span>
          </div>
      )}
    </div>
  );
};

export default OrgChart;
