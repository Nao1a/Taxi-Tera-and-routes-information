import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, subtitle, icon: Icon, onClick, className = '', color = 'indigo', delay = 0, link, type }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const cardRef = useRef(null);

  // Animated counter for numeric values
  useEffect(() => {
    if (hasAnimated || typeof value !== 'number') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          const duration = 800;
          const steps = 30;
          const increment = value / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setDisplayValue(value);
              clearInterval(timer);
            } else {
              setDisplayValue(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [value, hasAnimated]);

  const badgeColorMap = {
    indigo: 'icon-badge-indigo',
    emerald: 'icon-badge-emerald',
    amber: 'icon-badge-amber',
    rose: 'icon-badge-rose',
    sky: 'icon-badge-sky',
    violet: 'icon-badge-violet',
    teal: 'icon-badge-teal',
    cyan: 'icon-badge-cyan',
  };

  const glowMap = {
    indigo: 'hover:shadow-glow-amber',
    emerald: 'hover:shadow-glow-emerald',
    amber: 'hover:shadow-glow-amber',
    rose: 'hover:shadow-glow-rose',
    sky: 'hover:shadow-glow-sky',
    violet: 'hover:shadow-glow-amber',
    teal: 'hover:shadow-glow-emerald',
    cyan: 'hover:shadow-glow-sky',
  };

  const content = (
    <div
      ref={cardRef}
      className={`glass-card rounded-2xl p-6 animate-fade-in-up ${onClick || link ? 'cursor-pointer' : ''} ${glowMap[color] || ''} ${className}`}
      style={{ animationDelay: `${delay}s` }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-1 font-body tracking-wide uppercase" style={{ color: 'rgb(var(--muted))' }}>
            {title}
          </p>
          <p className="text-3xl font-extrabold font-display" style={{ color: 'rgb(var(--text))' }}>
            {typeof value === 'number' ? displayValue : value}
          </p>
          {subtitle && (
            <p className="text-xs mt-2" style={{ color: 'rgb(var(--muted))' }}>{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`icon-badge ${badgeColorMap[color] || 'icon-badge-indigo'}`}>
            <Icon className="text-white relative z-10" size={24} />
          </div>
        )}
      </div>
    </div>
  );

  if (link) {
    return <Link to={link} className="block">{content}</Link>;
  }

  return content;
};

export default StatCard;


