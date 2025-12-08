
import React, { useState, useEffect, useContext } from 'react';
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
  Truck,
  CalendarClock,
  Lock,
  Palette,
  TrendingUp 
} from 'lucide-react';
import { MenuItem, UserRole } from '../types';
import { AppContext } from '../App';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  userPermissions?: string[]; 
  userRole?: string;
  isExpired?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, userPermissions, userRole, isExpired }) => {
  const { t, themeColor, language } = useContext(AppContext);
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
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, path: '/' },
    { id: 'employees', label: t('employees'), icon: Users, path: '/employees' },
    { id: 'org-chart', label: t('orgChart'), icon: GitFork, path: '/org-chart' },
    { id: 'shifts', label: t('shifts'), icon: CalendarClock, path: '/shifts' },
    { id: 'recruitment', label: t('recruitment'), icon: Briefcase, path: '/recruitment' },
    { id: 'transport', label: t('transport'), icon: Truck, path: '/transport' },
    { id: 'performance', label: t('performance'), icon: TrendingUp, path: '/performance' }, 
    { id: 'contracts', label: t('contracts'), icon: FileText, path: '/contracts' },
    { id: 'insurance', label: t('insurance'), icon: ShieldCheck, path: '/insurance' },
    { id: 'attendance', label: t('attendance'), icon: Clock, path: '/attendance' },
    { id: 'leaves', label: t('leaves'), icon: CalendarOff, path: '/leaves' },
    { id: 'payroll', label: t('payroll'), icon: DollarSign, path: '/payroll' },
    { id: 'loans', label: t('loans'), icon: Wallet, path: '/loans' },
    { id: 'reports', label: t('reports'), icon: BarChart3, path: '/reports' },
    { id: 'appearance', label: t('appearance'), icon: Palette, path: '/appearance' },
    { id: 'settings', label: t('settings'), icon: Settings, path: '/settings' },
  ];

  // Permission Logic
  const filteredMenuItems = menuItems.filter(item => {
    if (isExpired) return item.id === 'settings';
    
    // Employee View: Only show specific items
    if (userRole === UserRole.EMPLOYEE) {
        return ['dashboard', 'attendance', 'leaves', 'loans', 'performance', 'reports'].includes(item.id);
    }

    if (!userRole || userRole === UserRole.ADMIN) return true;
    if (userPermissions && userPermissions.length > 0) return userPermissions.includes(item.id);
    return false;
  });

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  // Determine Sidebar Position Class based on Language
  const isRtl = language === 'ar';
  const positionClass = isRtl ? 'right-0' : 'left-0';
  
  // Transform logic
  const transformClass = isOpen 
    ? 'translate-x-0' 
    : (isRtl ? 'translate-x-full' : '-translate-x-full');

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
        fixed top-0 ${positionClass} z-30 h-full w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen
        ${transformClass}
      `}>
        <div className="flex h-20 items-center justify-center border-b border-gray-100 relative overflow-hidden">
          {isExpired && (
             <div className="absolute inset-0 bg-gray-100/80 z-10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-gray-400" />
             </div>
          )}
          <div className="flex items-center gap-3 px-4">
            {companyLogo ? (
               <img src={companyLogo} alt="Logo" className="h-10 w-10 object-contain" />
            ) : (
               <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-indigo-600`}>
                  <Users className="h-6 w-6 text-white" />
               </div>
            )}
            <h1 className="text-lg font-bold text-gray-800 truncate max-w-[120px]" title={companyName}>{companyName}</h1>
          </div>
        </div>

        <nav className="mt-6 px-4 pb-20 overflow-y-auto h-[calc(100vh-5rem)] custom-scrollbar">
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
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                    style={isActive ? {
                        borderRight: isRtl ? '4px solid var(--primary-color)' : 'none',
                        borderLeft: !isRtl ? '4px solid var(--primary-color)' : 'none',
                        color: 'var(--primary-color)',
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')}10` // 10% opacity
                    } : {}}
                  >
                    <item.icon className="h-5 w-5" style={isActive ? { color: 'var(--primary-color)' } : {}} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
          
          {isExpired && (
             <div className="mt-8 p-4 bg-red-50 rounded-lg text-center border border-red-100">
                <p className="text-xs font-bold text-red-800 mb-1">الترخيص منتهي</p>
                <p className="text-[10px] text-red-600">يرجى الاتصال بالمسؤول لتفعيل النظام.</p>
             </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
