import React, { useState, useEffect } from 'react';
import adminService from '../../../services/adminService';
import PendingBadge from '../../../components/admin/PendingBadge';

const AdminCarRegistrations = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCar, setSelectedCar] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await adminService.getPendingCars();
            setCars(data);
        } catch (error) {
            console.error("Failed to load cars", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm("Approve this car? It will be visible to drivers.")) return;
        try {
            await adminService.approveCar(id);
            setCars(cars.filter(c => c._id !== id));
            if (selectedCar?._id === id) setSelectedCar(null);
        } catch (error) {
            console.error(error);
            alert("Failed to approve");
        }
    };

    const handleReject = async (id) => {
        if (!rejectReason) return alert("Please provide a rejection reason");
        try {
            await adminService.rejectCar(id, rejectReason);
            setCars(cars.filter(c => c._id !== id));
            setSelectedCar(null);
            setRejectReason("");
        } catch (error) {
            console.error(error);
            alert("Failed to reject");
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Pending Car Registrations</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List */}
                <div className="lg:col-span-1 space-y-4">
                    {loading ? <p>Loading...</p> : (
                        <>
                            {cars.length === 0 && <p className="text-gray-500">No pending cars.</p>}
                            {cars.map(car => (
                                <div 
                                    key={car._id} 
                                    onClick={() => setSelectedCar(car)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedCar?._id === car._id ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold">{car.make} {car.model}</h3>
                                        <PendingBadge />
                                    </div>
                                    <p className="text-sm text-gray-500">{car.plateNumber}</p>
                                    <p className="text-xs mt-2 text-gray-400">Owner: {car.ownerId?.email}</p>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Details */}
                <div className="lg:col-span-2">
                    {selectedCar ? (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold mb-4">{selectedCar.make} {selectedCar.model} ({selectedCar.plateNumber})</h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="label">Owner</p>
                                    <p className="font-medium">{selectedCar.ownerId?.username}</p>
                                    <p className="text-sm text-gray-500">{selectedCar.ownerId?.email}</p>
                                    <p className="text-sm text-gray-500">{selectedCar.ownerId?.phoneNumber}</p>
                                </div>
                                <div>
                                    <p className="label">Rental Terms</p>
                                    <p className="font-medium">{selectedCar.gebiAmount} ETB / {selectedCar.paymentFrequency}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="label mb-2">Ownership Document (Libre)</p>
                                {selectedCar.libreImage ? (
                                    <a href={selectedCar.libreImage} target="_blank" rel="noopener noreferrer">
                                        <img 
                                            src={selectedCar.libreImage} 
                                            alt="Libre" 
                                            className="max-w-full h-auto max-h-96 rounded border"
                                        />
                                    </a>
                                ) : (
                                    <p className="text-red-500">No document uploaded</p>
                                )}
                            </div>
                            
                            {selectedCar.conditions && (
                                <div className="mb-6">
                                    <p className="label">Special Conditions</p>
                                    <p className="text-sm bg-gray-50 p-2 rounded">{selectedCar.conditions}</p>
                                </div>
                            )}

                            <div className="flex flex-col gap-4 mt-8 pt-6 border-t">
                                <button 
                                    onClick={() => handleApprove(selectedCar._id)}
                                    className="w-full py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                                >
                                    Approve Registration
                                </button>
                                
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 p-2 border rounded"
                                        placeholder="Reason for rejection..."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    />
                                    <button 
                                        onClick={() => handleReject(selectedCar._id)}
                                        className="px-6 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed">
                            Select a car to review details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCarRegistrations;

const label = "text-xs font-semibold text-gray-500 uppercase tracking-wider";
