import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, onClick, className = '' }) => {
  const cardClasses = `
    bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700
    ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
    ${className}
  `;

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="ml-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Icon className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;



