import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminListSubmissions, adminManage } from '../../services/submissionService';
import StatCard from '../../components/admin/StatCard';
import PendingBadge from '../../components/admin/PendingBadge';
import {
  FiFileText,
  FiMapPin,
  FiNavigation2,
  FiDollarSign,
  FiAlertTriangle,
  FiUserCheck,
  FiUsers,
  FiTruck,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [pendingCounts, setPendingCounts] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const types = ['newTera', 'newRoute', 'fareUpdate', 'conditionUpdate', 'driver_verification', 'route_application'];
      const counts = {};

      for (const type of types) {
        try {
          const data = await adminListSubmissions('pending', type);
          counts[type] = data.length;
        } catch (e) {
          counts[type] = 0;
        }
      }
      setPendingCounts(counts);

      const analyticsData = await adminManage.getAnalytics();
      setAnalytics(analyticsData);
      setRecentActivity(analyticsData.recentActivity || []);

      const alertsList = [];

      if (counts.driver_verification > 0) {
        alertsList.push({
          type: 'warning',
          message: `${counts.driver_verification} driver verification(s) pending review`,
          action: () => navigate('/admin/submissions/driver-kyc')
        });
      }

      if (analyticsData.routes?.withNoDrivers > 0) {
        alertsList.push({
          type: 'error',
          message: `${analyticsData.routes.withNoDrivers} route(s) have no drivers assigned`,
          action: () => navigate('/admin/manage/routes')
        });
      }

      if (analyticsData.submissions?.approvalRate) {
        const approvalRate = parseFloat(analyticsData.submissions.approvalRate);
        if (approvalRate < 50) {
          alertsList.push({
            type: 'warning',
            message: `Low approval rate: ${approvalRate}%`,
            action: () => navigate('/admin/analytics')
          });
        }
      }

      setAlerts(alertsList);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Shimmer loading skeleton */}
        <div className="h-10 w-64 shimmer-loading rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card-static rounded-2xl p-6 h-28 shimmer-loading" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card-static rounded-2xl p-6 h-24 shimmer-loading" />
          ))}
        </div>
      </div>
    );
  }

  const totalPending = Object.values(pendingCounts).reduce((sum, count) => sum + count, 0);

  const submissionCards = [
    {
      label: 'New Tera',
      icon: FiMapPin,
      count: pendingCounts.newTera || 0,
      path: '/admin/submissions/teras?status=pending',
      badgeColor: 'icon-badge-sky',
    },
    {
      label: 'New Route',
      icon: FiNavigation2,
      count: pendingCounts.newRoute || 0,
      path: '/admin/submissions/routes?status=pending',
      badgeColor: 'icon-badge-indigo',
    },
    {
      label: 'Fare Updates',
      icon: FiDollarSign,
      count: pendingCounts.fareUpdate || 0,
      path: '/admin/submissions/fares?status=pending',
      badgeColor: 'icon-badge-emerald',
    },
    {
      label: 'Conditions',
      icon: FiAlertTriangle,
      count: pendingCounts.conditionUpdate || 0,
      path: '/admin/submissions/conditions?status=pending',
      badgeColor: 'icon-badge-amber',
    },
    {
      label: 'Driver KYC',
      icon: FiUserCheck,
      count: pendingCounts.driver_verification || 0,
      path: '/admin/submissions/driver-kyc?status=pending',
      badgeColor: 'icon-badge-violet',
    },
    {
      label: 'Route Apps',
      icon: FiFileText,
      count: pendingCounts.route_application || 0,
      path: '/admin/submissions/route-applications?status=pending',
      badgeColor: 'icon-badge-teal',
    },
  ];

  const statusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FiCheckCircle className="text-emerald-400" size={16} />;
      case 'rejected':
        return <FiXCircle className="text-rose-400" size={16} />;
      default:
        return <FiClock className="text-amber-400" size={16} />;
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rejected':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-extrabold font-display text-gray-900 dark:text-white">
          {getGreeting()}, <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Admin</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-body">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Pending"
          value={totalPending}
          icon={FiFileText}
          subtitle="Submissions awaiting review"
          color="amber"
          delay={0.05}
        />
        {analytics && (
          <>
            <StatCard
              title="Total Users"
              value={analytics.totals?.users || 0}
              icon={FiUsers}
              color="indigo"
              delay={0.1}
            />
            <StatCard
              title="Total Drivers"
              value={analytics.totals?.drivers || 0}
              icon={FiTruck}
              color="emerald"
              delay={0.15}
            />
            <StatCard
              title="Total Routes"
              value={analytics.totals?.routes || 0}
              icon={FiNavigation2}
              color="sky"
              delay={0.2}
            />
          </>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="animate-fade-in-up stagger-4">
          <h2 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-amber-400" size={20} />
            Alerts
          </h2>
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                onClick={alert.action}
                className={`glass-card rounded-xl p-4 cursor-pointer border-l-4 ${alert.type === 'error'
                    ? 'border-l-rose-500'
                    : 'border-l-amber-500'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${alert.type === 'error'
                      ? 'bg-rose-500/10'
                      : 'bg-amber-500/10'
                    }`}>
                    <FiAlertTriangle
                      className={
                        alert.type === 'error'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }
                      size={18}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {alert.message}
                  </span>
                  <FiNavigation2 className="ml-auto text-gray-400 dark:text-gray-500" size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Submissions */}
      <div className="animate-fade-in-up stagger-5">
        <h2 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-4">
          Pending Submissions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {submissionCards.map((card, idx) => {
            const CardIcon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(card.path)}
                className="glass-card rounded-xl p-5 cursor-pointer animate-fade-in-up group"
                style={{ animationDelay: `${0.25 + idx * 0.05}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`icon-badge ${card.badgeColor}`}>
                      <CardIcon className="text-white relative z-10" size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white font-display text-sm">
                        {card.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Submissions
                      </div>
                    </div>
                  </div>
                  <PendingBadge count={card.count} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity — Timeline Style */}
      <div className="animate-fade-in-up stagger-7">
        <h2 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="glass-card-static rounded-2xl overflow-hidden">
          {recentActivity.length > 0 ? (
            <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="p-4 flex items-start gap-4 hover:bg-white/30 dark:hover:bg-white/5 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${0.4 + idx * 0.05}s` }}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.status === 'approved'
                        ? 'bg-emerald-500/10'
                        : activity.status === 'rejected'
                          ? 'bg-rose-500/10'
                          : 'bg-amber-500/10'
                      }`}>
                      {statusIcon(activity.status)}
                    </div>
                    {idx < recentActivity.length - 1 && (
                      <div className="w-px h-full min-h-[20px] bg-gray-200 dark:bg-gray-700 mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="font-semibold text-sm text-gray-900 dark:text-white font-display">
                          {activity.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          by {activity.submittedBy?.username || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusColor(activity.status)}`}>
                          {activity.status?.charAt(0).toUpperCase() + activity.status?.slice(1)}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {new Date(activity.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FiClock className="mx-auto text-gray-400 dark:text-gray-500 mb-3" size={32} />
              <p className="text-gray-500 dark:text-gray-400 font-body">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
