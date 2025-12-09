
import React from 'react';
import Skeleton from './Skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: 'indigo' | 'green' | 'red' | 'yellow';
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color, isLoading = false }) => {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
  };

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          {isLoading ? (
             <Skeleton width={80} height={32} className="mt-2" />
          ) : (
             <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
          )}
          {trend && !isLoading && <p className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium">{trend}</p>}
          {isLoading && <Skeleton width={60} height={16} className="mt-1" />}
        </div>
        <div className={`rounded-full p-3 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
