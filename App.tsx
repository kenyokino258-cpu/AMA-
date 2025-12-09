
import React, { useState, useEffect, useContext, createContext } from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TrialBanner from './components/TrialBanner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetails from './pages/EmployeeDetails';
import Recruitment from './pages/Recruitment';
import Attendance from './pages/Attendance';
import Contracts from './pages/Contracts';
import Insurance from './pages/Insurance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Loans from './pages/Loans';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import OrgChart from './pages/OrgChart';
import Transport from './pages/Transport';
import AdminKeyGenerator from './pages/AdminKeyGenerator';
import { Menu, Bell, Search, UserCircle, X, LogOut } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

interface AppContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  isPaidVersion: boolean;
  trialDaysLeft: number;
  notifications: Notification[];
  handleLogout: () => void;
}

const AppContext = createContext<AppContextType>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
  showNotifications: false,
  setShowNotifications: () => {},
  isPaidVersion: false,
  trialDaysLeft: 0,
  notifications: [],
  handleLogout: () => {},
});

const MainLayout = ({ children }: { children?: React.ReactNode }) => {
  const {
    sidebarOpen,
    setSidebarOpen,
    showNotifications,
    setShowNotifications,
    isPaidVersion,
    trialDaysLeft,
    notifications,
    handleLogout
  } = useContext(AppContext);

  return (
    <div className="flex min-h-screen bg-[#f3f4f6] flex-col">
      {!isPaidVersion && <TrialBanner daysLeft={trialDaysLeft} />}
      <div className="flex flex-1">
        <div className="no-print">
           <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        </div>
        <main className="flex-1 overflow-x-hidden">
          {/* Header Logic */}
          <header className="sticky top-0 z-20 flex h-20 w-full items-center justify-between bg-white px-6 shadow-sm no-print">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(true)} 
                  className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
                >
                  <Menu className="h-6 w-6" />
                </button>
                
                <div className="hidden md:block relative w-96">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="بحث سريع (موظفين، قرارات، تقارير)..." 
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-9 pl-4 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Bell className="h-6 w-6" />
                    <span className="absolute top-2 left-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
                  </button>
                  {showNotifications && (
                    <div className="absolute left-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50">
                      <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">الإشعارات</h3>
                        <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.map(notif => (
                          <div key={notif.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${notif.unread ? 'bg-indigo-50/30' : ''}`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className={`font-bold text-sm ${notif.unread ? 'text-indigo-700' : 'text-gray-700'}`}>{notif.title}</span>
                              <span className="text-[10px] text-gray-400">{notif.time}</span>
                            </div>
                            <p className="text-xs text-gray-500">{notif.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="h-8 w-px bg-gray-200 mx-1"></div>
                <div className="flex items-center gap-3 group relative">
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-bold text-gray-800">مدير النظام</p>
                    <p className="text-xs text-green-600 font-medium">Online</p>
                  </div>
                  <UserCircle className="h-10 w-10 text-gray-400 cursor-pointer" />
                  <div className="absolute left-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block z-50">
                     <button 
                       onClick={handleLogout}
                       className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                     >
                        <LogOut className="h-4 w-4" />
                        تسجيل الخروج
                     </button>
                  </div>
                </div>
              </div>
          </header>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(14);
  const [isPaidVersion, setIsPaidVersion] = useState(false);

  // Check auth status and trial period on mount
  useEffect(() => {
    const auth = localStorage.getItem('auth');
    const trialStart = localStorage.getItem('trialStart');
    const subscription = localStorage.getItem('subscriptionStatus');

    if (auth === 'true') {
      setIsAuthenticated(true);
    }

    if (subscription === 'paid') {
      setIsPaidVersion(true);
    }

    if (trialStart) {
      const startDate = new Date(trialStart);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      const remaining = 14 - diffDays;
      setTrialDaysLeft(remaining > 0 ? remaining : 0);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('auth', 'true');
    
    // Set trial start date if not exists
    if (!localStorage.getItem('trialStart')) {
      localStorage.setItem('trialStart', new Date().toISOString());
    }
    
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    setIsAuthenticated(false);
  };

  const handleSubscriptionUpdate = () => {
    const subscription = localStorage.getItem('subscriptionStatus');
    setIsPaidVersion(subscription === 'paid');
  };

  const notifications: Notification[] = [
    { id: 1, title: 'طلب إجازة جديد', desc: 'محمد حسن طلب إجازة سنوية', time: 'منذ ساعة', unread: true },
    { id: 2, title: 'انتهاء عقد', desc: 'عقد سارة يوسف ينتهي قريباً', time: 'منذ 3 ساعات', unread: true },
    { id: 3, title: 'اعتماد الرواتب', desc: 'تم تجهيز مسير رواتب أكتوبر', time: 'أمس', unread: false },
  ];

  const contextValue: AppContextType = {
    sidebarOpen,
    setSidebarOpen,
    showNotifications,
    setShowNotifications,
    isPaidVersion,
    trialDaysLeft,
    notifications,
    handleLogout
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <Routes>
          <Route path="/license-manager" element={<AdminKeyGenerator />} />

          <Route path="/" element={isAuthenticated ? <MainLayout><Dashboard /></MainLayout> : <Login onLogin={handleLogin} />} />
          <Route path="/employees" element={isAuthenticated ? <MainLayout><Employees /></MainLayout> : <Navigate to="/" />} />
          <Route path="/employees/:id" element={isAuthenticated ? <MainLayout><EmployeeDetails /></MainLayout> : <Navigate to="/" />} />
          <Route path="/org-chart" element={isAuthenticated ? <MainLayout><OrgChart /></MainLayout> : <Navigate to="/" />} />
          <Route path="/recruitment" element={isAuthenticated ? <MainLayout><Recruitment /></MainLayout> : <Navigate to="/" />} />
          <Route path="/attendance" element={isAuthenticated ? <MainLayout><Attendance /></MainLayout> : <Navigate to="/" />} />
          <Route path="/contracts" element={isAuthenticated ? <MainLayout><Contracts /></MainLayout> : <Navigate to="/" />} />
          <Route path="/insurance" element={isAuthenticated ? <MainLayout><Insurance /></MainLayout> : <Navigate to="/" />} />
          <Route path="/leaves" element={isAuthenticated ? <MainLayout><Leaves /></MainLayout> : <Navigate to="/" />} />
          <Route path="/payroll" element={isAuthenticated ? <MainLayout><Payroll /></MainLayout> : <Navigate to="/" />} />
          <Route path="/loans" element={isAuthenticated ? <MainLayout><Loans /></MainLayout> : <Navigate to="/" />} />
          <Route path="/reports" element={isAuthenticated ? <MainLayout><Reports /></MainLayout> : <Navigate to="/" />} />
          <Route path="/transport" element={isAuthenticated ? <MainLayout><Transport /></MainLayout> : <Navigate to="/" />} />
          <Route path="/settings" element={isAuthenticated ? <MainLayout><Settings onSubscriptionChange={handleSubscriptionUpdate} /></MainLayout> : <Navigate to="/" />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppContext.Provider>
  );
};

export default App;
