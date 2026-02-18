import React, { useState, useEffect } from 'react';
import hireService from '../../services/hireService';

const DriverJobsPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [selectedJob, setSelectedJob] = useState(null);
    const [offer, setOffer] = useState('');
    const [experience, setExperience] = useState('');
    const [notes, setNotes] = useState('');
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            const res = await hireService.getAvailableJobs();
            setJobs(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openApplyModal = (car) => {
        setSelectedJob(car);
        setOffer(car.gebiAmount);
        setExperience('');
        setNotes('');
    };

    const closeApplyModal = () => {
        setSelectedJob(null);
        setApplying(false);
    };

    const submitApplication = async (e) => {
        e.preventDefault();
        try {
            setApplying(true);
            await hireService.applyForJob(selectedJob._id, offer, experience, notes);
            alert("Application sent successfully!");
            closeApplyModal();
            loadJobs(); // Refresh
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Failed to apply");
            setApplying(false);
        }
    };

    if (loading) return <div>Loading jobs...</div>;

    return (
        <div className="relative">
            <h1 className="text-3xl font-bold mb-6">Find a Taxi</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map(car => (
                    <div key={car._id} className="bg-[rgb(var(--surface))] p-5 rounded-lg shadow border border-[rgb(var(--border))] hover:shadow-lg transition">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold">{car.make} {car.model}</h3>
                                <p className="text-sm text-gray-500">{car.plateNumber}</p>
                            </div>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Available</span>
                        </div>

                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Owner:</span>
                                <span className="font-medium">{car.ownerId?.username || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Gebi:</span>
                                <span className="font-bold text-lg text-[rgb(var(--brand))]">{car.gebiAmount} ETB</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Frequency:</span>
                                <span>{car.paymentFrequency}</span>
                            </div>

                            {car.routeId && (
                                <div className="flex justify-between items-center text-sm border-t border-dashed border-gray-200 mt-2 pt-2">
                                    <span className="text-gray-500">Route:</span>
                                    <span className="font-medium" style={{ color: 'rgb(var(--brand))' }}>
                                        {car.routeId.fromTera?.name} - {car.routeId.toTera?.name}
                                    </span>
                                </div>
                            )}

                            {car.conditions && (
                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-2">
                                    "{car.conditions}"
                                </div>
                            )}
                        </div>

                        {car.hasApplied ? (
                            <button
                                disabled
                                className={`w-full mt-4 py-2 font-medium rounded cursor-not-allowed ${car.applicationStatus === 'rejected'
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-gray-200 text-gray-500'
                                    }`}
                            >
                                {car.applicationStatus === 'applied' ? 'Applied' :
                                    car.applicationStatus === 'rejected' ? 'Application Rejected' :
                                        car.applicationStatus === 'chatting' ? 'Chatting' :
                                            car.applicationStatus === 'hired' ? 'Hired' : 'Applied'}
                            </button>
                        ) : (
                            <button
                                className="w-full mt-4 py-2 bg-[rgb(var(--brand))] text-white rounded hover:opacity-90 font-medium"
                            >
                                Apply Now
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {jobs.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    No available cars found at the moment.
                </div>
            )}

            {/* Application Modal */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="bg-[rgb(var(--brand))] p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg">Apply for {selectedJob.make} {selectedJob.model}</h3>
                            <button onClick={closeApplyModal} className="text-white hover:text-gray-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={submitApplication} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Daily Gebi Offer (ETB)
                                </label>
                                <input
                                    type="number"
                                    required
                                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-[rgb(var(--brand))]"
                                    value={offer}
                                    onChange={(e) => setOffer(e.target.value)}
                                    placeholder={selectedJob.gebiAmount}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Original Ask: {selectedJob.gebiAmount} ETB. You can negotiate here.
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Taxi Experience (Years)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="50"
                                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-[rgb(var(--brand))]"
                                    value={experience}
                                    onChange={(e) => setExperience(e.target.value)}
                                    placeholder="e.g. 5"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Additional Notes (Optional)
                                </label>
                                <textarea
                                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-[rgb(var(--brand))]"
                                    rows="3"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Tell the owner why you are the best fit..."
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeApplyModal}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={applying}
                                    className="px-4 py-2 bg-[rgb(var(--brand))] text-white rounded hover:opacity-90 disabled:opacity-50"
                                >
                                    {applying ? 'Sending...' : 'Send Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverJobsPage;
