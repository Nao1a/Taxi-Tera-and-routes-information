import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(undefined);
    navigate('/');
  };

  return (
  <nav className="bg-black text-white p-4 flex justify-between items-center border-b border-gray-800">
      <div className="text-3xl font-bold">
  <Link to="/">TERAS</Link>
      </div>
      <div className="relative">
        {currentUser ? (
          <div>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="focus:outline-none">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black font-bold">
                {(currentUser?.username?.[0] || currentUser?.email?.[0] || '?').toUpperCase()}
              </div>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 text-black">
                <Link to="/delete-account" className="block px-4 py-2 text-sm hover:bg-gray-100">Delete Account</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Logout</button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login">
            <div className="w-10 h-10 rounded-full border-2 border-gray-500"></div>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
