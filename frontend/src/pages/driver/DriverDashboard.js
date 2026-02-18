import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/admin/StatCard';
import hireService from '../../services/hireService';
import { FiBriefcase, FiFileText, FiCheckCircle, FiArrowRight, FiClock, FiShield } from 'react-icons/fi';

const DriverDashboard = () => {
  const { user } = useAuth();
  const kycStatus = user?.kycStatus || 'not_submitted';

  const [stats, setStats] = useState({
    activeApplications: 0,
    activeJob: null,
  });
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await hireService.getMyApplications();
        const apps = res.data;

        const activeApps = apps.filter((a) => ['applied', 'chatting'].includes(a.status)).length;
        const hiredJob = apps.find((a) => a.status === 'hired');

        setStats({
          activeApplications: activeApps,
          activeJob: hiredJob,
        });
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-72 shimmer-loading rounded-xl" />
        <div className="h-20 shimmer-loading rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="glass-card-static rounded-2xl p-6 h-28 shimmer-loading" />
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
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {user?.name || user?.username}
          </span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-body">
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
                  You must verify your driving license before you can apply for jobs.
                </p>
              </div>
            </div>
            <NavLink
              to="/driver/verification"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
            >
              Verify Now
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
                Your license is being verified. You will be notified once complete.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Job Card */}
      {stats.activeJob && (
        <div
          className="glass-card rounded-2xl overflow-hidden animate-fade-in-up stagger-3"
          style={{
            borderImage: 'linear-gradient(135deg, #10b981, #14b8a6) 1',
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          {/* Gradient top accent bar */}
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #10b981, #14b8a6, #06b6d4)' }} />

          <div className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="icon-badge icon-badge-emerald animate-float">
                  <FiCheckCircle className="text-white relative z-10 w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white font-display">
                      You are Hired!
                    </h3>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}
                    >
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Driving for{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stats.activeJob.ownerId?.username || 'Owner'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold font-display text-gray-900 dark:text-white">
                  {stats.activeJob.carId?.make} {stats.activeJob.carId?.model}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.activeJob.carId?.plateNumber}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-200/50 dark:border-gray-700/50">
              <Link
                to="/driver/applications"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                View Application Details
                <FiArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Active Applications"
          value={stats.activeApplications}
          icon={FiFileText}
          color="indigo"
          delay={0.2}
        />
        <StatCard
          title="Jobs Available"
          value="View"
          icon={FiBriefcase}
          color="emerald"
          delay={0.25}
          link="/driver/jobs"
        />
      </div>
    </div>
  );
};

export default DriverDashboard;
