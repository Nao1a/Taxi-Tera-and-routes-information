import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { FiSend, FiX, FiMessageSquare } from 'react-icons/fi';
import hireService from '../../services/hireService';
import authService from '../../services/authService';

// Determine Socket URL
const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ChatWindow = ({ requestId, onClose, isPopup = true, otherPartyName = "Chat" }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const scrollRef = useRef();
  
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await hireService.getChatMessages(requestId);
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    // 1. Load History
    loadHistory();

    // 2. Connect Socket
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // 3. Join Room
    newSocket.emit("join_chat", { room: requestId });

    // 4. Listen
    newSocket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => newSocket.close();
  }, [requestId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Save to DB
      const res = await hireService.sendMessage(requestId, newMessage);
      const msgData = res.data;

      // Emit to Socket
      socket.emit("send_message", {
        room: requestId,
        ...msgData
      });

      setMessages((prev) => [...prev, msgData]);
      setNewMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  const containerClasses = isPopup 
    ? "fixed bottom-4 right-4 w-96 h-[500px] bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col z-50 overflow-hidden font-sans"
    : "w-full h-full bg-white dark:bg-gray-800 flex flex-col font-sans"; // Remove border/rounding as it's embedded

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center">
            {isPopup && <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>}
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{otherPartyName}</h3>
        </div>
        {isPopup && (
            <button 
                onClick={onClose} 
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            >
                <FiX size={20} />
            </button>
        )}
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FiMessageSquare size={48} className="mb-2 opacity-20" />
                <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
        )}
        
        {messages.map((msg, idx) => {
           const currentUserId = currentUser?._id;
           const msgSenderId = msg.senderId?._id || msg.senderId;
           const isMe = msgSenderId === currentUserId;
           
           return (
             <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
               <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                   {/* Bubble */}
                   <div 
                        className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                            isMe 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                        }`}
                    >
                     {msg.content}
                   </div>
                   {/* Metadata */}
                   <div className="flex items-center mt-1 space-x-2">
                       <span className="text-[10px] text-gray-400">
                           {formatTime(msg.createdAt)}
                       </span>
                   </div>
               </div>
             </div>
           );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-1.5 rounded-full border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[rgb(var(--brand))] focus-within:border-transparent transition-all">
            <input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-4 py-2 bg-transparent border-none focus:outline-none text-gray-800 dark:text-gray-100 text-sm placeholder-gray-400"
              placeholder="Type a message..."
            />
            <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="p-2 bg-[rgb(var(--brand))] text-white rounded-full hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
            >
                <FiSend size={16} className={newMessage.trim() ? "ml-0.5" : ""} />
            </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
