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
    <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: 'rgb(var(--bg))' }}>
      <div className="w-full max-w-md p-8 space-y-6 rounded-2xl shadow-lg" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
        <h1 className="text-2xl font-bold text-center">Delete Account</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Enter your password to permanently delete your account. This action cannot be undone.</p>
        <form onSubmit={handleDelete} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            className="w-full p-4 rounded-2xl focus:outline-none focus:ring-2 bg-white dark:bg-white/10 text-black dark:text-white"
            style={{ border: '1px solid rgb(var(--border))' }}
            value={password}
            onChange={(e)=> setPassword(e.target.value)}
            required
          />
          <button disabled={status==='working'} className="w-full p-4 rounded-2xl text-white font-bold text-lg shadow-lg disabled:opacity-50" style={{ backgroundColor: '#dc2626' }}>{status==='working' ? 'Deleting...' : 'Delete Account'}</button>
        </form>
        {message && <p className="text-sm text-center" style={{ color: status==='error' ? '#dc2626' : '#16a34a' }}>{message}</p>}
      </div>
    </div>
  );
};

export default DeleteAccountPage;
