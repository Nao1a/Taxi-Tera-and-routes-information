import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
    };
    window.addEventListener('auth-changed', handler);
    handler();
    return () => window.removeEventListener('auth-changed', handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  // Dropdown menu item component with CSS hover
  const MenuItem = ({ to, onClick, icon, label, danger }) => {
    const baseClass = `flex items-center w-full text-left px-4 py-2.5 text-sm transition-colors rounded-lg mx-1`;
    const style = {
      color: danger ? 'rgb(var(--error))' : 'rgb(var(--text))',
    };
    const hoverClass = danger ? 'hover:bg-red-50 dark:hover:bg-red-950/20' : 'hover:bg-[rgba(var(--brand-rgb),0.08)]';

    if (to) {
      return (
        <Link to={to} onClick={() => { setDropdownOpen(false); onClick?.(); }} className={`${baseClass} ${hoverClass}`} style={style}>
          {icon}
          {label}
        </Link>
      );
    }
    return (
      <button onClick={() => { onClick?.(); }} className={`${baseClass} ${hoverClass}`} style={style}>
        {icon}
        {label}
      </button>
    );
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 h-16 px-4 flex justify-between items-center z-[1001]"
      style={{ backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--text))', borderBottom: '1px solid rgb(var(--border))' }}
      role="navigation"
      aria-label="Main navigation"
    >
      <Link to="/" className="text-xl font-bold tracking-tight" style={{ color: 'rgb(var(--text))' }}>
        <span style={{ color: 'rgb(var(--brand))' }}>TERAS</span>
      </Link>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full transition-colors hover:bg-[rgba(var(--brand-rgb),0.08)]"
          style={{ border: '1px solid rgb(var(--border))' }}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* User section */}
        <div className="relative" ref={dropdownRef}>
          {currentUser ? (
            <>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
                style={{ backgroundColor: 'rgb(var(--brand))', color: '#fff' }}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                {(currentUser?.username?.[0] || '?').toUpperCase()}
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-xl shadow-2xl py-1 z-50 animate-fadeIn"
                  role="menu"
                  style={{
                    backgroundColor: 'rgb(var(--surface))',
                    border: '1px solid rgb(var(--border))',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                  }}
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: 'rgb(var(--brand))', color: '#fff' }}>
                        {(currentUser?.username?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-sm">{currentUser?.username || 'User'}</p>
                        <p className="text-xs truncate" style={{ color: 'rgb(var(--muted))' }}>{currentUser?.email || ''}</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation links */}
                  <div className="py-1">
                    <MenuItem
                      to="/submit"
                      icon={<svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                      label="Submit Route Data"
                    />
                    {currentUser?.role === 'taxiDriver' && (
                      <MenuItem
                        to="/driver/dashboard"
                        icon={<svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>}
                        label="Driver Dashboard"
                      />
                    )}
                    {currentUser?.role === 'owner' && (
                      <MenuItem
                        to="/owner/dashboard"
                        icon={<svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                        label="Owner Dashboard"
                      />
                    )}
                    {(currentUser?.role === 'admin' || currentUser?.role === 'moderator') && (
                      <MenuItem
                        to="/admin"
                        icon={<svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                        label="Admin Panel"
                      />
                    )}
                  </div>

                  <div className="border-t" style={{ borderColor: 'rgb(var(--border))' }} />

                  {/* Account actions */}
                  <div className="py-1">
                    <MenuItem
                      onClick={handleLogout}
                      icon={<svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>}
                      label="Log out"
                    />
                  </div>

                  <div className="border-t mt-2 pt-2" style={{ borderColor: 'rgb(var(--border))' }}>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center w-full text-left px-4 py-2.5 text-sm rounded-lg mx-1 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
                      style={{ color: 'rgb(var(--error))' }}
                    >
                      <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'rgb(var(--brand))' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Log in
            </Link>
          )}
        </div>
      </div>

      {/* Confirm before going to Delete Account — prevents accidental clicks */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[1002] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          onClick={() => { setShowDeleteConfirm(false); setDropdownOpen(false); }}
        >
          <div
            className="rounded-xl shadow-2xl max-w-sm w-full p-6"
            style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-confirm-title" className="font-bold text-lg mb-2" style={{ color: 'rgb(var(--text))' }}>Delete Account?</h3>
            <p className="text-sm mb-4" style={{ color: 'rgb(var(--muted))' }}>
              You will be taken to a page where you must confirm with your password. Continue?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDropdownOpen(false); }}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                style={{ borderColor: 'rgb(var(--border))', color: 'rgb(var(--text))' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDropdownOpen(false);
                  navigate('/delete-account');
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'rgb(var(--error))' }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
