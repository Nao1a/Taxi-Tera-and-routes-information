import React from 'react';
import { Navigate } from 'react-router-dom';
import { DriverSidebarProvider } from '../../contexts/DriverSidebarContext';
import DriverSidebar from './DriverSidebar';
import { useDriverSidebar } from '../../contexts/DriverSidebarContext';
import authService from '../../services/authService';

const DriverLayoutContent = ({ children, activeTab, setActiveTab }) => {
  const { isCollapsed } = useDriverSidebar();
  const user = authService.getCurrentUser();

  if (!user || user.role !== 'taxiDriver') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <DriverSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <main className="flex-1 overflow-y-auto p-6 pt-16">
          {children}
        </main>
      </div>
    </div>
  );
};

const DriverLayout = ({ children, activeTab, setActiveTab }) => {
  return (
    <DriverSidebarProvider>
      <DriverLayoutContent activeTab={activeTab} setActiveTab={setActiveTab}>
        {children}
      </DriverLayoutContent>
    </DriverSidebarProvider>
  );
};

export default DriverLayout;

