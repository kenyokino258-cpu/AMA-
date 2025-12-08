
import React, { useState } from 'react';
import { generateLicenseKey } from '../utils/security';
import { Shield, Lock, Copy, Check, Terminal, CalendarClock } from 'lucide-react';

const AdminKeyGenerator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [clientDeviceId, setClientDeviceId] = useState('');
  const [duration, setDuration] = useState(365); // Default 1 Year
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);

  // Hardcoded Admin Credentials
  const ADMIN_USER = 'master';
  const ADMIN_PASS = 'nizam2030';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('بيانات الدخول غير صحيحة');
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientDeviceId.length < 5) {
      alert('الرجاء إدخال رقم جهاز صحيح');
      return;
    }
    const key = generateLicenseKey(clientDeviceId, Number(duration));
    setGeneratedKey(key);
    setCopied(false);
  };

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(generatedKey).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        // Fallback if clipboard API fails despite being present
        fallbackCopy(generatedKey);
      });
    } else {
      // Fallback for non-secure contexts
      fallbackCopy(generatedKey);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; // Avoid scrolling
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        alert('فشل النسخ تلقائياً');
      }
    } catch (err) {
      alert('فشل النسخ تلقائياً');
    }
    
    document.body.removeChild(textArea);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
          <div className="text-center mb-8">
            <div className="bg-indigo-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">مولد التراخيص</h1>
            <p className="text-slate-400 text-sm mt-2">منطقة محظورة: للمسؤولين فقط</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">اسم المسؤول</label>
              <input 
                type="text" 
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">كلمة المرور</label>
              <input 
                type="password" 
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg">
              دخول للنظام
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans" dir="rtl">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-2 rounded-lg">
               <Terminal className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg">نظام التفعيل المركزي</h2>
              <p className="text-xs text-slate-400">Advanced License Manager</p>
            </div>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="text-sm text-red-400 hover:text-red-300">خروج</button>
        </div>

        {/* Generator Card */}
        <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-6 md:p-8">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-indigo-400 font-medium mb-2">
                <Lock className="h-4 w-4" />
                رقم جهاز العميل (Device ID)
              </label>
              <input 
                type="text" 
                placeholder="XXXX-XXXX-XXXX"
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-lg tracking-wider text-center rounded-xl p-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none uppercase placeholder-slate-600"
                value={clientDeviceId}
                onChange={e => setClientDeviceId(e.target.value)}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-indigo-400 font-medium mb-2">
                <CalendarClock className="h-4 w-4" />
                مدة الصلاحية
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
              >

                <option value={1}>يوم واحد (1 يوم)</option>
                <option value={30}>شهر واحد (30 يوم)</option>
                <option value={90}>3 أشهر (90 يوم)</option>
                <option value={180}>6 أشهر (180 يوم)</option>
                <option value={365}>سنة كاملة (365 يوم)</option>
                <option value={730}>سنتين (730 يوم)</option>
                <option value={3650}>مدى الحياة (10 سنوات)</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/20 transition-all transform active:scale-95"
            >
              توليد كود التفعيل
            </button>
          </form>

          {/* Result Area */}
          {generatedKey && (
            <div className="mt-8 animate-in slide-in-from-bottom-4 duration-300">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
                <div className="relative bg-slate-950 border border-slate-700 rounded-xl p-6 text-center">
                  <p className="text-slate-400 text-sm mb-2">كود التفعيل (License Key)</p>
                  <div className="text-2xl font-mono font-bold text-green-400 tracking-widest break-all mb-4 select-all">
                    {generatedKey}
                  </div>
                  
                  <button onClick={handleCopy} className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg transition-colors text-sm font-medium">
                    {copied ? <><Check className="h-4 w-4 text-green-500" /> تم النسخ</> : <><Copy className="h-4 w-4" /> نسخ الكود</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminKeyGenerator;
