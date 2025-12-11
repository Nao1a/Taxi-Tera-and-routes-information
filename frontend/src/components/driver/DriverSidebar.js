import React from 'react';
import { useDriverSidebar } from '../../contexts/DriverSidebarContext';
import { 
  FiShield, 
  FiMap, 
  FiNavigation,
  FiMenu,
  FiX
} from 'react-icons/fi';

const DriverSidebar = ({ activeTab, setActiveTab }) => {
  const { isCollapsed, toggleSidebar } = useDriverSidebar();

  const menuItems = [
    {
      id: 'verification',
      label: 'Verification',
      icon: FiShield
    },
    {
      id: 'routes',
      label: 'Route Applications',
      icon: FiMap
    },
    {
      id: 'assigned',
      label: 'My Assigned Route',
      icon: FiNavigation
    }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-40 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-gray-200 dark:border-gray-800`}>
          {!isCollapsed && (
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Driver Dashboard</h2>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                {Icon && <Icon className="flex-shrink-0" size={20} />}
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default DriverSidebar;

