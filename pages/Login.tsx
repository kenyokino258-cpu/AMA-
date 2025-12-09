
import React, { useState } from 'react';
import { Users, ArrowLeft, CheckCircle, PlayCircle, Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      onLogin();
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white" dir="rtl">
      {/* Right Side - Branding */}
      <div className="md:w-1/2 bg-indigo-600 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
           <Users className="w-96 h-96 absolute -bottom-20 -left-20" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">نـظـام HR</h1>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            بوابة الدخول الموحدة
          </h2>
          <p className="text-indigo-100 text-lg mb-8 leading-relaxed max-w-md">
            نظام سحابي متطور لإدارة الموظفين والرواتب. سجل الدخول لمتابعة أعمالك.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span>نظام آمن ومشفر بالكامل</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span>يدعم النسخة التجريبية والكاملة</span>
          </div>
        </div>
      </div>

      {/* Left Side - Login Form */}
      <div className="md:w-1/2 p-8 md:p-12 flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900">تسجيل الدخول</h3>
            <p className="text-gray-500 mt-2">مرحباً بك، أدخل بيانات الحساب للمتابعة</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:outline-none transition-all"
                  placeholder="username"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:outline-none transition-all"
                  placeholder="••••••"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>دخول</span>
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-2">للحسابات التجريبية استخدم: admin / 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
