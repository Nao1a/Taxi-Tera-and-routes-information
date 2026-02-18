import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import DriverSidebar from './DriverSidebar';
import { DriverSidebarProvider, useDriverSidebar } from '../../contexts/DriverSidebarContext';

const DriverLayoutContent = ({ children }) => {
  const { isCollapsed } = useDriverSidebar();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--bg))' }}>
      <DriverSidebar />

      <main
        className={`transition-all duration-300 pt-16 min-h-screen ${isMobile ? 'pl-0' : isCollapsed ? 'pl-16' : 'pl-64'
          }`}
      >
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          {children ? children : <Outlet />}
        </div>
      </main>
    </div>
  );
};

const DriverLayout = ({ children }) => {
  return (
    <DriverSidebarProvider>
      <DriverLayoutContent children={children} />
    </DriverSidebarProvider>
  );
};

export default DriverLayout;

