import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
    };
    window.addEventListener('auth-changed', handler);
    handler(); // initial load
    return () => window.removeEventListener('auth-changed', handler);
  }, []);

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
    navigate('/');
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
  <div className="relative">
          {currentUser ? (
            <div>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="focus:outline-none">
    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: 'rgb(var(--bg))', color: 'rgb(var(--text))', border: '1px solid rgb(var(--border))' }}>
                  {(currentUser?.username?.[0] || currentUser?.email?.[0] || '?').toUpperCase()}
                </div>
              </button>
              {dropdownOpen && (
    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1" style={{ backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--text))', border: '1px solid rgb(var(--border))' }}>
      <Link to="/delete-account" className="block px-4 py-2 text-sm hover:opacity-80">Delete Account</Link>
      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm hover:opacity-80">Logout</button>
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
