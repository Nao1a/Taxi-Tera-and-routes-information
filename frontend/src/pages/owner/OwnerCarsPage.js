import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ownerService from '../../services/ownerService';
import { createSubmission } from '../../services/submissionService';

const OwnerCarsPage = () => {
    const { user } = useAuth();
    const kycStatus = user?.kycStatus || 'not_submitted';
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const location = useLocation();

    // Form State
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        plateNumber: '',
        gebiAmount: '',
        paymentFrequency: 'Weekly',
        conditions: ''
    });
    const [file, setFile] = useState(null);
    const [editingId, setEditingId] = useState(null); // Track which car is being edited

    // Route Application State
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [routes, setRoutes] = useState([]);
    const [selectedCar, setSelectedCar] = useState(null);
    const [selectedRouteId, setSelectedRouteId] = useState('');
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        fetchCars();
    }, []);

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        if (query.get('action') === 'add') {
            setShowForm(true);
        }
    }, [location]);

    const fetchCars = async () => {
        try {
            const res = await ownerService.getMyCars();
            setCars(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            if (file) {
                data.append('ownershipDoc', file);
            }

            if (editingId) {
                await ownerService.updateCar(editingId, data);
                alert("Car updated successfully!");
            } else {
                if (!file) {
                    alert("Ownership Document is required for new cars");
                    return;
                }
                await ownerService.registerCar(data);
                alert("Car registered successfully!");
            }

            setShowForm(false);
            setEditingId(null);
            fetchCars(); // Refresh list

            // Reset form
            setFormData({
                make: '',
                model: '',
                plateNumber: '',
                gebiAmount: '',
                paymentFrequency: 'Weekly',
                conditions: ''
            });
            setFile(null);
        } catch (error) {
            console.error("Failed to save car", error);
            const errMsg = error.response?.data?.message || "Failed to save car";
            alert(errMsg);
        }
    };

    const handleEdit = (car) => {
        setFormData({
            make: car.make,
            model: car.model,
            plateNumber: car.plateNumber,
            gebiAmount: car.gebiAmount,
            paymentFrequency: car.paymentFrequency,
            conditions: car.conditions || ''
        });
        setEditingId(car._id);
        setShowForm(true);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openRouteModal = async (car) => {
        setSelectedCar(car);
        setShowRouteModal(true);
        if (routes.length === 0) {
            try {
                const res = await ownerService.getAllRoutes();
                setRoutes(res.data);
            } catch (err) {
                console.error("Failed to load routes", err);
                alert("Could not load routes");
            }
        }
    };

    const handleRouteSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRouteId || !selectedCar) return;

        setApplying(true);
        try {
            await createSubmission('route_application', {
                carId: selectedCar._id,
                targetRouteId: selectedRouteId
            });
            alert("Application submitted successfully!");
            setShowRouteModal(false);
            setSelectedRouteId('');
            setSelectedCar(null);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Failed to submit application");
        } finally {
            setApplying(false);
        }
    };

    const getRouteName = (route) => {
        if (!route) return 'N/A';
        const from = route.fromTera?.name || 'Unknown';
        const to = route.toTera?.name || 'Unknown';
        return `${from} - ${to}`;
    };

    const handleToggleStatus = async (car) => {
        if (car.status === 'available') {
            if (!window.confirm("Unlist this car? It will be hidden from drivers.")) return;
        }
        try {
            await ownerService.toggleCarStatus(car._id);
            fetchCars();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Failed to update status");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Cars</h1>
                <button
                    onClick={() => {
                        if (kycStatus !== 'verified') {
                            alert("Please complete your account verification to add cars.");
                            return;
                        }
                        setShowForm(!showForm)
                    }}
                    className={`px-4 py-2 text-white rounded shadow transition ${kycStatus !== 'verified' ? 'bg-gray-400 cursor-not-allowed' : 'bg-[rgb(var(--brand))] hover:opacity-90'}`}
                    disabled={kycStatus !== 'verified'}
                    title={kycStatus !== 'verified' ? "Complete verification first" : ""}
                >
                    {showForm ? 'Cancel' : '+ Add New Car'}
                </button>
            </div>

            {showForm && (
                <div className="bg-[rgb(var(--surface))] p-6 rounded-lg shadow-md border border-[rgb(var(--border))] mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">{editingId ? 'Edit Car Details' : 'Register New Car'}</h2>
                        {editingId && <button onClick={() => { setEditingId(null); setShowForm(false); }} className="text-gray-500">Cancel</button>}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="make" placeholder="Car Make (e.g. Toyota)" value={formData.make} onChange={handleChange} required className="p-2 border rounded bg-[rgb(var(--bg))]" />
                            <input name="model" placeholder="Car Model (e.g. Corolla)" value={formData.model} onChange={handleChange} required className="p-2 border rounded bg-[rgb(var(--bg))]" />
                            <input name="plateNumber" placeholder="Plate Number" value={formData.plateNumber} onChange={handleChange} required className="p-2 border rounded bg-[rgb(var(--bg))]" />
                            <input name="gebiAmount" type="number" placeholder="Gebi Amount (Rental Price)" value={formData.gebiAmount} onChange={handleChange} required className="p-2 border rounded bg-[rgb(var(--bg))]" />
                            <select name="paymentFrequency" value={formData.paymentFrequency} onChange={handleChange} className="p-2 border rounded bg-[rgb(var(--bg))]">
                                <option>Weekly</option>
                                <option>Bi-Weekly</option>
                                <option>Monthly</option>
                            </select>
                        </div>
                        <textarea name="conditions" placeholder="Special Conditions (optional)" value={formData.conditions} onChange={handleChange} className="w-full p-2 border rounded bg-[rgb(var(--bg))]" />

                        <div>
                            <label className="block mb-2 text-sm font-medium">Ownership Proof (Libre) {editingId ? '(Optional if unchanged)' : '*'}</label>
                            <input type="file" onChange={handleFileChange} required={!editingId} accept="image/*,application/pdf" className="w-full" />
                        </div>

                        <button type="submit" className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold">
                            {editingId ? 'Update & Switch to Pending' : 'Submit for Review'}
                        </button>
                    </form>
                </div>
            )}

            {loading ? <p>Loading...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cars.map(car => (
                        <div key={car._id} className="bg-[rgb(var(--surface))] p-4 rounded-lg shadow border border-[rgb(var(--border))]">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{car.make} {car.model}</h3>
                                <div className="flex flex-col items-end">
                                    <span className={`px-2 py-1 text-xs rounded mb-1 ${car.status === 'available' ? 'bg-green-100 text-green-800' :
                                            car.status === 'hired' ? 'bg-emerald-100 text-emerald-800' :
                                                car.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                        }`}>{car.status.toUpperCase()}</span>
                                    {car.routeId && (
                                        <span className="text-xs bg-[rgba(var(--brand-rgb),0.1)] text-[rgb(var(--brand))] px-2 py-1 rounded">
                                            Route Assigned
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Rejection Reason Display */}
                            {car.status === 'rejected' && (
                                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                                    <strong>Rejection Reason:</strong> {car.rejectionReason || 'No reason provided.'}
                                    <p className="mt-1 text-xs">Please edit the details to fix the issues and submit again.</p>
                                </div>
                            )}

                            <p className="text-sm text-gray-500 mb-2">{car.plateNumber}</p>
                            <div className="text-sm font-medium mb-4">
                                {car.gebiAmount} ETB / {car.paymentFrequency}
                            </div>

                            <div className="mt-4 pt-4 border-t border-[rgb(var(--border))]">
                                {['available', 'maintenance'].includes(car.status) && (
                                    <button
                                        onClick={() => handleToggleStatus(car)}
                                        className={`w-full text-sm py-1.5 rounded mb-2 font-medium transition ${car.status === 'available'
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                                            }`}
                                    >
                                        {car.status === 'available' ? 'Unlist (Set to Maintenance)' : 'List for Hire'}
                                    </button>
                                )}

                                <p className="text-sm mb-2">
                                    <strong>Route:</strong> {car.routeId ? (
                                        <span className="text-[rgb(var(--brand))]">{getRouteName(car.routeId)}</span>
                                    ) : (
                                        <span className="text-gray-500 italic">None</span>
                                    )}
                                </p>

                                {car.status === 'rejected' ? (
                                    <button
                                        onClick={() => handleEdit(car)}
                                        className="w-full mt-2 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition"
                                    >
                                        Edit & Reapply
                                    </button>
                                ) : !car.routeId && (car.status === 'available' || car.status === 'hired') ? (
                                    <button
                                        onClick={() => openRouteModal(car)}
                                        className="w-full mt-2 py-1.5 bg-[rgb(var(--brand))] text-white text-sm rounded hover:opacity-90 transition"
                                    >
                                        Apply for Route
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ))}
                    {cars.length === 0 && <p className="text-center text-gray-500 col-span-3">No cars listed yet.</p>}
                </div>
            )}

            {/* Route Application Modal */}
            {showRouteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-[rgb(var(--surface))] p-6 rounded-lg max-w-md w-full shadow-xl">
                        <h3 className="text-xl font-bold mb-4">Apply for Route Permit</h3>
                        <p className="mb-4 text-sm text-gray-600">Select a route for <strong>{selectedCar?.plateNumber}</strong>. This request will be sent to admin for approval.</p>

                        <form onSubmit={handleRouteSubmit}>
                            <div className="mb-4">
                                <label className="block mb-2 font-medium">Select Route</label>
                                <select
                                    className="w-full p-2 border rounded bg-[rgb(var(--bg))]"
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

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowRouteModal(false)}
                                    className="px-4 py-2 border rounded hover:bg-gray-100 text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={applying}
                                    className="px-4 py-2 bg-[rgb(var(--brand))] text-white rounded hover:opacity-90 disabled:opacity-50"
                                >
                                    {applying ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerCarsPage;
