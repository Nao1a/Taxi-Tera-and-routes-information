import React, { useState, useEffect } from 'react';
import ownerService from '../../services/ownerService';
import hireService from '../../services/hireService'; // Imported for making offers
import ChatWindow from '../../components/chat/ChatWindow';

const OwnerApplicationsPage = () => {
    const [applications, setApplications] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [counterAppId, setCounterAppId] = useState(null);
    const [counterAmount, setCounterAmount] = useState('');

    useEffect(() => {
        loadApps();
    }, []);

    const loadApps = async () => {
        try {
            const res = await ownerService.getOwnerApplications();
            setApplications(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleHire = async (id) => {
        if (!window.confirm("Are you sure you want to hire this driver? This marks the car as Hired.")) return;
        try {
            await ownerService.updateApplicationStatus(id, 'hired');
            loadApps();
        } catch (error) {
            console.error(error);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Reject this application?")) return;
        try {
            await ownerService.updateApplicationStatus(id, 'rejected');
            loadApps();
        } catch (error) {
            console.error(error);
        }
    };

    const handleCounterOffer = async (appId) => {
        try {
            await hireService.makeOffer(appId, counterAmount);
            alert("Counter offer sent!");
            setCounterAppId(null);
            loadApps();
        } catch (error) {
            console.error(error);
            alert("Failed to send counter offer");
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Applications & Hires</h1>
            
            <div className="space-y-4">
                {applications.map(app => (
                    <div key={app._id} className={`p-5 rounded-lg shadow border flex flex-col md:flex-row justify-between gap-4 ${
                        app.status === 'hired' ? 'bg-green-50 border-green-200' : 'bg-[rgb(var(--surface))] border-[rgb(var(--border))]'
                    }`}>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{app.driverId.username}</h3>
                                    <p className="text-sm text-gray-500">{app.driverId.email}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                                        app.status === 'hired' ? 'bg-green-200 text-green-800' : 
                                        app.status === 'chatting' ? 'bg-blue-100 text-blue-800' : 
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {app.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div>
                                    <span className="text-gray-500 block">Car:</span>
                                    <span className="font-medium">{app.carId.make} {app.carId.model}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Plate:</span>
                                    <span className="font-medium">{app.carId.plateNumber}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Experience:</span>
                                    <span className="font-medium">{app.experienceYears ? `${app.experienceYears} Years` : 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Current Offer:</span>
                                    <span className="font-bold text-lg text-[rgb(var(--brand))]">{app.proposedGebi} ETB</span>
                                </div>
                            </div>

                            {app.notes && (
                                <div className="mt-3 bg-gray-50 p-2 rounded text-sm text-gray-600 italic">
                                    "{app.notes}"
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4 min-w-[150px]">
                            {app.status !== 'hired' && app.status !== 'rejected' && (
                                <>
                                    {counterAppId === app._id ? (
                                        <div className="bg-gray-100 p-2 rounded">
                                            <input 
                                                type="number" 
                                                className="w-full mb-2 p-1 border rounded"
                                                placeholder="Amount"
                                                value={counterAmount}
                                                onChange={(e) => setCounterAmount(e.target.value)}
                                            />
                                            <div className="flex gap-1">
                                                <button onClick={() => handleCounterOffer(app._id)} className="bg-green-500 text-white text-xs px-2 py-1 rounded">Send</button>
                                                <button onClick={() => setCounterAppId(null)} className="bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                setCounterAppId(app._id);
                                                setCounterAmount(app.proposedGebi);
                                            }}
                                            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                                        >
                                            Haggle / Counter
                                        </button>
                                    )}

                                    <button 
                                        onClick={() => setActiveChat(app._id)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                    >
                                        Chat
                                    </button>
                                    <button 
                                        onClick={() => handleHire(app._id)}
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold shadow-sm"
                                    >
                                        Hire Driver
                                    </button>
                                    <button 
                                        onClick={() => handleReject(app._id)}
                                        className="px-4 py-1 text-red-500 hover:text-red-700 text-sm border border-transparent hover:border-red-200 rounded"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            
                            {app.status === 'hired' && (
                                <button onClick={() => setActiveChat(app._id)} className="w-full bg-blue-100 text-blue-700 py-2 rounded">
                                    Message Driver
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                
                {applications.length === 0 && (
                     <div className="text-center py-10 text-gray-400 bg-gray-50 rounded border border-dashed border-gray-200">
                        <p>No active applications found.</p>
                        <p className="text-sm mt-1">Applications for hired cars are hidden unless they are the hired driver.</p>
                    </div>
                )}
            </div>

            {activeChat && (
                <>
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-30 z-40"
                        onClick={() => setActiveChat(null)}
                    />
                    <ChatWindow 
                        requestId={activeChat} 
                        onClose={() => setActiveChat(null)} 
                    />
                </>
            )}
        </div>
    );
};

export default OwnerApplicationsPage;
