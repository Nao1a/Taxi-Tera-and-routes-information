import React from 'react';

const PendingBadge = ({ count, className = '' }) => {
  if (!count || count === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-bold text-white rounded-full animate-pulse-glow ${className}`}
      style={{
        background: 'rgb(var(--brand))',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default PendingBadge;


