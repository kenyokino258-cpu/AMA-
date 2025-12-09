
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  FileText, 
  ShieldCheck, 
  Clock, 
  CalendarOff, 
  DollarSign, 
  BarChart3, 
  Settings,
  LayoutDashboard,
  Wallet,
  GitFork,
  Truck
} from 'lucide-react';
import { MenuItem } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  userPermissions?: string[]; // permissions passed from App.tsx
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, userPermissions }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('نـظـام HR');

  // Load company settings
  useEffect(() => {
    const savedCompany = localStorage.getItem('company_settings');
    if (savedCompany) {
      const parsed = JSON.parse(savedCompany);
      if (parsed.logo) setCompanyLogo(parsed.logo);
      if (parsed.name) setCompanyName(parsed.name);
    }
  }, []);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, path: '/' },
    { id: 'employees', label: 'الموظفين', icon: Users, path: '/employees' },
    { id: 'org-chart', label: 'الهيكل التنظيمي', icon: GitFork, path: '/org-chart' },
    { id: 'recruitment', label: 'التوظيف', icon: Briefcase, path: '/recruitment' },
    { id: 'transport', label: 'إدارة النقل', icon: Truck, path: '/transport' },
    { id: 'contracts', label: 'العقود', icon: FileText, path: '/contracts' },
    { id: 'insurance', label: 'التأمينات', icon: ShieldCheck, path: '/insurance' },
    { id: 'attendance', label: 'الحضور والانصراف', icon: Clock, path: '/attendance' },
    { id: 'leaves', label: 'الإجازات', icon: CalendarOff, path: '/leaves' },
    { id: 'payroll', label: 'الرواتب', icon: DollarSign, path: '/payroll' },
    { id: 'loans', label: 'السلف والخصومات', icon: Wallet, path: '/loans' },
    { id: 'reports', label: 'التقارير', icon: BarChart3, path: '/reports' },
    { id: 'settings', label: 'الإعدادات', icon: Settings, path: '/settings' },
  ];

  // Filter items based on permissions
  const filteredMenuItems = menuItems.filter(item => {
    // Always show dashboard or if permissions are not defined (e.g. admin or initial load)
    if (!userPermissions || userPermissions.length === 0) return true;
    return userPermissions.includes(item.id);
  });

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 right-0 z-30 h-full w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex h-20 items-center justify-center border-b border-gray-100">
          <div className="flex items-center gap-3 px-4">
            {companyLogo ? (
               <img src={companyLogo} alt="Logo" className="h-10 w-10 object-contain" />
            ) : (
               <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6 text-white" />
               </div>
            )}
            <h1 className="text-lg font-bold text-gray-800 truncate max-w-[120px]" title={companyName}>{companyName}</h1>
          </div>
        </div>

        <nav className="mt-6 px-4 pb-20 overflow-y-auto h-[calc(100vh-5rem)]">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.path);

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
