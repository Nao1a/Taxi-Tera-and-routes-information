import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const DeleteAccountPage = () => {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleDelete = (e) => {
    e.preventDefault();
    setStatus('working');
    authService.deleteAccount(password)
      .then(() => {
        setMessage('Account deleted. Redirecting...');
        setStatus('done');
        setTimeout(()=> navigate('/'), 1500);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Delete failed');
      });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-black dark:text-white text-center">Delete Account</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Enter your password to permanently delete your account. This action cannot be undone.</p>
        <form onSubmit={handleDelete} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            className="w-full p-4 rounded-2xl bg-white border border-gray-300 text-black dark:bg-gray-800 dark:border-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={password}
            onChange={(e)=> setPassword(e.target.value)}
            required
          />
          <button disabled={status==='working'} className="w-full p-4 rounded-2xl bg-red-600 text-white font-bold text-lg shadow-lg disabled:opacity-50">{status==='working' ? 'Deleting...' : 'Delete Account'}</button>
        </form>
        {message && <p className={`text-sm text-center ${status==='error' ? 'text-red-500 dark:text-red-400':'text-green-500 dark:text-green-400'}`}>{message}</p>}
      </div>
    </div>
  );
};

export default DeleteAccountPage;
