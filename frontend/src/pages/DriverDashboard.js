import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import * as driverService from '../services/driverService';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [driverStatus, setDriverStatus] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [licensePhoto, setLicensePhoto] = useState(null);
  const [carPhoto, setCarPhoto] = useState(null);
  const [applyingRoute, setApplyingRoute] = useState(null);
  const [transferReason, setTransferReason] = useState('');
  const [monthsServed, setMonthsServed] = useState(0);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferRoute, setSelectedTransferRoute] = useState(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'taxiDriver') {
      navigate('/login');
      return;
    }
    loadDriverData();
  }, []);

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
      const formData = new FormData();
      formData.append('licensePhoto', licensePhoto);
      formData.append('carPhoto', carPhoto);

      await driverService.verifyDriver(formData);
      await loadDriverData();
      setLicensePhoto(null);
      setCarPhoto(null);
      setErrorMsg('');
      alert('Verification documents submitted successfully! Waiting for admin approval.');
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
      await driverService.applyForRoute(routeId);
      await loadDriverData();
      alert('Route application submitted successfully!');
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
      await driverService.applyForRoute(selectedTransferRoute._id, transferReason);
      await loadDriverData();
      setShowTransferModal(false);
      setSelectedTransferRoute(null);
      setTransferReason('');
      alert('Transfer request submitted successfully!');
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Failed to submit transfer request');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const verificationStatus = driverStatus?.driverDetails?.verificationStatus || 'unverified';
  const currentRoute = driverStatus?.driverDetails?.currentRoute;

  // State 1: Unverified - Show file upload UI
  if (verificationStatus === 'unverified' || verificationStatus === 'pending') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Driver Verification</h1>
        {verificationStatus === 'pending' && (
          <div className="mb-6 p-4 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400">
            <p className="text-yellow-800 dark:text-yellow-200">
              Your verification documents are under review. Please wait for admin approval.
            </p>
          </div>
        )}
        <form onSubmit={handleVerificationSubmit} className="space-y-6">
          <div className="p-6 rounded-2xl" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <label className="block text-lg font-semibold mb-4">License Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'license')}
              className="w-full p-2 rounded-lg"
              style={{ border: '1px solid rgb(var(--border))' }}
              required
            />
            {licensePhoto && (
              <p className="mt-2 text-sm text-green-600">Selected: {licensePhoto.name}</p>
            )}
          </div>
          <div className="p-6 rounded-2xl" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <label className="block text-lg font-semibold mb-4">Car Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'car')}
              className="w-full p-2 rounded-lg"
              style={{ border: '1px solid rgb(var(--border))' }}
              required
            />
            {carPhoto && (
              <p className="mt-2 text-sm text-green-600">Selected: {carPhoto.name}</p>
            )}
          </div>
          {errorMsg && <p className="text-red-600">{errorMsg}</p>}
          <button
            type="submit"
            disabled={uploading || !licensePhoto || !carPhoto}
            className="w-full p-4 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'rgb(var(--brand))', color: '#fff' }}
          >
            {uploading ? 'Uploading...' : 'Submit Verification Documents'}
          </button>
        </form>
      </div>
    );
  }

  // State 2: Verified but no route assigned - Show routes table
  if (verificationStatus === 'verified' && !currentRoute) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Available Routes</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">Select a route to apply for assignment.</p>
        {errorMsg && <div className="mb-4 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">{errorMsg}</div>}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ border: '1px solid rgb(var(--border))' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgb(var(--surface))' }}>
                <th className="p-4 text-left border" style={{ borderColor: 'rgb(var(--border))' }}>Route Name</th>
                <th className="p-4 text-left border" style={{ borderColor: 'rgb(var(--border))' }}>Fare</th>
                <th className="p-4 text-left border" style={{ borderColor: 'rgb(var(--border))' }}>Active Drivers</th>
                <th className="p-4 text-left border" style={{ borderColor: 'rgb(var(--border))' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route._id} style={{ backgroundColor: 'rgb(var(--bg))' }}>
                  <td className="p-4 border" style={{ borderColor: 'rgb(var(--border))' }}>{route.name}</td>
                  <td className="p-4 border" style={{ borderColor: 'rgb(var(--border))' }}>${route.fare}</td>
                  <td className="p-4 border" style={{ borderColor: 'rgb(var(--border))' }}>{route.activeDriverCount}</td>
                  <td className="p-4 border" style={{ borderColor: 'rgb(var(--border))' }}>
                    <button
                      onClick={() => handleApplyRoute(route._id)}
                      disabled={applyingRoute === route._id}
                      className="px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                      style={{ backgroundColor: 'rgb(var(--brand))', color: '#fff' }}
                    >
                      {applyingRoute === route._id ? 'Applying...' : 'Apply'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // State 3: Assigned to a route
  if (verificationStatus === 'verified' && currentRoute) {
    const routeName = currentRoute?.name || `${currentRoute?.fromTera?.name || ''} → ${currentRoute?.toTera?.name || ''}`;
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Driver Dashboard</h1>
        <div className="p-6 rounded-2xl mb-6" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
          <h2 className="text-2xl font-semibold mb-4">Current Assignment</h2>
          <p className="text-lg mb-2">
            <strong>Working on:</strong> {routeName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Assigned: {new Date(driverStatus.driverDetails.routeAssignedDate).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Months served: {monthsServed}
          </p>
        </div>
        {monthsServed < 3 && (
          <div className="mb-6 p-4 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400">
            <p className="text-yellow-800 dark:text-yellow-200">
              You have only served {monthsServed} months. Transfers usually require 3 months. Admin will review your reason.
            </p>
          </div>
        )}
        <div className="p-6 rounded-2xl" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
          <h2 className="text-xl font-semibold mb-4">Request Transfer</h2>
          <button
            onClick={handleRequestTransfer}
            className="px-6 py-3 rounded-lg font-semibold"
            style={{ backgroundColor: 'rgb(var(--brand))', color: '#fff' }}
          >
            Request Transfer
          </button>
        </div>

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ border: '1px solid rgb(var(--border))' }}>
              <h2 className="text-2xl font-bold mb-4">Select Target Route</h2>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Available Routes</label>
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
                      <div className="font-medium">{route.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Fare: ${route.fare} | Active Drivers: {route.activeDriverCount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Reason for Transfer</label>
                <textarea
                  placeholder="Please provide a reason for the transfer request..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full p-4 rounded-lg"
                  style={{ border: '1px solid rgb(var(--border))', minHeight: '100px' }}
                />
              </div>
              {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitTransfer}
                  disabled={!selectedTransferRoute || !transferReason.trim()}
                  className="px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'rgb(var(--brand))', color: '#fff' }}
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
                  className="px-6 py-3 rounded-lg font-semibold"
                  style={{ backgroundColor: 'rgb(var(--muted))', color: '#fff' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <p>Unknown driver status. Please contact support.</p>
    </div>
  );
};

export default DriverDashboard;

