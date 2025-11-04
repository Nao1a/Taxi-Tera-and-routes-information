import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
    };
    window.addEventListener('auth-changed', handler);
    handler(); // initial load
    return () => window.removeEventListener('auth-changed', handler);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(undefined);
    setDropdownOpen(false);
    navigate('/');
  };

  const handleDeleteAccount = () => {
    setDropdownOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="p-4 flex justify-between items-center" style={{ backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--text))', borderBottom: '1px solid rgb(var(--border))' }}>
      <div className="text-3xl font-bold">
        <Link to="/">TERAS</Link>
      </div>
      <div className="flex items-center">
        <button
          onClick={toggleTheme}
          className="mr-4 p-2 rounded-full focus:outline-none focus:ring-2"
          style={{
            backgroundColor: 'transparent',
            border: '1px solid rgb(var(--border))'
          }}
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <div className="relative" ref={dropdownRef}>
          {currentUser ? (
            <div>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="focus:outline-none">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: 'rgb(var(--bg))', color: 'rgb(var(--text))', border: '1px solid rgb(var(--border))' }}>
                  {(currentUser?.username?.[0] || currentUser?.email?.[0] || '?').toUpperCase()}
                </div>
              </button>
              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn" 
                  style={{ 
                    backgroundColor: 'rgb(var(--surface))', 
                    color: 'rgb(var(--text))', 
                    border: '1px solid rgb(var(--border))',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                  }}
                >
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg" 
                        style={{ 
                          backgroundColor: 'rgb(var(--brand))', 
                          color: '#fff' 
                        }}
                      >
                        {(currentUser?.username?.[0] || currentUser?.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {currentUser?.username || 'User'}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'rgb(var(--muted))' }}>
                          {currentUser?.email || ''}
                        </p>
                        {currentUser?.role && (
                          <span 
                            className="inline-block px-2 py-0.5 text-xs rounded-full mt-1 font-medium"
                            style={{ 
                              backgroundColor: currentUser.role === 'admin' || currentUser.role === 'moderator' 
                                ? 'rgba(59, 130, 246, 0.2)' 
                                : 'rgba(107, 114, 128, 0.2)',
                              color: currentUser.role === 'admin' || currentUser.role === 'moderator'
                                ? '#3b82f6'
                                : 'rgb(var(--muted))'
                            }}
                          >
                            {currentUser.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {/* Submit Data Link */}
                    <Link 
                      to="/submit" 
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm transition-colors"
                      style={{ 
                        '--hover-bg': 'rgba(var(--brand-rgb), 0.1)' 
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(var(--brand-rgb), 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Submit Route Data
                    </Link>

                    {/* Admin Panel - Only show for admin/moderator */}
                    {(currentUser?.role === 'admin' || currentUser?.role === 'moderator') && (
                      <Link 
                        to="/admin/submissions" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm transition-colors"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(var(--brand-rgb), 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Admin Panel
                      </Link>
                    )}
                  </div>

                  {/* Separator */}
                  <div className="border-t" style={{ borderColor: 'rgb(var(--border))' }}></div>

                  {/* Account Actions */}
                  <div className="py-2">
                    <Link 
                      to="/delete-account" 
                      onClick={handleDeleteAccount}
                      className="flex items-center px-4 py-2.5 text-sm transition-colors"
                      style={{ color: '#ef4444' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Account
                    </Link>

                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2.5 text-sm transition-colors"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(var(--brand-rgb), 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login">
              <div className="w-10 h-10 rounded-full" style={{ border: '2px solid rgb(var(--border))' }}></div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
