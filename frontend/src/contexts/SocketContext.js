import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user && !socket) {
      // Connect to the socket server
      // Adjust URL if needed based on environment
      const newSocket = io('http://localhost:5000', {
        query: { userId: user._id }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        // Join the user to their specific room (usually their user ID) for private messages
        newSocket.emit('join_chat', user._id);
      });

      setSocket(newSocket);
    } else if (!user && socket) {
      // Disconnect if user logs out
      socket.disconnect();
      setSocket(null);
    }

    return () => {
      if (socket) {
        // We generally don't want to disconnect on every re-render, 
        // but we should on unmount of the provider or user change.
        // For now, let's keep it persistent unless user changes.
      }
    };
  }, [user, socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
