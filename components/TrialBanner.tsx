
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Sparkles } from 'lucide-react';

interface TrialBannerProps {
  daysLeft: number;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ daysLeft }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-indigo-900 text-white px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm shadow-md relative z-30 no-print">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-800 p-1 rounded-full">
           <Sparkles className="h-4 w-4 text-yellow-400" />
        </div>
        <span className="font-medium">نسخة تجريبية:</span>
        <span className="text-indigo-200">استمتع بجميع مميزات النظام مجاناً.</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-indigo-800/50 px-3 py-1 rounded-full border border-indigo-700">
          <Clock className="h-3 w-3 text-yellow-400" />
          <span>متبقي {daysLeft} يوم</span>
        </div>
        <button 
          onClick={() => navigate('/settings')}
          className="bg-yellow-500 hover:bg-yellow-600 text-indigo-900 font-bold px-4 py-1 rounded-lg transition-colors text-xs sm:text-sm"
        >
          تفعيل النسخة الأصلية
        </button>
      </div>
    </div>
  );
};

export default TrialBanner;
