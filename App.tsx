
import React, { useState, useEffect, useContext, createContext, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, UserCircle, X, LogOut, Lock, Wifi, WifiOff, Loader } from 'lucide-react';
import { SystemUser, UserRole, Notification, AppContextType, Language, ThemeColor } from './types';
import { getDeviceId, validateLicenseKey } from './utils/security';
import { api } from './services/api';
import { translations } from './translations';

// --- Lazy Load Components to fix Circular Dependencies ---
const Sidebar = React.lazy(() => import('./components/Sidebar'));
const TrialBanner = React.lazy(() => import('./components/TrialBanner'));
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Employees = React.lazy(() => import('./pages/Employees'));
const EmployeeDetails = React.lazy(() => import('./pages/EmployeeDetails'));
const Recruitment = React.lazy(() => import('./pages/Recruitment'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const Contracts = React.lazy(() => import('./pages/Contracts'));
const Insurance = React.lazy(() => import('./pages/Insurance'));
const Leaves = React.lazy(() => import('./pages/Leaves'));
const Payroll = React.lazy(() => import('./pages/Payroll'));
const Loans = React.lazy(() => import('./pages/Loans'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Appearance = React.lazy(() => import('./pages/Appearance'));
const OrgChart = React.lazy(() => import('./pages/OrgChart'));
const Transport = React.lazy(() => import('./pages/Transport'));
const Performance = React.lazy(() => import('./pages/Performance'));
const AdminKeyGenerator = React.lazy(() => import('./pages/AdminKeyGenerator'));
const Shifts = React.lazy(() => import('./pages/Shifts'));

// --- Default Context Values ---
export const AppContext = createContext<AppContextType>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
  showNotifications: false,
  setShowNotifications: () => {},
  isPaidVersion: false,
  isExpired: false,
  trialDaysLeft: 0,
  notifications: [],
  addNotification: () => {},
  handleLogout: () => {},
  currentUser: null,
  isServerOnline: false,
  language: 'ar',
  setLanguage: () => {},
  themeColor: 'indigo',
  setThemeColor: () => {},
  themeMode: 'light',
  setThemeMode: () => {},
  t: (key) => key,
});

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900" dir="rtl">
    <div className="flex flex-col items-center gap-4">
      <Loader className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
      <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">جاري تحميل النظام...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, isExpired }: { children: React.ReactNode, isExpired: boolean }) => {
  const location = useLocation();
  if (isExpired && location.pathname !== '/settings' && location.pathname !== '/license-manager') {
    return <Navigate to="/settings" replace />;
  }
  return <>{children}</>;
};

const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const {
    sidebarOpen,
    setSidebarOpen,
    showNotifications,
    setShowNotifications,
    isPaidVersion,
    isExpired,
    trialDaysLeft,
    notifications,
    handleLogout,
    currentUser,
    isServerOnline,
    t,
    themeColor
  } = useContext(AppContext);

  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleProfileClick = () => {
      setProfileOpen(false);
      if (currentUser?.linkedEmployeeId) {
          navigate(`/employees/${currentUser.linkedEmployeeId}`);
      } else {
          if (currentUser?.role === UserRole.ADMIN) {
              navigate('/settings');
          } else {
              alert('هذا المستخدم غير مرتبط بملف موظف.');
          }
      }
  };

  const handleNotificationClick = (notif: Notification) => {
      setShowNotifications(false);
      navigate('/'); 
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-900 flex-col transition-colors duration-300 main-app-container">
      {!isPaidVersion && !isExpired && (
        <Suspense fallback={null}><TrialBanner daysLeft={trialDaysLeft} /></Suspense>
      )}
      
      {isExpired && (
        <div className="bg-red-600 text-white px-4 py-3 text-center font-bold shadow-md z-50 flex items-center justify-center gap-2">
           <Lock className="h-5 w-5" />
           <span>{t('subscription')} منتهي.</span>
        </div>
      )}

      <div className="flex flex-1 relative">
        <div className="no-print z-30">
          <Suspense fallback={<div className="w-64 bg-white dark:bg-gray-800 h-full border-r dark:border-gray-700" />}>
            <Sidebar 
                isOpen={sidebarOpen} 
                setIsOpen={setSidebarOpen} 
                userPermissions={currentUser?.permissions} 
                userRole={currentUser?.role}
                isExpired={isExpired} 
            />
          </Suspense>
        </div>
        <main className="flex-1 overflow-x-hidden relative w-full dark:bg-gray-900">
          <header className="sticky top-0 z-20 flex h-20 w-full items-center justify-between bg-white dark:bg-gray-800 px-6 shadow-sm border-b dark:border-gray-700 no-print transition-colors">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"><Menu className="h-6 w-6" /></button>
              <div className="hidden md:block relative w-96">
                <Search className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input type="text" placeholder={t('search')} className={`w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 py-2 pr-4 pl-10 rtl:pr-10 rtl:pl-4 text-sm text-gray-800 dark:text-gray-200 focus:border-${themeColor}-600 dark:focus:border-${themeColor}-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600`} />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${isServerOnline ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
                 {isServerOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                 <span className="text-xs font-bold hidden sm:inline">{isServerOnline ? t('online') : t('offline')}</span>
              </div>

              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

              <div className="relative">
                <button onClick={() => { setShowNotifications(!showNotifications); setProfileOpen(false); }} className="relative rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Bell className="h-6 w-6" />
                  {notifications.filter(n => n.unread).length > 0 && (
                    <span className="absolute top-2 left-2 rtl:left-auto rtl:right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-gray-800"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute left-0 rtl:left-0 rtl:right-auto mt-3 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                    <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100">الإشعارات ({notifications.length})</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? notifications.map(notif => (
                        <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-4 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${notif.unread ? `bg-${themeColor}-50 dark:bg-${themeColor}-900/10` : ''}`}>
                          <div className="flex justify-between items-start mb-1"><span className={`font-bold text-sm ${notif.unread ? `text-${themeColor}-600 dark:text-${themeColor}-400` : 'text-gray-700 dark:text-gray-300'}`}>{notif.title}</span><span className="text-[10px] text-gray-400">{notif.time}</span></div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{notif.desc}</p>
                        </div>
                      )) : <div className="p-8 text-center text-gray-400 text-sm">لا توجد إشعارات جديدة</div>}
                    </div>
                  </div>
                )}
              </div>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
              <div className="relative">
                <div className="flex items-center gap-3 cursor-pointer p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" onClick={() => { setProfileOpen(!profileOpen); setShowNotifications(false); }}>
                  <div className="text-left rtl:text-right hidden md:block"><p className="text-sm font-bold text-gray-800 dark:text-gray-200">{currentUser?.fullName || 'مستخدم'}</p><p className="text-xs text-green-600 dark:text-green-400 font-medium">{currentUser?.role === UserRole.EMPLOYEE ? 'بوابة الموظف' : 'Online'}</p></div>
                  <UserCircle className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                </div>
                {profileOpen && (
                  <div className="absolute left-0 rtl:left-0 rtl:right-auto top-14 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                    <button onClick={handleProfileClick} className="w-full text-right rtl:text-right px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{t('profile')}</button>
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-50 dark:border-gray-700"><LogOut className="h-4 w-4" /> {t('logout')}</button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

const colorMap: Record<ThemeColor, Record<string, string>> = {
  indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81' },
  emerald: { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b' },
  violet: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95' },
  rose: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337' },
  amber: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f' },
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' }
};

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(14);
  const [isPaidVersion, setIsPaidVersion] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([{ id: 1, title: 'مرحباً بك', desc: 'تم تسجيل الدخول بنجاح للنظام', time: 'الآن', unread: true }]);

  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'ar');
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => (localStorage.getItem('themeColor') as ThemeColor) || 'indigo');
  const [themeMode, setThemeMode] = useState<'light'|'dark'>(() => (localStorage.getItem('themeMode') as 'light'|'dark') || 'light');

  const t = (key: string) => {
    // @ts-ignore
    return translations[language]?.[key] || key;
  };

  useEffect(() => {
    localStorage.setItem('language', language);
    localStorage.setItem('themeColor', themeColor);
    localStorage.setItem('themeMode', themeMode);

    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Toggle Dark Mode Class
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const selected = colorMap[themeColor];
    const primaryShade = themeColor === 'slate' ? '800' : '600';
    const hoverShade = themeColor === 'slate' ? '900' : '700';

    // Inject dynamic styles
    const styleId = 'dynamic-theme-style';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    
    styleTag.innerHTML = `
      :root { --theme-50: ${selected['50']}; --theme-100: ${selected['100']}; --theme-200: ${selected['200']}; --theme-300: ${selected['300']}; --theme-400: ${selected['400']}; --theme-500: ${selected['500']}; --theme-600: ${selected['600']}; --theme-700: ${selected['700']}; --theme-800: ${selected['800']}; --theme-900: ${selected['900']}; --primary-color: ${selected[primaryShade]}; }
      .bg-indigo-600 { background-color: ${selected[primaryShade]} !important; }
      .text-indigo-600 { color: ${selected[primaryShade]} !important; }
      .border-indigo-600 { border-color: ${selected[primaryShade]} !important; }
      .bg-indigo-50 { background-color: ${selected['50']} !important; }
      .text-indigo-700 { color: ${selected[hoverShade]} !important; }
      .hover\\:bg-indigo-700:hover { background-color: ${selected[hoverShade]} !important; }
      
      /* Dark mode overrides for dynamic colors */
      .dark .bg-indigo-50 { background-color: ${selected['900']}33 !important; }
      .dark .text-indigo-700 { color: ${selected['300']} !important; }
      .dark .text-indigo-600 { color: ${selected['400']} !important; }
      .dark .border-indigo-600 { border-color: ${selected['500']} !important; }
    `;
  }, [language, themeColor, themeMode]);

  const addNotification = (title: string, desc: string) => {
    const newNotif: Notification = { id: Date.now(), title, desc, time: 'الآن', unread: true };
    setNotifications(prev => [newNotif, ...prev]);
  };

  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await api.checkHealth();
        setIsServerOnline(res.status === 'ok');
      } catch (e) {
        setIsServerOnline(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 15000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const validateSubscription = () => {
        const storedUser = localStorage.getItem('currentUser');
        const trialStart = localStorage.getItem('trialStart');
        const storedLicenseKey = localStorage.getItem('licenseKey');
        const deviceId = getDeviceId();
        
        let paidValid = false;
        let isNowExpired = false;

        if (storedLicenseKey) {
           const validation = validateLicenseKey(storedLicenseKey, deviceId);
           if (validation.isValid) {
              setIsPaidVersion(true);
              paidValid = true;
              if (validation.expiryDate) {
                 const today = new Date();
                 today.setHours(0, 0, 0, 0);
                 const expDate = new Date(validation.expiryDate);
                 if (today > expDate) isNowExpired = true;
              }
           } else {
              setIsPaidVersion(false);
           }
        } else {
           setIsPaidVersion(false);
        }

        if (!paidValid) {
            if (!trialStart) {
               localStorage.setItem('trialStart', new Date().toISOString());
               setTrialDaysLeft(14);
            } else {
               const startDate = new Date(trialStart);
               const today = new Date();
               const diffTime = Math.abs(today.getTime() - startDate.getTime());
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
               const left = 14 - diffDays;
               setTrialDaysLeft(left);
               if (left <= 0) isNowExpired = true;
            }
        }

        setIsExpired(isNowExpired);
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
    };

    validateSubscription();
    window.addEventListener('focus', validateSubscription);
    return () => window.removeEventListener('focus', validateSubscription);
  }, []);

  const handleLogin = (user: SystemUser) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    if (!localStorage.getItem('trialStart')) localStorage.setItem('trialStart', new Date().toISOString());
  };

  const handleLogout = () => { localStorage.removeItem('currentUser'); setCurrentUser(null); };

  const contextValue: AppContextType = {
    sidebarOpen, setSidebarOpen, showNotifications, setShowNotifications, isPaidVersion, isExpired, trialDaysLeft, notifications, addNotification, handleLogout, currentUser, isServerOnline,
    language, setLanguage, themeColor, setThemeColor, themeMode, setThemeMode, t
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/license-manager" element={<AdminKeyGenerator />} />
            <Route path="/" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Dashboard /></MainLayout></ProtectedRoute> : <Login onLogin={handleLogin} />} />
            <Route path="/employees" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Employees /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
            <Route path="/employees/:id" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><EmployeeDetails /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
            <Route path="/org-chart" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><OrgChart /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
            <Route path="/shifts" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Shifts /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
            <Route path="/recruitment" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Recruitment /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
            <Route path="/attendance" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Attendance /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
            <Route path="/contracts" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Contracts /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
            <Route path="/insurance" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Insurance /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
            <Route path="/leaves" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Leaves /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
            <Route path="/payroll" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Payroll /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
            <Route path="/loans" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Loans /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
            <Route path="/reports" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Reports /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
            <Route path="/transport" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Transport /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
            <Route path="/performance" element={currentUser ? <ProtectedRoute isExpired={isExpired}><MainLayout><Performance /></MainLayout></ProtectedRoute> : <Navigate to="/" />} />
            <Route path="/appearance" element={currentUser ? <MainLayout><Appearance /></MainLayout> : <Navigate to="/" />} />
            <Route path="/settings" element={currentUser ? <MainLayout><Settings /></MainLayout> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AppContext.Provider>
  );
};

export default App;
