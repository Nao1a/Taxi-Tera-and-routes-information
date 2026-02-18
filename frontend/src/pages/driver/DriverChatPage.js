import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiSearch } from 'react-icons/fi';
import hireService from '../../services/hireService';
import ChatWindow from '../../components/chat/ChatWindow';

const DriverChatPage = () => {
    const [applications, setApplications] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadApps();
    }, []);

    const loadApps = async () => {
        try {
            const res = await hireService.getMyApplications();
            // We want to chat for applications that are 'hired', 'applied', 'chatting', 'negotiating'
            // Filter out 'rejected' if desired, but maybe keep them for history.
            // For now, keep everything or filter roughly.
            setApplications(res.data);
            
            // Auto-select if passed in nav state or just first one logic could go here
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Filter conversations
    const filteredApps = applications.filter(app => {
        // For driver, the other party is the Owner (app.ownerId)
        // or specifically the car owner.
        // Let's check the population in backend `getMyApplications`.
        // It populates 'carId ownerId'.
        const ownerName = app.ownerId?.username || "Unknown Owner";
        const plate = app.carId?.plateNumber || "";
        return ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               plate.includes(searchTerm);
    });

    const getActiveChatName = () => {
        const active = applications.find(a => a._id === activeChat);
        return active ? active.ownerId?.username : "Chat";
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
                {/* Conversations List Sidebar */}
                <div className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Messages</h2>
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-3 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Search chats..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                             <div className="p-4 text-center text-gray-500">Loading chats...</div>
                        ) : filteredApps.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">No conversations found</div>
                        ) : (
                            filteredApps.map(app => (
                                <div 
                                    key={app._id}
                                    onClick={() => setActiveChat(app._id)}
                                    className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeChat === app._id ? 'bg-blue-50 dark:bg-gray-700' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {app.ownerId?.username || "Car Owner"}
                                        </h3>
                                        <span className="text-xs text-gray-500">
                                            {new Date(app.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                        Car: {app.carId?.plateNumber} • {app.status}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                    {activeChat ? (
                        <>
                            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center shadow-sm">
                                <button 
                                    onClick={() => setActiveChat(null)}
                                    className="md:hidden mr-3 p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                </button>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{getActiveChatName()}</h3>
                                    <div className="flex items-center text-xs text-green-500">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                        Details about the job
                                    </div>
                                </div>
                            </div>
                            <ChatWindow 
                                requestId={activeChat} 
                                isPopup={false}
                                otherPartyName={getActiveChatName()}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <FiMessageSquare className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg">Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverChatPage;
