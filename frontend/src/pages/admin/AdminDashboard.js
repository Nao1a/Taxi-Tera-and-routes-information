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
  FiTruck
} from 'react-icons/fi';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [pendingCounts, setPendingCounts] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load pending counts for each submission type
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

      // Load analytics for alerts and stats
      const analyticsData = await adminManage.getAnalytics();
      setAnalytics(analyticsData);
      setRecentActivity(analyticsData.recentActivity || []);

      // Generate alerts
      const alertsList = [];
      
      // Drivers requesting transfer with <3 months
      if (analyticsData.drivers) {
        // This would require checking route_application submissions with monthsServed < 3
        // For now, we'll add a placeholder
      }

      // Pending driver verifications
      if (counts.driver_verification > 0) {
        alertsList.push({
          type: 'warning',
          message: `${counts.driver_verification} driver verification(s) pending review`,
          action: () => navigate('/admin/submissions/driver-kyc')
        });
      }

      // Routes with 0 drivers
      if (analyticsData.routes?.withNoDrivers > 0) {
        alertsList.push({
          type: 'error',
          message: `${analyticsData.routes.withNoDrivers} route(s) have no drivers assigned`,
          action: () => navigate('/admin/manage/routes')
        });
      }

      // High rejection rate (if > 50%)
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
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  const totalPending = Object.values(pendingCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Pending"
          value={totalPending}
          icon={FiFileText}
          subtitle="Submissions awaiting review"
        />
        {analytics && (
          <>
            <StatCard
              title="Total Users"
              value={analytics.totals?.users || 0}
              icon={FiUsers}
            />
            <StatCard
              title="Total Drivers"
              value={analytics.totals?.drivers || 0}
              icon={FiTruck}
            />
            <StatCard
              title="Total Routes"
              value={analytics.totals?.routes || 0}
              icon={FiNavigation2}
            />
          </>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Alerts</h2>
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                onClick={alert.action}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  alert.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FiAlertTriangle
                    className={
                      alert.type === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }
                    size={20}
                  />
                  <div
                    className={
                      alert.type === 'error'
                        ? 'text-red-800 dark:text-red-200'
                        : 'text-yellow-800 dark:text-yellow-200'
                    }
                  >
                    {alert.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Submissions by Type */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Pending Submissions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/admin/submissions/teras?status=pending')}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiMapPin className="text-blue-600 dark:text-blue-400" size={24} />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">New Tera</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Submissions</div>
                </div>
              </div>
              <PendingBadge count={pendingCounts.newTera || 0} />
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/submissions/routes?status=pending')}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiNavigation2 className="text-blue-600 dark:text-blue-400" size={24} />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">New Route</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Submissions</div>
                </div>
              </div>
              <PendingBadge count={pendingCounts.newRoute || 0} />
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/submissions/fares?status=pending')}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiDollarSign className="text-blue-600 dark:text-blue-400" size={24} />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Fare Updates</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Submissions</div>
                </div>
              </div>
              <PendingBadge count={pendingCounts.fareUpdate || 0} />
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/submissions/conditions?status=pending')}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiAlertTriangle className="text-blue-600 dark:text-blue-400" size={24} />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Condition Updates</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Submissions</div>
                </div>
              </div>
              <PendingBadge count={pendingCounts.conditionUpdate || 0} />
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/submissions/driver-kyc?status=pending')}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiUserCheck className="text-blue-600 dark:text-blue-400" size={24} />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Driver KYC</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Submissions</div>
                </div>
              </div>
              <PendingBadge count={pendingCounts.driver_verification || 0} />
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/submissions/route-applications?status=pending')}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiFileText className="text-blue-600 dark:text-blue-400" size={24} />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Route Applications</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Submissions</div>
                </div>
              </div>
              <PendingBadge count={pendingCounts.route_application || 0} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {activity.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        by {activity.submittedBy?.username || 'Unknown'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          activity.status === 'approved'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : activity.status === 'rejected'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                        }`}
                      >
                        {activity.status?.charAt(0).toUpperCase() + activity.status?.slice(1)}
                      </span>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

