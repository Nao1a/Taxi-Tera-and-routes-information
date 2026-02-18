import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiSearch } from 'react-icons/fi';
import ownerService from '../../services/ownerService';
import ChatWindow from '../../components/chat/ChatWindow';

const OwnerChatPage = () => {
    const [applications, setApplications] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadApps();
    }, []);

    const loadApps = async () => {
        try {
            const res = await ownerService.getOwnerApplications();
            setApplications(res.data);
            if (res.data.length > 0) {
                 // Optionally auto-select
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Filter conversations
    const filteredApps = applications.filter(app => 
        app.driverId.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.carId.plateNumber.includes(searchTerm)
    );

    const getActiveChatName = () => {
        const active = applications.find(a => a._id === activeChat);
        return active ? active.driverId.username : "Chat";
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
                {/* Conversations List Sidebar */}
                <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Messages</h2>
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-3 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-[rgb(var(--brand))]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500 text-sm">Loading chats...</div>
                        ) : (
                            <>
                                {filteredApps.length === 0 && (
                                    <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                                        <FiMessageSquare size={32} className="mb-2 opacity-30" />
                                        <p className="text-sm">No conversations found</p>
                                    </div>
                                )}
                                {filteredApps.map(app => (
                                    <div 
                                        key={app._id}
                                        onClick={() => setActiveChat(app._id)}
                                        className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                            activeChat === app._id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-[rgb(var(--brand))]' : 'border-l-4 border-l-transparent'
                                        }`}
                                    >
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className={`font-semibold text-sm ${activeChat === app._id ? 'text-[rgb(var(--brand))]' : 'text-gray-800 dark:text-gray-200'}`}>
                                                {app.driverId.username}
                                            </h3>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                                app.status === 'hired' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>{app.status}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {app.carId.make} {app.carId.model} • {app.carId.plateNumber}
                                        </p>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex flex-col">
                    {activeChat ? (
                        <ChatWindow 
                            requestId={activeChat} 
                            isPopup={false} 
                            otherPartyName={getActiveChatName()}
                            onClose={() => setActiveChat(null)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                             <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <FiMessageSquare size={32} className="text-gray-400" />
                             </div>
                             <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Your Messages</h3>
                             <p className="text-sm mt-2">Select a conversation from the left to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OwnerChatPage;
