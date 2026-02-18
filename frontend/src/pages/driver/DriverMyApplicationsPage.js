import React, { useState, useEffect } from 'react';
import hireService from '../../services/hireService';
import * as driverService from '../../services/driverService';
import { createSubmission } from '../../services/submissionService';
import ChatWindow from '../../components/chat/ChatWindow';

const DriverMyApplicationsPage = () => {
    const [apps, setApps] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [editingOffer, setEditingOffer] = useState(null); // ID of the app being edited
    const [newOffer, setNewOffer] = useState('');
    
    // Route Application State
    const [routes, setRoutes] = useState([]);
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [selectedRouteId, setSelectedRouteId] = useState('');
    const [applyingApp, setApplyingApp] = useState(null);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        loadApps();
        loadRoutes();
    }, []);

    const loadApps = async () => {
        try {
            const res = await hireService.getMyApplications();
            setApps(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const loadRoutes = async () => {
        try {
            const res = await driverService.getAvailableRoutes();
            setRoutes(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateOffer = async (appId) => {
        try {
            await hireService.makeOffer(appId, newOffer);
            alert("Offer updated!");
            setEditingOffer(null);
            loadApps();
        } catch (error) {
            console.error(error);
            alert("Failed to update offer");
        }
    };

    const openRouteModal = (app) => {
        setApplyingApp(app);
        setShowRouteModal(true);
    };

    const handleRouteSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRouteId || !applyingApp) return;

        setApplying(true);
        try {
            // Check if carId is populated object or string (it is populated in getMyApplications)
            const carId = applyingApp.carId._id || applyingApp.carId;
            
            await createSubmission('route_application', {
                carId: carId,
                targetRouteId: selectedRouteId
            });
            alert("Route application submitted successfully!");
            setShowRouteModal(false);
            setSelectedRouteId('');
            setApplyingApp(null);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Failed to submit application");
        } finally {
            setApplying(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">My Applications</h1>
            <div className="space-y-4">
                {apps.map(app => (
                    <div key={app._id} className="bg-[rgb(var(--surface))] p-4 rounded-lg shadow border border-[rgb(var(--border))] flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                             <h3 className="font-bold text-lg">{app.carId?.make} {app.carId?.model}</h3>
                             <p className="text-sm">Owner: <span className="font-medium">{app.ownerId?.username}</span></p>
                             
                             <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                                <p>Original Gebi: <span className="text-gray-600">{app.carId?.gebiAmount} ETB</span></p>
                                <p className="mt-1">
                                    Your Status: <span className={`font-bold ${
                                        app.status === 'hired' ? 'text-green-600' : 
                                        app.status === 'rejected' ? 'text-red-500' : 'text-blue-500'
                                    }`}>{app.status.toUpperCase()}</span>
                                </p>
                             </div>
                             
                             {/* Route Warning for Hired Drivers */}
                             {app.status === 'hired' && !app.carId?.routeId && (
                                 <div className="mt-2 bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded text-sm flex items-center justify-between">
                                     <span>⚠️ This car has no assigned route.</span>
                                     <button 
                                         onClick={() => openRouteModal(app)}
                                         className="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700"
                                     >
                                         Apply Permit
                                     </button>
                                 </div>
                             )}

                             {app.offerHistory && app.offerHistory.length > 0 && (
                                 <div className="mt-2 text-xs text-gray-500">
                                     Last Offer: {app.offerHistory[app.offerHistory.length-1].amount} ETB 
                                     (by {app.offerHistory[app.offerHistory.length-1].by})
                                 </div>
                             )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                             <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded border border-yellow-100">
                                <span className="text-sm text-gray-700">Current Offer:</span>
                                {editingOffer === app._id ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            className="w-24 border rounded px-1 py-0.5"
                                            value={newOffer}
                                            onChange={(e) => setNewOffer(e.target.value)}
                                        />
                                        <button onClick={() => handleUpdateOffer(app._id)} className="text-green-600 font-bold hover:underline">Save</button>
                                        <button onClick={() => setEditingOffer(null)} className="text-gray-400 hover:text-gray-600">Cancel</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-xl text-[rgb(var(--brand))]">{app.proposedGebi} ETB</span>
                                        {app.status !== 'hired' && app.status !== 'rejected' && (
                                            <button 
                                                onClick={() => {
                                                    setEditingOffer(app._id);
                                                    setNewOffer(app.proposedGebi);
                                                }}
                                                className="text-xs text-blue-500 underline hover:text-blue-700"
                                            >
                                                Improve
                                            </button>
                                        )}
                                    </div>
                                )}
                             </div>

                             {app.status !== 'rejected' && (
                                 <button 
                                    onClick={() => setActiveChat(app._id)}
                                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full md:w-auto"
                                 >
                                    Message Owner
                                 </button>
                             )}
                        </div>
                    </div>
                ))}
                 {apps.length === 0 && <p className="text-gray-500 italic">You haven't applied to any jobs yet.</p>}
            </div>

            {/* Route Application Modal */}
            {showRouteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full shadow-xl overflow-hidden">
                        <div className="p-4 bg-[rgb(var(--brand))] text-white">
                            <h3 className="text-lg font-bold">Apply for Route Permit</h3>
                        </div>
                        <div className="p-6">
                            <p className="mb-4 text-sm text-gray-600">
                                Select a route for <strong>{applyingApp?.carId?.plateNumber}</strong>. 
                                This request will be submitted to admin for approval.
                            </p>
                            
                            <form onSubmit={handleRouteSubmit}>
                                <div className="mb-4">
                                    <label className="block mb-2 font-medium text-sm">Select Route</label>
                                    <select 
                                        className="w-full p-2 border rounded"
                                        value={selectedRouteId}
                                        onChange={(e) => setSelectedRouteId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Choose a Route --</option>
                                        {routes.map(r => (
                                            <option key={r._id} value={r._id}>
                                                {r.name} ({r.fare} ETB)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="flex gap-3 justify-end mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowRouteModal(false)}
                                        className="px-4 py-2 bg-gray-100 rounded text-gray-700 hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={applying}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {applying ? 'Submitting...' : 'Submit Application'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {activeChat && (

                <ChatWindow 
                    requestId={activeChat} 
                    onClose={() => setActiveChat(null)} 
                />
            )}
        </div>
    );
};

export default DriverMyApplicationsPage;
