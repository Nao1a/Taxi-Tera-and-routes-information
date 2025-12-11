import React, { useState, useEffect, useMemo } from 'react';
import { adminManage } from '../../../services/submissionService';

const AdminDriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchDrivers, setSearchDrivers] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showAssignRouteModal, setShowAssignRouteModal] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState('');

  const load = async () => {
    try {
      const [driversData, routesData] = await Promise.all([
        adminManage.listDrivers(),
        adminManage.listRoutes()
      ]);
      setDrivers(driversData);
      setRoutes(routesData);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load drivers');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const driverList = useMemo(() => {
    const q = searchDrivers.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter(
      (d) =>
        `${d.username} ${d.email} ${d.driverDetails?.carPlate || ''}`.toLowerCase().includes(q)
    );
  }, [drivers, searchDrivers]);

  const handleVerify = async (id) => {
    try {
      setBusy(true);
      setError('');
      await adminManage.verifyDriver(id);
      setNotice('Driver verified');
      setTimeout(() => setNotice(''), 3000);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to verify driver');
    } finally {
      setBusy(false);
    }
  };

  const handleRejectVerification = async (id) => {
    try {
      setBusy(true);
      setError('');
      await adminManage.rejectDriverVerification(id);
      setNotice('Driver verification rejected');
      setTimeout(() => setNotice(''), 3000);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to reject verification');
    } finally {
      setBusy(false);
    }
  };

  const handleBanFromRoute = async (id) => {
    const reason = prompt('Reason for route ban:');
    if (reason === null) return;
    const removeFromRoute = window.confirm('Remove driver from current route immediately?');
    try {
      setBusy(true);
      setError('');
      await adminManage.banDriverFromRoute(id, reason, removeFromRoute);
      setNotice('Driver banned from route');
      setTimeout(() => setNotice(''), 3000);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to ban from route');
    } finally {
      setBusy(false);
    }
  };

  const handleUnbanFromRoute = async (id) => {
    try {
      setBusy(true);
      setError('');
      await adminManage.unbanDriverFromRoute(id);
      setNotice('Driver unbanned from route');
      setTimeout(() => setNotice(''), 3000);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to unban from route');
    } finally {
      setBusy(false);
    }
  };

  const handleForceRemoveRoute = async (id) => {
    if (!window.confirm('Force remove driver from current route?')) return;
    try {
      setBusy(true);
      setError('');
      await adminManage.forceRemoveDriverFromRoute(id);
      setNotice('Driver removed from route');
      setTimeout(() => setNotice(''), 3000);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to remove from route');
    } finally {
      setBusy(false);
    }
  };

  const handleAssignRoute = async () => {
    if (!selectedDriver || !selectedRouteId) {
      setError('Please select a route');
      return;
    }
    try {
      setBusy(true);
      setError('');
      await adminManage.assignDriverToRoute(selectedDriver._id, selectedRouteId);
      setNotice('Driver assigned to route');
      setTimeout(() => setNotice(''), 3000);
      setShowAssignRouteModal(false);
      setSelectedRouteId('');
      setSelectedDriver(null);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to assign route');
    } finally {
      setBusy(false);
    }
  };

  const handleBanAccount = async (id) => {
    const reason = prompt('Reason for account ban:');
    if (reason === null) return;
    try {
      setBusy(true);
      setError('');
      await adminManage.banAccount(id, reason);
      setNotice('Driver account banned');
      setTimeout(() => setNotice(''), 3000);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to ban account');
    } finally {
      setBusy(false);
    }
  };

  const getVerificationStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Driver Management</h1>

      {notice && (
        <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mb-4">
        <input
          value={searchDrivers}
          onChange={(e) => setSearchDrivers(e.target.value)}
          placeholder="Search drivers..."
          className="w-full max-w-md p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div className="space-y-4">
        {driverList.map((d) => {
          const currentRoute = d.driverDetails?.currentRoute;
          const routeName = currentRoute
            ? `${currentRoute.fromTera?.name || 'Unknown'} → ${currentRoute.toTera?.name || 'Unknown'}`
            : 'No route assigned';
          const verificationStatus = d.driverDetails?.verificationStatus || 'unverified';

          return (
            <div
              key={d._id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="font-medium text-lg text-gray-900 dark:text-white">
                    {d.username}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{d.email}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{d._id}</div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${getVerificationStatusColor(
                      verificationStatus
                    )}`}
                  >
                    {verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)}
                  </span>
                  {d.isAccountBanned && (
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg text-sm font-medium">
                      Account Banned
                    </span>
                  )}
                  {d.driverDetails?.isBannedFromRoute && (
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm font-medium">
                      Banned from Route
                    </span>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Current Route
                  </div>
                  <div className="text-base text-gray-900 dark:text-white">{routeName}</div>
                  {d.monthsServed !== undefined && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Months served: {d.monthsServed}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Car Information
                  </div>
                  <div className="text-base text-gray-900 dark:text-white">
                    Plate: {d.driverDetails?.carPlate || 'N/A'}
                  </div>
                  <div className="text-base text-gray-900 dark:text-white">
                    Type: {d.driverDetails?.carType || 'N/A'}
                  </div>
                </div>
              </div>

              {d.driverDetails?.documents?.licensePhoto && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Documents
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">License Photo</div>
                      <img
                        src={d.driverDetails.documents.licensePhoto}
                        alt="License"
                        className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                        style={{ maxHeight: '150px' }}
                      />
                    </div>
                    {d.driverDetails.documents.carPhoto && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Car Photo</div>
                        <img
                          src={d.driverDetails.documents.carPhoto}
                          alt="Car"
                          className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                          style={{ maxHeight: '150px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {verificationStatus !== 'verified' && (
                  <button
                    onClick={() => handleVerify(d._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={busy}
                  >
                    Verify Driver
                  </button>
                )}
                {verificationStatus === 'pending' && (
                  <button
                    onClick={() => handleRejectVerification(d._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    disabled={busy}
                  >
                    Reject Verification
                  </button>
                )}

                {d.driverDetails?.isBannedFromRoute ? (
                  <button
                    onClick={() => handleUnbanFromRoute(d._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={busy}
                  >
                    Unban from Route
                  </button>
                ) : (
                  <button
                    onClick={() => handleBanFromRoute(d._id)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                    disabled={busy}
                  >
                    Ban from Route
                  </button>
                )}

                {currentRoute && (
                  <button
                    onClick={() => handleForceRemoveRoute(d._id)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    disabled={busy}
                  >
                    Force Remove from Route
                  </button>
                )}

                {verificationStatus === 'verified' && !currentRoute && (
                  <button
                    onClick={() => {
                      setSelectedDriver(d);
                      setShowAssignRouteModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={busy}
                  >
                    Assign to Route
                  </button>
                )}

                {!d.isAccountBanned ? (
                  <button
                    onClick={() => handleBanAccount(d._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    disabled={busy}
                  >
                    Ban Account
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        setBusy(true);
                        await adminManage.unbanAccount(d._id);
                        setNotice('Driver account unbanned');
                        setTimeout(() => setNotice(''), 3000);
                        await load();
                      } catch (e) {
                        setError(e?.response?.data?.message || 'Failed to unban account');
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={busy}
                  >
                    Unban Account
                  </button>
                )}

                {d.driverDetails?.routeBanReason && (
                  <div className="w-full mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Route ban reason: {d.driverDetails.routeBanReason}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Route Modal */}
      {showAssignRouteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Assign Route to {selectedDriver?.username}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Route
              </label>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select a route...</option>
                {routes.map((route) => (
                  <option key={route._id} value={route._id}>
                    {route.fromTera?.name || 'Unknown'} → {route.toTera?.name || 'Unknown'} (${route.fare})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAssignRoute}
                disabled={!selectedRouteId || busy}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Assign
              </button>
              <button
                onClick={() => {
                  setShowAssignRouteModal(false);
                  setSelectedRouteId('');
                  setSelectedDriver(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDriverManagement;


