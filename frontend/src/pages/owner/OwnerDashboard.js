import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ownerService from '../../services/ownerService';
import authService from '../../services/authService';
import {
  FiTrendingUp,
  FiUsers,
  FiTruck,
  FiArrowRight,
  FiShield,
  FiClock,
  FiXCircle,
  FiGrid,
  FiClipboard,
} from 'react-icons/fi';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const kycStatus = user?.kycStatus || 'not_submitted';

  const [stats, setStats] = useState({
    cars: 0,
    activeCars: 0,
    applications: 0,
    pendingApps: 0,
  });
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    authService.refreshUser();

    const fetchStats = async () => {
      try {
        const [carsRes, appsRes] = await Promise.all([
          ownerService.getMyCars().catch(() => ({ data: [] })),
          ownerService.getOwnerApplications().catch(() => ({ data: [] })),
        ]);

        const cars = carsRes.data || [];
        const apps = appsRes.data || [];

        setStats({
          cars: cars.length,
          activeCars: cars.filter((c) => c.status === 'hired').length,
          applications: apps.length,
          pendingApps: apps.filter((a) => a.status === 'applied').length,
        });
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    if (kycStatus === 'verified') {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [kycStatus]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-72 shimmer-loading rounded-xl" />
        <div className="h-20 shimmer-loading rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="glass-card-static rounded-2xl p-6 h-32 shimmer-loading" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-extrabold font-display text-gray-900 dark:text-white">
          {getGreeting()},{' '}
          <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            {user?.name || user?.username || 'Owner'}
          </span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-body">
          Owner Overview •{' '}
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KYC Warning Banner — Not Submitted */}
      {kycStatus === 'not_submitted' && (
        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-amber-500 animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <FiShield className="text-amber-400" size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white font-display text-sm">
                  Account Unverified
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  You must verify your identity before you can list cars or hire drivers.
                </p>
              </div>
            </div>
            <NavLink
              to="/owner/verification"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
            >
              Verify Now
              <FiArrowRight size={16} />
            </NavLink>
          </div>
        </div>
      )}

      {/* KYC Warning Banner — Rejected */}
      {kycStatus === 'rejected' && (
        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-rose-500 animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10">
                <FiXCircle className="text-rose-400" size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white font-display text-sm">
                  Verification Rejected
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {user?.kycRejectionReason || 'Documents did not meet requirements.'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Please re-submit your documents.
                </p>
              </div>
            </div>
            <NavLink
              to="/owner/verification"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
            >
              Fix Now
              <FiArrowRight size={16} />
            </NavLink>
          </div>
        </div>
      )}

      {/* KYC Warning Banner — Pending */}
      {kycStatus === 'pending' && (
        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-sky-500 animate-fade-in-up stagger-2">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-sky-500/10">
              <FiClock className="text-sky-400" size={22} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white font-display text-sm">
                Verification Pending
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Your documents are under review. Full access will be granted upon approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      {kycStatus === 'verified' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Total Cars Card */}
          <div
            className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-3"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide font-body">
                Total Cars
              </h3>
              <div className="icon-badge icon-badge-sky">
                <FiTruck className="text-white relative z-10" size={20} />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white font-display">
              {stats.cars}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10">
                <FiTrendingUp className="text-emerald-400" size={14} />
                <span className="text-xs font-semibold text-emerald-400">
                  {stats.activeCars} Hired
                </span>
              </div>
            </div>
          </div>

          {/* Applications Card */}
          <div
            className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide font-body">
                Applications
              </h3>
              <div className="icon-badge icon-badge-violet">
                <FiUsers className="text-white relative z-10" size={20} />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white font-display">
              {stats.applications}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10">
                <FiClock className="text-amber-400" size={14} />
                <span className="text-xs font-semibold text-amber-400">
                  {stats.pendingApps} Pending Review
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {kycStatus === 'verified' && (
        <div className="animate-fade-in-up stagger-5">
          <h2 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/owner/cars"
              className="glass-card rounded-xl p-5 group cursor-pointer flex items-center gap-4"
            >
              <div className="icon-badge icon-badge-sky">
                <FiGrid className="text-white relative z-10" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white font-display text-sm">
                  Manage Cars
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Add, edit, or remove your vehicles
                </p>
              </div>
              <FiArrowRight
                className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors group-hover:translate-x-1 transform transition-transform"
                size={18}
              />
            </Link>

            <Link
              to="/owner/applications"
              className="glass-card rounded-xl p-5 group cursor-pointer flex items-center gap-4"
            >
              <div className="icon-badge icon-badge-violet">
                <FiClipboard className="text-white relative z-10" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white font-display text-sm">
                  View Applications
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Review driver applications for your cars
                </p>
              </div>
              <FiArrowRight
                className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors group-hover:translate-x-1 transform transition-transform"
                size={18}
              />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
