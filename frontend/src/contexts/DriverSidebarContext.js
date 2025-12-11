import React, { createContext, useContext, useState, useEffect } from 'react';

const DriverSidebarContext = createContext();

export const useDriverSidebar = () => {
  const context = useContext(DriverSidebarContext);
  if (!context) {
    throw new Error('useDriverSidebar must be used within DriverSidebarProvider');
  }
  return context;
};

export const DriverSidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('driverSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('driverSidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <DriverSidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </DriverSidebarContext.Provider>
  );
};

