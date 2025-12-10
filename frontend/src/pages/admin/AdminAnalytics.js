import React, { useState, useEffect } from 'react';
import { adminManage } from '../../services/submissionService';
import StatCard from '../../components/admin/StatCard';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  FiUsers,
  FiTruck,
  FiMapPin,
  FiNavigation2,
  FiFileText,
  FiAlertCircle
} from 'react-icons/fi';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminManage.getAnalytics();
      setAnalytics(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
        {error || 'Failed to load analytics'}
      </div>
    );
  }

  // Prepare chart data
  const driversByStatusData = Object.entries(analytics.drivers?.byStatus || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const driversByRouteData = Object.entries(analytics.drivers?.byRoute || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const submissionsByTypeData = Object.entries(analytics.submissions?.byType || {}).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  }));

  const submissionsByStatusData = Object.entries(analytics.submissions?.byStatus || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const routesByFareRangeData = Object.entries(analytics.routes?.byFareRange || {}).map(([name, value]) => ({
    name: `$${name}`,
    value
  }));

  const usersByRoleData = Object.entries(analytics.users?.byRole || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const submissionTrendsData = analytics.submissions?.trends || [];
  const userGrowthTrendData = analytics.users?.growthTrend || [];

  // Calculate pending breakdown
  const pendingBreakdown = {};
  if (analytics.submissions?.byType) {
    // We'd need to fetch pending by type separately, but for now show total
    pendingBreakdown.total = analytics.submissions.pending;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Analytics Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
          title="Total Teras"
          value={analytics.totals?.teras || 0}
          icon={FiMapPin}
        />
        <StatCard
          title="Total Routes"
          value={analytics.totals?.routes || 0}
          icon={FiNavigation2}
        />
        <StatCard
          title="Pending Submissions"
          value={analytics.submissions?.pending || 0}
          icon={FiFileText}
          subtitle={`${analytics.submissions?.approvalRate || 0}% approval rate`}
        />
      </div>

      {/* Driver Analytics */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Driver Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Drivers by Verification Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={driversByStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {driversByStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Drivers by Route (Top 10)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={driversByRouteData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <StatCard
            title="Average Months Served"
            value={analytics.drivers?.avgMonthsServed || 0}
          />
          <StatCard
            title="Drivers with Route"
            value={analytics.drivers?.withRoute || 0}
          />
          <StatCard
            title="Drivers without Route"
            value={analytics.drivers?.withoutRoute || 0}
          />
        </div>

        {analytics.routes?.withNoDrivers > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-center gap-3">
            <FiAlertCircle className="text-yellow-600 dark:text-yellow-400" size={24} />
            <div>
              <div className="font-medium text-yellow-800 dark:text-yellow-200">
                Alert: {analytics.routes.withNoDrivers} route(s) have no drivers assigned
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submission Analytics */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Submission Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Submissions by Type
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={submissionsByTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {submissionsByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Submissions by Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={submissionsByStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Submission Trends (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={submissionTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Submissions" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <StatCard
            title="Average Processing Time"
            value={`${analytics.submissions?.avgProcessingTimeHours || 0} hours`}
          />
          <StatCard
            title="New This Week"
            value={analytics.submissions?.newThisWeek || 0}
          />
          <StatCard
            title="Overall Approval Rate"
            value={`${analytics.submissions?.approvalRate || 0}%`}
          />
        </div>
      </div>

      {/* Route Analytics */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Route Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Routes by Fare Range
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={routesByFareRangeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Most Requested Routes
            </h3>
            <div className="space-y-2">
              {analytics.routes?.mostRequested?.length > 0 ? (
                analytics.routes.mostRequested.map((route, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="text-sm text-gray-900 dark:text-white">{route.name}</div>
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {route.count} requests
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No route requests yet
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <StatCard
            title="Average Fare"
            value={`$${analytics.routes?.avgFare || 0}`}
          />
          <StatCard
            title="Total Distance"
            value={`${analytics.routes?.totalDistance || 0} km`}
          />
          <StatCard
            title="New This Month"
            value={analytics.routes?.newThisMonth || 0}
          />
        </div>
      </div>

      {/* User Analytics */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">User Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Users by Role
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={usersByRoleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {usersByRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              User Growth Trend (Last 30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#10b981" name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <StatCard
            title="Banned Users"
            value={analytics.users?.banned || 0}
          />
          <StatCard
            title="Account Banned"
            value={analytics.users?.accountBanned || 0}
          />
          <StatCard
            title="New This Month"
            value={analytics.users?.newThisMonth || 0}
          />
          <StatCard
            title="New This Week"
            value={analytics.users?.newThisWeek || 0}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

