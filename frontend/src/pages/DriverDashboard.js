import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import * as driverService from '../services/driverService';
import { createSubmission } from '../services/submissionService';
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

  // Custom Confirmation State
  const [confirmTransferMsg, setConfirmTransferMsg] = useState('');

  // Car Route Application State
  const [showCarRouteModal, setShowCarRouteModal] = useState(false);
  const [selectedCarRoute, setSelectedCarRoute] = useState('');
  const [carRouteApplying, setCarRouteApplying] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'taxiDriver') {
      navigate('/login');
      return;
    }
    loadDriverData();
  }, [navigate]);

  useEffect(() => {
    if (driverStatus) {
      const verificationStatus = driverStatus?.driverDetails?.verificationStatus || 'unverified';
      const currentRoute = driverStatus?.driverDetails?.currentRoute;
      const activeJob = driverStatus?.activeJob;

      if (verificationStatus === 'unverified' || verificationStatus === 'pending') {
        setActiveTab('verification');
      } else if (activeJob) {
        setActiveTab('job');
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

  const handleCarRouteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCarRoute || !driverStatus?.activeJob?.carId?._id) return;

    setCarRouteApplying(true);
    try {
      await createSubmission('route_application', {
        carId: driverStatus.activeJob.carId._id,
        targetRouteId: selectedCarRoute
      });
      setNoticeMsg("Route application for car submitted successfully!");
      setShowCarRouteModal(false);
      setSelectedCarRoute('');
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Failed to submit application");
    } finally {
      setCarRouteApplying(false);
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
      setConfirmTransferMsg(`You have only served ${monthsServed} months. Transfers usually require 3 months minimum. Admin will review your reason. Continue?`);
    } else {
      setShowTransferModal(true);
    }
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
        <div className="flex flex-col gap-4 justify-center items-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-[rgb(var(--brand))] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg font-medium" style={{ color: 'rgb(var(--muted))' }}>Loading Dashboard...</div>
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
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Driver Verification (KYC)</h1>
          <p style={{ color: 'rgb(var(--muted))' }} className="mb-6">Submit your verification documents to get started</p>
        </div>

        {verificationStatus === 'pending' && (
          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'rgba(var(--brand-rgb), 0.1)', borderColor: 'rgb(var(--brand))' }}>
            <p className="font-medium" style={{ color: 'rgb(var(--brand))' }}>
              Your verification documents are under review. Please wait for admin approval.
            </p>
          </div>
        )}

        {verificationStatus === 'verified' && (
          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981' }}>
            <p className="font-medium text-emerald-600">
              ✓ Your account has been verified. You can now apply for routes.
            </p>
          </div>
        )}

        {verificationStatus === 'unverified' && (
          <form onSubmit={handleVerificationSubmit} className="space-y-6">
            <div className="p-6 rounded-xl border" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
              <label className="block text-lg font-semibold mb-4">License Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'license')}
                className="input-base"
                required
              />
              {licensePhoto && (
                <p className="mt-2 text-sm text-emerald-600">Selected: {licensePhoto.name}</p>
              )}
              <input
                type="text"
                placeholder="License Number (Optional)"
                value={licenseText}
                onChange={(e) => setLicenseText(e.target.value)}
                className="input-base mt-3"
              />
            </div>

            <div className="p-6 rounded-xl border" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
              <label className="block text-lg font-semibold mb-4">Car Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'car')}
                className="input-base"
                required
              />
              {carPhoto && (
                <p className="mt-2 text-sm text-emerald-600">Selected: {carPhoto.name}</p>
              )}
              <div className="grid md:grid-cols-2 gap-3 mt-3">
                <input
                  type="text"
                  placeholder="Car Plate Number (Optional)"
                  value={carPlate}
                  onChange={(e) => setCarPlate(e.target.value)}
                  className="input-base"
                />
                <input
                  type="text"
                  placeholder="Car Type (Optional)"
                  value={carType}
                  onChange={(e) => setCarType(e.target.value)}
                  className="input-base"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || !licensePhoto || !carPhoto}
              className="w-full btn-primary p-4 rounded-xl font-bold text-lg shadow-lg"
            >
              {uploading ? 'Submitting...' : 'Submit Verification Documents'}
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
          <p style={{ color: 'rgb(var(--muted))' }}>
            Please complete your verification first before applying for routes.
          </p>
        </div>
      );
    }

    if (currentRoute) {
      return (
        <div className="p-6 rounded-xl border text-center" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
          <p style={{ color: 'rgb(var(--muted))' }} className="mb-4">
            You are currently assigned to a route. Check the "My Assigned Route" tab for details.
          </p>
          <button
            onClick={() => setActiveTab('assigned')}
            className="btn-primary px-6 py-3 rounded-lg font-semibold"
          >
            View My Assigned Route
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Available Routes</h1>
          <p style={{ color: 'rgb(var(--muted))' }} className="mb-6">Select a route to apply for assignment.</p>
        </div>

        {routes.length === 0 ? (
          <div className="p-6 rounded-xl border text-center" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
            <p style={{ color: 'rgb(var(--muted))' }}>No routes available at the moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'rgb(var(--border))' }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: 'rgb(var(--surface))' }}>
                  <th className="p-4 text-left border-b" style={{ borderColor: 'rgb(var(--border))' }}>Route Name</th>
                  <th className="p-4 text-left border-b" style={{ borderColor: 'rgb(var(--border))' }}>Fare</th>
                  <th className="p-4 text-left border-b" style={{ borderColor: 'rgb(var(--border))' }}>Active Drivers</th>
                  <th className="p-4 text-left border-b" style={{ borderColor: 'rgb(var(--border))' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route._id} className="hover:bg-[rgba(var(--brand-rgb),0.02)] transition-colors">
                    <td className="p-4 border-b font-medium" style={{ borderColor: 'rgb(var(--border))' }}>{route.name}</td>
                    <td className="p-4 border-b font-semibold" style={{ borderColor: 'rgb(var(--border))', color: 'rgb(var(--brand))' }}>{route.fare} ETB</td>
                    <td className="p-4 border-b" style={{ borderColor: 'rgb(var(--border))' }}>{route.activeDriverCount || 0}</td>
                    <td className="p-4 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                      <button
                        onClick={() => handleApplyRoute(route._id)}
                        disabled={applyingRoute === route._id}
                        className="btn-primary px-4 py-2 rounded-lg font-semibold"
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

  const renderActiveJobTab = () => {
    const job = driverStatus?.activeJob;
    if (!job) return null;

    const car = job.carId;
    const route = car?.routeId;
    const owner = job.ownerId;

    return (
      <div className="space-y-6">
        <div className="p-6 rounded-xl border bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/20">
          <h1 className="text-3xl font-extrabold text-emerald-600 mb-2">You are Hired!</h1>
          <p className="text-emerald-700/80 dark:text-emerald-400">You are currently employed as a driver for the following car.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border bg-[rgb(var(--surface))] shadow-sm" style={{ borderColor: 'rgb(var(--border))' }}>
            <h2 className="text-xl font-bold mb-4">Car Details</h2>
            <ul className="space-y-3">
              <li className="flex justify-between border-b pb-2" style={{ borderColor: 'rgb(var(--border))' }}>
                <span style={{ color: 'rgb(var(--muted))' }}>Car:</span>
                <span className="font-semibold">{car?.make} {car?.model}</span>
              </li>
              <li className="flex justify-between border-b pb-2" style={{ borderColor: 'rgb(var(--border))' }}>
                <span style={{ color: 'rgb(var(--muted))' }}>Plate:</span>
                <span className="font-semibold font-mono tracking-wider">{car?.plateNumber}</span>
              </li>
              <li className="flex justify-between border-b pb-2" style={{ borderColor: 'rgb(var(--border))' }}>
                <span style={{ color: 'rgb(var(--muted))' }}>Daily Gebi:</span>
                <span className="font-bold" style={{ color: 'rgb(var(--brand))' }}>{car?.gebiAmount} ETB</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-xl border bg-[rgb(var(--surface))] shadow-sm" style={{ borderColor: 'rgb(var(--border))' }}>
            <h2 className="text-xl font-bold mb-4">Owner Contact</h2>
            <ul className="space-y-3">
              <li className="flex justify-between border-b pb-2" style={{ borderColor: 'rgb(var(--border))' }}>
                <span style={{ color: 'rgb(var(--muted))' }}>Name:</span>
                <span className="font-semibold">{owner?.username}</span>
              </li>
              <li className="flex justify-between border-b pb-2" style={{ borderColor: 'rgb(var(--border))' }}>
                <span style={{ color: 'rgb(var(--muted))' }}>Phone:</span>
                <span className="font-semibold">{owner?.phoneNumber || 'N/A'}</span>
              </li>
              <li className="flex justify-between border-b pb-2" style={{ borderColor: 'rgb(var(--border))' }}>
                <span style={{ color: 'rgb(var(--muted))' }}>Email:</span>
                <span className="font-semibold truncate max-w-[150px]">{owner?.email}</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-xl border bg-[rgb(var(--surface))] md:col-span-2 shadow-sm" style={{ borderColor: 'rgb(var(--border))' }}>
            <h2 className="text-xl font-bold mb-4">Working Route</h2>
            {route ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-2xl font-bold" style={{ color: 'rgb(var(--brand))' }}>
                  {route.fromTera?.name} ⟷ {route.toTera?.name}
                </div>
                <div className="text-lg font-medium p-3 rounded-lg bg-[rgba(var(--brand-rgb),0.05)] border border-[rgba(var(--brand-rgb),0.2)]">
                  Standard Fare: <span className="font-bold">{route.fare} ETB</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p style={{ color: 'rgb(var(--muted))' }} className="mb-4">This car is not currently assigned to a specific fixed route.</p>
                <button
                  onClick={() => setShowCarRouteModal(true)}
                  className="btn-primary px-6 py-2 rounded-xl font-bold shadow-md"
                >
                  Apply for Route Permit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAssignedRouteTab = () => {
    if (verificationStatus !== 'verified') {
      return (
        <div className="p-6 rounded-xl border text-center" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
          <p style={{ color: 'rgb(var(--muted))' }}>Please complete your verification first.</p>
        </div>
      );
    }

    if (!currentRoute) {
      return (
        <div className="p-6 rounded-xl border text-center" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
          <p style={{ color: 'rgb(var(--muted))' }} className="mb-4">You are not currently assigned to any route.</p>
          <button
            onClick={() => setActiveTab('routes')}
            className="btn-primary px-6 py-3 rounded-lg font-semibold"
          >
            Browse Available Routes
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">My Assigned Route</h1>
          <p style={{ color: 'rgb(var(--muted))' }} className="mb-6">View your current route assignment details.</p>
        </div>

        <div className="p-6 rounded-xl border shadow-sm" style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-[rgb(var(--brand))] rounded-full"></span>
            Current Assignment
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[rgba(var(--brand-rgb),0.03)] border border-[rgba(var(--brand-rgb),0.1)]">
              <span className="text-xs uppercase tracking-wider font-bold" style={{ color: 'rgb(var(--muted))' }}>Route</span>
              <div className="text-xl font-bold mt-1">{routeName}</div>
            </div>
            <div className="p-4 rounded-xl bg-[rgba(var(--brand-rgb),0.03)] border border-[rgba(var(--brand-rgb),0.1)]">
              <span className="text-xs uppercase tracking-wider font-bold" style={{ color: 'rgb(var(--muted))' }}>Fare</span>
              <div className="text-xl font-bold mt-1" style={{ color: 'rgb(var(--brand))' }}>{currentRoute.fare} ETB</div>
            </div>
            {driverStatus?.driverDetails?.routeAssignedDate && (
              <div className="p-4 rounded-xl bg-[rgb(var(--bg))] border" style={{ borderColor: 'rgb(var(--border))' }}>
                <span className="text-xs uppercase tracking-wider font-bold" style={{ color: 'rgb(var(--muted))' }}>Assigned On</span>
                <div className="text-lg font-semibold mt-1">
                  {new Date(driverStatus.driverDetails.routeAssignedDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </div>
              </div>
            )}
            <div className="p-4 rounded-xl bg-[rgb(var(--bg))] border" style={{ borderColor: 'rgb(var(--border))' }}>
              <span className="text-xs uppercase tracking-wider font-bold" style={{ color: 'rgb(var(--muted))' }}>Service Record</span>
              <div className="text-lg font-semibold mt-1">{monthsServed} months served</div>
            </div>
          </div>
        </div>

        {monthsServed < 3 && (
          <div className="p-4 rounded-xl border flex gap-3" style={{ backgroundColor: 'rgba(var(--brand-rgb), 0.05)', borderColor: 'rgba(var(--brand-rgb), 0.3)' }}>
            <span className="text-xl">⚠️</span>
            <p className="text-sm font-medium" style={{ color: 'rgb(var(--brand))' }}>
              Requirement: You have served {monthsServed} months. Route transfers usually require a 3-month minimum commitment. Admin discretion applies.
            </p>
          </div>
        )}

        <div className="p-6 rounded-xl border bg-[rgb(var(--surface))] shadow-sm" style={{ borderColor: 'rgb(var(--border))' }}>
          <h2 className="text-xl font-bold mb-2">Request Transfer</h2>
          <p style={{ color: 'rgb(var(--muted))' }} className="mb-6">
            If you wish to transfer to a different route, you can submit a transfer request for review.
          </p>
          <button
            onClick={handleRequestTransfer}
            className="btn-primary px-8 py-3 rounded-xl font-bold shadow-lg"
          >
            Request Transfer
          </button>
        </div>
      </div>
    );
  };

  return (
    <DriverLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-6xl mx-auto">
        {(noticeMsg || errorMsg) && (
          <div className="mb-6 animate-fadeIn">
            {noticeMsg && (
              <div className="px-6 py-4 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg flex items-center justify-between">
                <span>{noticeMsg}</span>
                <button onClick={() => setNoticeMsg('')} className="p-1 hover:bg-emerald-500 rounded">✕</button>
              </div>
            )}
            {errorMsg && (
              <div className="px-6 py-4 rounded-xl bg-rose-600 text-white font-semibold shadow-lg flex items-center justify-between">
                <span>{errorMsg}</span>
                <button onClick={() => setErrorMsg('')} className="p-1 hover:bg-rose-500 rounded">✕</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'verification' && renderVerificationTab()}
        {activeTab === 'routes' && renderRoutesTab()}
        {activeTab === 'job' && renderActiveJobTab()}
        {activeTab === 'assigned' && renderAssignedRouteTab()}

        {/* Transfer Confirmation Modal */}
        {confirmTransferMsg && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100]">
            <div className="bg-[rgb(var(--surface))] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-[rgb(var(--border))]">
              <div className="text-center">
                <div className="w-16 h-16 bg-[rgba(var(--brand-rgb),0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl text-[rgb(var(--brand))]">⚖️</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Confirm Request</h3>
                <p style={{ color: 'rgb(var(--muted))' }} className="mb-8 leading-relaxed">
                  {confirmTransferMsg}
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setConfirmTransferMsg('');
                      setShowTransferModal(true);
                    }}
                    className="btn-primary w-full py-3 rounded-xl font-bold"
                  >
                    Yes, proceed anyway
                  </button>
                  <button
                    onClick={() => setConfirmTransferMsg('')}
                    className="w-full py-3 rounded-xl font-bold border hover:bg-[rgb(var(--bg))]"
                    style={{ borderColor: 'rgb(var(--border))' }}
                  >
                    No, stay on current route
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100]">
            <div className="bg-[rgb(var(--surface))] rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-[rgb(var(--border))] shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Select Target Route</h2>
                <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-[rgb(var(--bg))] rounded-lg">✕</button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'rgb(var(--muted))' }}>Available Routes</label>
                <div className="grid gap-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                  {routes.filter(r => r._id !== currentRoute?._id).map((route) => (
                    <div
                      key={route._id}
                      onClick={() => setSelectedTransferRoute(route)}
                      className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${selectedTransferRoute?._id === route._id
                          ? 'border-[rgb(var(--brand))] bg-[rgba(var(--brand-rgb),0.05)]'
                          : 'border-[rgb(var(--border))] hover:border-[rgba(var(--brand-rgb),0.2)]'
                        }`}
                    >
                      <div className="font-bold text-lg">{route.name}</div>
                      <div className="text-sm font-medium mt-1" style={{ color: 'rgb(var(--brand))' }}>
                        Fare: {route.fare} ETB | Drivers: {route.activeDriverCount || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'rgb(var(--muted))' }}>Reason for Transfer</label>
                <textarea
                  placeholder="Explain why you wish to change routes..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="input-base min-h-[120px] resize-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSubmitTransfer}
                  disabled={!selectedTransferRoute || !transferReason.trim()}
                  className="btn-primary flex-1 py-4 rounded-xl font-bold shadow-lg"
                >
                  Submit Request
                </button>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="px-8 py-4 rounded-xl font-bold border hover:bg-[rgb(var(--bg))]"
                  style={{ borderColor: 'rgb(var(--border))' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Car Route Application Modal */}
        {showCarRouteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100]">
            <div className="bg-[rgb(var(--surface))] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-[rgb(var(--border))]">
              <h3 className="text-2xl font-bold mb-4">Apply for Route Permit</h3>
              <p className="mb-6 leading-relaxed" style={{ color: 'rgb(var(--muted))' }}>
                Requesting a fixed route for: <strong>{driverStatus?.activeJob?.carId?.plateNumber}</strong>
              </p>

              <form onSubmit={handleCarRouteSubmit}>
                <div className="mb-8">
                  <label className="block mb-3 font-bold uppercase tracking-wider text-xs" style={{ color: 'rgb(var(--muted))' }}>Choose a Route</label>
                  <select
                    className="input-base py-3"
                    value={selectedCarRoute}
                    onChange={(e) => setSelectedCarRoute(e.target.value)}
                    required
                  >
                    <option value="">-- Select Destination --</option>
                    {routes.map(r => (
                      <option key={r._id} value={r._id}>
                        {r.name} ({r.fare} ETB)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={carRouteApplying}
                    className="btn-primary flex-1 py-3 rounded-xl font-bold shadow-lg"
                  >
                    {carRouteApplying ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCarRouteModal(false)}
                    className="px-6 py-3 border rounded-xl font-bold hover:bg-[rgb(var(--bg))]"
                    style={{ borderColor: 'rgb(var(--border))' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DriverLayout>
  );
};

export default DriverDashboard;
