import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import OwnerSidebar from './OwnerSidebar';

const OwnerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden md:ml-64 pt-16">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center p-4 bg-[rgb(var(--surface))] border-b border-[rgb(var(--border))]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 mr-2 rounded hover:bg-[rgb(var(--bg))]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <h1 className="text-xl font-bold">Taxi Owner Portal</h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;
