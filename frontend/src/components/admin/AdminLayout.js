import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AdminSidebarProvider } from '../../contexts/AdminSidebarContext';
import AdminSidebar from './AdminSidebar';
import { useAdminSidebar } from '../../contexts/AdminSidebarContext';
import authService from '../../services/authService';

const AdminLayoutContent = () => {
  const { isCollapsed } = useAdminSidebar();
  const user = authService.getCurrentUser();

  if (!user || !['admin', 'moderator'].includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg))' }}>
      <AdminSidebar />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'
          }`}
      >
        <main className="flex-1 overflow-y-auto p-6 pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  return (
    <AdminSidebarProvider>
      <AdminLayoutContent />
    </AdminSidebarProvider>
  );
};

export default AdminLayout;

