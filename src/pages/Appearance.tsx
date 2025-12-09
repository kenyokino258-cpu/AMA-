
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Palette, Globe, CheckCircle } from 'lucide-react';
import { ThemeColor } from '../types';

const Appearance: React.FC = () => {
  const { t, language, setLanguage, themeColor, setThemeColor } = useContext(AppContext);

  const colors: {id: ThemeColor, label: string, hex: string}[] = [
      { id: 'indigo', label: t('blue'), hex: '#4f46e5' },
      { id: 'emerald', label: t('green'), hex: '#10b981' },
      { id: 'violet', label: t('purple'), hex: '#8b5cf6' },
      { id: 'rose', label: t('red'), hex: '#f43f5e' },
      { id: 'amber', label: t('orange'), hex: '#f59e0b' },
      { id: 'slate', label: t('black'), hex: '#1e293b' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{t('appearance')}</h2>
        <p className="text-sm text-gray-500">تخصيص ألوان النظام ولغة الواجهة</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Language Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Globe className="h-5 w-5 text-indigo-600" />
                {t('language')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    onClick={() => setLanguage('ar')}
                    className={`relative p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${language === 'ar' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🇪🇬</span>
                        <div className="text-right">
                            <span className={`block font-bold ${language === 'ar' ? 'text-indigo-900' : 'text-gray-700'}`}>العربية</span>
                            <span className="text-xs text-gray-500">الواجهة العربية (RTL)</span>
                        </div>
                    </div>
                    {language === 'ar' && <div className="bg-indigo-600 text-white p-1 rounded-full"><CheckCircle className="h-4 w-4" /></div>}
                </button>

                <button 
                    onClick={() => setLanguage('en')}
                    className={`relative p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${language === 'en' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🇺🇸</span>
                        <div className="text-left">
                            <span className={`block font-bold ${language === 'en' ? 'text-indigo-900' : 'text-gray-700'}`}>English</span>
                            <span className="text-xs text-gray-500">English Interface (LTR)</span>
                        </div>
                    </div>
                    {language === 'en' && <div className="bg-indigo-600 text-white p-1 rounded-full"><CheckCircle className="h-4 w-4" /></div>}
                </button>
            </div>
        </div>

        {/* Theme Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Palette className="h-5 w-5 text-indigo-600" />
                {t('themeColor')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {colors.map(color => (
                    <button
                        key={color.id}
                        onClick={() => setThemeColor(color.id)}
                        className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${themeColor === color.id ? `border-${color.id}-500 bg-gray-50 shadow-md` : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                    >
                        <div className="w-12 h-12 rounded-full mb-3 shadow-sm flex items-center justify-center text-white transition-transform transform" style={{ backgroundColor: color.hex }}>
                            {themeColor === color.id && <CheckCircle className="h-6 w-6" />}
                        </div>
                        <span className={`text-sm font-bold ${themeColor === color.id ? 'text-gray-900' : 'text-gray-500'}`}>{color.label}</span>
                    </button>
                ))}
            </div>
            
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                    سيتم تطبيق اللون المختار على الأزرار، القوائم، والخلفيات في جميع أنحاء النظام فوراً.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Appearance;
