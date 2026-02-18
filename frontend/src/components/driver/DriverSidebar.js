import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDriverSidebar } from '../../contexts/DriverSidebarContext';
import {
  FiHome,
  FiBriefcase,
  FiFileText,
  FiShield,
  FiMenu,
  FiX,
  FiMessageSquare,
  FiLogOut
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import hireService from '../../services/hireService';

const DriverSidebar = () => {
  const { isCollapsed, toggleSidebar } = useDriverSidebar();
  const { logout } = useAuth();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();

    if (socket) {
      socket.on('new_message', () => {
        fetchUnreadCount();
      });
    }

    return () => {
      if (socket) socket.off('new_message');
    }
  }, [socket]);

  const fetchUnreadCount = async () => {
    try {
      const res = await hireService.getUnreadCount();
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  }

  const menuItems = [
    {
      path: '/driver/dashboard',
      label: 'Dashboard',
      icon: FiHome
    },
    {
      path: '/driver/jobs',
      label: 'Find Jobs',
      icon: FiBriefcase
    },
    {
      path: '/driver/applications',
      label: 'My Applications',
      icon: FiFileText
    },
    {
      path: '/driver/chat',
      label: 'Chat',
      icon: FiMessageSquare,
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      path: '/driver/verification',
      label: 'Verification',
      icon: FiShield
    }
  ];

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[rgb(var(--surface))] border-r border-[rgb(var(--border))] transition-all duration-300 z-40 ${isCollapsed ? 'w-16' : 'w-64'
        }`}
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className={`hidden md:flex items-center ${isCollapsed ? 'justify-center' : 'justify-end'} p-2 border-b border-[rgb(var(--border))]`}>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-[rgba(var(--brand-rgb),0.08)] text-[rgb(var(--muted))] transition-colors"
          >
            {isCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-2 py-3 rounded-lg transition-colors relative ${isActive
                      ? 'bg-[rgb(var(--brand))] text-white'
                      : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--bg))]'
                    } ${isCollapsed ? 'justify-center' : ''}`
                  }
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon size={22} className={isCollapsed ? '' : 'mr-3'} />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}

                  {!isCollapsed && item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {isCollapsed && item.badge && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default DriverSidebar;

