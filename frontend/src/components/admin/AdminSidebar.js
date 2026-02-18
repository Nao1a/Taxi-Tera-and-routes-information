import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAdminSidebar } from '../../contexts/AdminSidebarContext';
import {
  FiLayout,
  FiFileText,
  FiDatabase,
  FiUsers,
  FiBarChart2,
  FiChevronDown,
  FiChevronRight,
  FiMenu,
  FiX
} from 'react-icons/fi';

const AdminSidebar = () => {
  const { isCollapsed, toggleSidebar } = useAdminSidebar();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    submissions: true,
    dataSubmissions: true,
    driverSubmissions: true,
    manageData: false,
    userControl: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const menuItems = [
    {
      type: 'link',
      path: '/admin',
      label: 'Dashboard',
      icon: FiLayout
    },
    {
      type: 'section',
      key: 'submissions',
      label: 'Submissions',
      icon: FiFileText,
      children: [
        {
          type: 'section',
          key: 'dataSubmissions',
          label: 'Data Submissions',
          children: [
            { path: '/admin/submissions/teras', label: 'New Tera Submissions' },
            { path: '/admin/submissions/routes', label: 'New Route Submissions' },
            { path: '/admin/submissions/fares', label: 'Fare Updates' },
            { path: '/admin/submissions/conditions', label: 'Condition Updates' }
          ]
        },
        {
          type: 'section',
          key: 'driverSubmissions',
          label: 'User Verification',
          children: [
            { path: '/admin/submissions/driver-kyc', label: 'KYC Verification' },
            { path: '/admin/submissions/cars', label: 'Car Registrations' },
            { path: '/admin/submissions/route-applications', label: 'Route Applications' }
          ]
        }
      ]
    },
    {
      type: 'section',
      key: 'manageData',
      label: 'Manage Data',
      icon: FiDatabase,
      children: [
        { path: '/admin/manage/teras', label: 'Manage Teras' },
        { path: '/admin/manage/routes', label: 'Manage Routes' }
      ]
    },
    {
      type: 'section',
      key: 'userControl',
      label: 'User Control',
      icon: FiUsers,
      children: [
        { path: '/admin/users/general', label: 'User Management' },
        { path: '/admin/users/drivers', label: 'Driver Management' }
      ]
    },
    {
      type: 'link',
      path: '/admin/analytics',
      label: 'Analytics',
      icon: FiBarChart2
    }
  ];

  const renderMenuItem = (item, depth = 0) => {
    if (item.type === 'link') {
      const Icon = item.icon;
      return (
        <NavLink
          to={item.path}
          className={({ isActive }) =>
            `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${isActive
              ? 'bg-[rgb(var(--brand))] text-white shadow-lg shadow-[rgba(var(--brand-rgb),0.2)]'
              : 'text-[rgb(var(--text))] hover:bg-[rgba(var(--brand-rgb),0.08)]'
            }`
          }
          title={isCollapsed ? item.label : ''}
        >
          {Icon && <Icon className="flex-shrink-0" size={20} />}
          {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
        </NavLink>
      );
    }

    if (item.type === 'section') {
      const Icon = item.icon;
      const isExpanded = expandedSections[item.key];
      const hasActiveChild = item.children?.some(child =>
        child.path && isActive(child.path)
      );

      // When collapsed, show icon only with tooltip
      if (isCollapsed) {
        return (
          <div key={item.key} className="relative group">
            <button
              onClick={() => {
                // Expand sidebar first, then toggle section
                if (!isExpanded) {
                  toggleSidebar();
                  // Small delay to let sidebar expand before toggling section
                  setTimeout(() => toggleSection(item.key), 100);
                } else {
                  toggleSection(item.key);
                }
              }}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition-colors ${hasActiveChild
                ? 'bg-[rgba(var(--brand-rgb),0.1)] text-[rgb(var(--brand))]'
                : 'text-[rgb(var(--text))] hover:bg-[rgba(var(--brand-rgb),0.08)]'
                }`}
              title={item.label}
            >
              {Icon && <Icon className="flex-shrink-0" size={20} />}
            </button>
            {/* Tooltip for collapsed state */}
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none">
              {item.label}
            </div>
          </div>
        );
      }

      return (
        <div key={item.key}>
          <button
            onClick={() => toggleSection(item.key)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${hasActiveChild
              ? 'bg-[rgba(var(--brand-rgb),0.1)] text-[rgb(var(--brand))]'
              : 'text-[rgb(var(--text))] hover:bg-[rgba(var(--brand-rgb),0.08)]'
              }`}
          >
            <div className="flex items-center gap-3">
              {Icon && <Icon className="flex-shrink-0" size={20} />}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
          </button>
          {isExpanded && item.children && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map((child, idx) => (
                <div key={idx}>
                  {child.type === 'section' ? (
                    renderMenuItem(child, depth + 1)
                  ) : (
                    <NavLink
                      to={child.path}
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-lg text-sm transition-colors ${isActive
                          ? 'bg-[rgb(var(--brand))] text-white shadow-md'
                          : 'text-[rgb(var(--muted))] hover:bg-[rgba(var(--brand-rgb),0.08)] hover:text-[rgb(var(--text))]'
                        }`
                      }
                    >
                      {child.label}
                    </NavLink>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[rgb(var(--surface))] border-r border-[rgb(var(--border))] transition-all duration-300 z-40 ${isCollapsed ? 'w-16' : 'w-64'
        }`}
    >
      <div className="flex flex-col h-full">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-[rgb(var(--border))]`}>
          {!isCollapsed && (
            <h2 className="text-lg font-bold text-[rgb(var(--text))]">Admin Panel</h2>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-[rgba(var(--brand-rgb),0.08)] transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item, idx) => (
            <div key={idx}>{renderMenuItem(item)}</div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;

