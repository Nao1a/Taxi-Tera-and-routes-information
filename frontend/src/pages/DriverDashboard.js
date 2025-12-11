import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import * as driverService from '../services/driverService';
import DriverLayout from '../components/driver/DriverLayout';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [driverStatus, setDriverStatus] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [licensePhoto, setLicensePhoto] = useState(null);
  const [carPhoto, setCarPhoto] = useState(null);
  const [licenseText, setLicenseText] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [carType, setCarType] = useState('');
  const [applyingRoute, setApplyingRoute] = useState(null);
  const [transferReason, setTransferReason] = useState('');
  const [monthsServed, setMonthsServed] = useState(0);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferRoute, setSelectedTransferRoute] = useState(null);
  const [activeTab, setActiveTab] = useState('verification');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'taxiDriver') {
      navigate('/login');
      return;
    }
    loadDriverData();
  }, []);

  useEffect(() => {
    // Set default tab based on verification status
    if (driverStatus) {
      const verificationStatus = driverStatus?.driverDetails?.verificationStatus || 'unverified';
      const currentRoute = driverStatus?.driverDetails?.currentRoute;
      
      if (verificationStatus === 'unverified' || verificationStatus === 'pending') {
        setActiveTab('verification');
      } else if (verificationStatus === 'verified' && currentRoute) {
        setActiveTab('assigned');
      } else if (verificationStatus === 'verified' && !currentRoute) {
        setActiveTab('routes');
      }
    }
  }, [driverStatus]);

  const loadDriverData = async () => {
    try {
      setLoading(true);
      const [statusRes, routesRes] = await Promise.all([
        driverService.getDriverStatus(),
        driverService.getAvailableRoutes(),
      ]);
      setDriverStatus(statusRes.data);
      setRoutes(routesRes.data);
      
      // Calculate months served if user has a current route
      if (statusRes.data.driverDetails?.routeAssignedDate) {
        const assignedDate = new Date(statusRes.data.driverDetails.routeAssignedDate);
        const now = new Date();
        const diffTime = Math.abs(now - assignedDate);
        const months = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
        setMonthsServed(months);
      }
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Failed to load driver data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'license') {
        setLicensePhoto(file);
      } else {
        setCarPhoto(file);
      }
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!licensePhoto || !carPhoto) {
      setErrorMsg('Please upload both license photo and car photo');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg('');
      setNoticeMsg('');
      const formData = new FormData();
      formData.append('licensePhoto', licensePhoto);
      formData.append('carPhoto', carPhoto);
      if (licenseText) formData.append('licenseText', licenseText);
      if (carPlate) formData.append('carPlate', carPlate);
      if (carType) formData.append('carType', carType);

      await driverService.verifyDriver(formData);
      await loadDriverData();
      setLicensePhoto(null);
      setCarPhoto(null);
      setLicenseText('');
      setCarPlate('');
      setCarType('');
      setErrorMsg('');
      setNoticeMsg('Verification documents submitted successfully! Waiting for admin approval.');
      setTimeout(() => setNoticeMsg(''), 5000);
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Failed to submit verification documents');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyRoute = async (routeId) => {
    try {
      setApplyingRoute(routeId);
      setErrorMsg('');
      setNoticeMsg('');
      await driverService.applyForRoute(routeId);
      await loadDriverData();
      setNoticeMsg('Route application submitted successfully!');
      setTimeout(() => setNoticeMsg(''), 5000);
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Failed to apply for route');
    } finally {
      setApplyingRoute(null);
    }
  };

  const handleRequestTransfer = () => {
    if (monthsServed < 3) {
      const confirm = window.confirm(
        `You have only served ${monthsServed} months. Transfers usually require 3 months. Admin will review your reason. Continue?`
      );
      if (!confirm) return;
    }
    setShowTransferModal(true);
  };

  const handleSubmitTransfer = async () => {
    if (!selectedTransferRoute) {
      setErrorMsg('Please select a target route');
      return;
    }
    if (!transferReason.trim()) {
      setErrorMsg('Please provide a reason for the transfer request');
      return;
    }

    try {
      setErrorMsg('');
      setNoticeMsg('');
      await driverService.applyForRoute(selectedTransferRoute._id, transferReason);
      await loadDriverData();
      setShowTransferModal(false);
      setSelectedTransferRoute(null);
      setTransferReason('');
      setNoticeMsg('Transfer request submitted successfully!');
      setTimeout(() => setNoticeMsg(''), 5000);
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Failed to submit transfer request');
    }
  };

  if (loading) {
    return (
      <DriverLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-xl">Loading...</div>
        </div>
      </DriverLayout>
    );
  }

  const verificationStatus = driverStatus?.driverDetails?.verificationStatus || 'unverified';
  const currentRoute = driverStatus?.driverDetails?.currentRoute;
  const routeName = currentRoute?.name || (currentRoute ? `${currentRoute?.fromTera?.name || ''} → ${currentRoute?.toTera?.name || ''}` : null);

  const renderVerificationTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight text-black dark:text-white">Driver Verification (KYC)</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Submit your verification documents to get started</p>
        </div>

        {verificationStatus === 'pending' && (
          <div className="p-4 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400">
            <p className="text-yellow-800 dark:text-yellow-200">
              Your verification documents are under review. Please wait for admin approval.
            </p>
          </div>
        )}

        {verificationStatus === 'verified' && (
          <div className="p-4 rounded-xl bg-green-100 dark:bg-green-900/30 border border-green-400">
            <p className="text-green-800 dark:text-green-200">
              ✓ Your account has been verified. You can now apply for routes.
            </p>
          </div>
        )}

        {verificationStatus === 'unverified' && (
          <form onSubmit={handleVerificationSubmit} className="space-y-6">
            <div className="p-6 rounded-xl border" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
              <label className="block text-lg font-semibold mb-4 text-black dark:text-white">License Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'license')}
                className="w-full p-2 rounded-lg border bg-white dark:bg-white/10 text-black dark:text-white"
                style={{ borderColor: 'rgb(var(--border))' }}
                required
              />
              {licensePhoto && (
                <p className="mt-2 text-sm text-green-600">Selected: {licensePhoto.name}</p>
              )}
              <input
                type="text"
                placeholder="License Number (Optional)"
                value={licenseText}
                onChange={(e) => setLicenseText(e.target.value)}
                className="w-full mt-3 p-2 rounded-lg border bg-white dark:bg-white/10 text-black dark:text-white"
                style={{ borderColor: 'rgb(var(--border))' }}
              />
            </div>

            <div className="p-6 rounded-xl border" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
              <label className="block text-lg font-semibold mb-4 text-black dark:text-white">Car Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'car')}
                className="w-full p-2 rounded-lg border bg-white dark:bg-white/10 text-black dark:text-white"
                style={{ borderColor: 'rgb(var(--border))' }}
                required
              />
              {carPhoto && (
                <p className="mt-2 text-sm text-green-600">Selected: {carPhoto.name}</p>
              )}
              <div className="grid md:grid-cols-2 gap-3 mt-3">
                <input
                  type="text"
                  placeholder="Car Plate Number (Optional)"
                  value={carPlate}
                  onChange={(e) => setCarPlate(e.target.value)}
                  className="p-2 rounded-lg border bg-white dark:bg-white/10 text-black dark:text-white"
                  style={{ borderColor: 'rgb(var(--border))' }}
                />
                <input
                  type="text"
                  placeholder="Car Type (Optional)"
                  value={carType}
                  onChange={(e) => setCarType(e.target.value)}
                  className="p-2 rounded-lg border bg-white dark:bg-white/10 text-black dark:text-white"
                  style={{ borderColor: 'rgb(var(--border))' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || !licensePhoto || !carPhoto}
              className="w-full p-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white"
            >
              {uploading ? 'Uploading...' : 'Submit Verification Documents'}
            </button>
          </form>
        )}
      </div>
    );
  };

  const renderRoutesTab = () => {
    if (verificationStatus !== 'verified') {
      return (
        <div className="p-6 rounded-xl border text-center" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
          <p className="text-gray-600 dark:text-gray-400">
            Please complete your verification first before applying for routes.
          </p>
        </div>
      );
    }

    if (currentRoute) {
      return (
        <div className="p-6 rounded-xl border text-center" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You are currently assigned to a route. Check the "My Assigned Route" tab for details.
          </p>
          <button
            onClick={() => setActiveTab('assigned')}
            className="px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white"
          >
            View My Assigned Route
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight text-black dark:text-white">Available Routes</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Select a route to apply for assignment.</p>
        </div>

        {routes.length === 0 ? (
          <div className="p-6 rounded-xl border text-center" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
            <p className="text-gray-600 dark:text-gray-400">No routes available at the moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ border: '1px solid rgb(var(--border))' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgb(var(--surface))' }}>
                  <th className="p-4 text-left border text-black dark:text-white" style={{ borderColor: 'rgb(var(--border))' }}>Route Name</th>
                  <th className="p-4 text-left border text-black dark:text-white" style={{ borderColor: 'rgb(var(--border))' }}>Fare</th>
                  <th className="p-4 text-left border text-black dark:text-white" style={{ borderColor: 'rgb(var(--border))' }}>Active Drivers</th>
                  <th className="p-4 text-left border text-black dark:text-white" style={{ borderColor: 'rgb(var(--border))' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route._id} style={{ backgroundColor: 'rgb(var(--bg))' }}>
                    <td className="p-4 border text-black dark:text-white" style={{ borderColor: 'rgb(var(--border))' }}>{route.name}</td>
                    <td className="p-4 border text-black dark:text-white" style={{ borderColor: 'rgb(var(--border))' }}>${route.fare}</td>
                    <td className="p-4 border text-black dark:text-white" style={{ borderColor: 'rgb(var(--border))' }}>{route.activeDriverCount || 0}</td>
                    <td className="p-4 border" style={{ borderColor: 'rgb(var(--border))' }}>
                      <button
                        onClick={() => handleApplyRoute(route._id)}
                        disabled={applyingRoute === route._id}
                        className="px-4 py-2 rounded-lg font-semibold disabled:opacity-50 bg-blue-600 text-white"
                      >
                        {applyingRoute === route._id ? 'Applying...' : 'Apply'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderAssignedRouteTab = () => {
    if (verificationStatus !== 'verified') {
      return (
        <div className="p-6 rounded-xl border text-center" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
          <p className="text-gray-600 dark:text-gray-400">
            Please complete your verification first.
          </p>
        </div>
      );
    }

    if (!currentRoute) {
      return (
        <div className="p-6 rounded-xl border text-center" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You are not currently assigned to any route.
          </p>
          <button
            onClick={() => setActiveTab('routes')}
            className="px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white"
          >
            Browse Available Routes
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight text-black dark:text-white">My Assigned Route</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">View your current route assignment details.</p>
        </div>

        <div className="p-6 rounded-xl border" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
          <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">Current Assignment</h2>
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-black dark:text-white">Route: </span>
              <span className="text-lg text-black dark:text-white">{routeName}</span>
            </div>
            {driverStatus?.driverDetails?.routeAssignedDate && (
              <div>
                <span className="font-semibold text-black dark:text-white">Assigned: </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {new Date(driverStatus.driverDetails.routeAssignedDate).toLocaleDateString()}
                </span>
              </div>
            )}
            <div>
              <span className="font-semibold text-black dark:text-white">Months Served: </span>
              <span className="text-gray-600 dark:text-gray-400">{monthsServed}</span>
            </div>
            {currentRoute?.fare && (
              <div>
                <span className="font-semibold text-black dark:text-white">Fare: </span>
                <span className="text-gray-600 dark:text-gray-400">${currentRoute.fare}</span>
              </div>
            )}
          </div>
        </div>

        {monthsServed < 3 && (
          <div className="p-4 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400">
            <p className="text-yellow-800 dark:text-yellow-200">
              ⚠️ You have only served {monthsServed} months. Transfers usually require 3 months. Admin will review your reason.
            </p>
          </div>
        )}

        <div className="p-6 rounded-xl border" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Request Transfer</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            If you wish to transfer to a different route, you can submit a transfer request below.
          </p>
          <button
            onClick={handleRequestTransfer}
            className="px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white"
          >
            Request Transfer
          </button>
        </div>
      </div>
    );
  };

  return (
    <DriverLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-6xl mx-auto text-black dark:text-white">
        {(noticeMsg || errorMsg) && (
          <div className="mb-4">
            {noticeMsg && (
              <div className="px-4 py-2 rounded bg-green-600 text-white mb-2">{noticeMsg}</div>
            )}
            {errorMsg && (
              <div className="px-4 py-2 rounded bg-red-600 text-white">{errorMsg}</div>
            )}
          </div>
        )}

        {activeTab === 'verification' && renderVerificationTab()}
        {activeTab === 'routes' && renderRoutesTab()}
        {activeTab === 'assigned' && renderAssignedRouteTab()}

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ border: '1px solid rgb(var(--border))' }}>
              <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">Select Target Route</h2>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-black dark:text-white">Available Routes</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {routes.filter(r => r._id !== currentRoute?._id).map((route) => (
                    <div
                      key={route._id}
                      onClick={() => setSelectedTransferRoute(route)}
                      className={`p-3 rounded-lg cursor-pointer border-2 ${
                        selectedTransferRoute?._id === route._id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-black dark:text-white">{route.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Fare: ${route.fare} | Active Drivers: {route.activeDriverCount || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-black dark:text-white">Reason for Transfer</label>
                <textarea
                  placeholder="Please provide a reason for the transfer request..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full p-4 rounded-lg border bg-white dark:bg-white/10 text-black dark:text-white"
                  style={{ borderColor: 'rgb(var(--border))', minHeight: '100px' }}
                />
              </div>
              {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitTransfer}
                  disabled={!selectedTransferRoute || !transferReason.trim()}
                  className="px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white"
                >
                  Submit Transfer Request
                </button>
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedTransferRoute(null);
                    setTransferReason('');
                    setErrorMsg('');
                  }}
                  className="px-6 py-3 rounded-lg font-semibold bg-gray-600 text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DriverLayout>
  );
};

export default DriverDashboard;
