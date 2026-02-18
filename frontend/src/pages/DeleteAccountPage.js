import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

const DeleteAccountPage = () => {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | confirming | working | done | error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleFirstClick = (e) => {
    e.preventDefault();
    if (!password) {
      setMessage('Please enter your password.');
      setStatus('error');
      return;
    }
    setStatus('confirming');
    setMessage('');
  };

  const handleConfirmDelete = () => {
    setStatus('working');
    setMessage('');
    authService.deleteAccount(password)
      .then(() => {
        setMessage('Account deleted. Redirecting...');
        setStatus('done');
        setTimeout(() => navigate('/'), 1500);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Delete failed');
      });
  };

  const handleCancel = () => {
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: 'rgb(var(--bg))' }}>
      <div className="w-full max-w-md p-8 space-y-6 rounded-2xl shadow-lg" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(var(--error), 0.1)' }}>
            <svg className="w-8 h-8" style={{ color: 'rgb(var(--error))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text))' }}>Delete Account</h1>
          <p className="text-sm mt-2" style={{ color: 'rgb(var(--muted))' }}>
            This action is permanent and cannot be undone. All your data will be erased.
          </p>
        </div>

        {status !== 'confirming' ? (
          <form onSubmit={handleFirstClick} className="space-y-4">
            <div>
              <label htmlFor="delete-password" className="sr-only">Password</label>
              <input
                id="delete-password"
                type="password"
                placeholder="Enter your password"
                className="input-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button
              disabled={status === 'working' || status === 'done'}
              className="w-full p-4 rounded-xl text-white font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'rgb(var(--error))' }}
            >
              {status === 'working' ? 'Deleting...' : 'Delete My Account'}
            </button>
          </form>
        ) : (
          <div className="space-y-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(var(--error), 0.05)', border: '1px solid rgba(var(--error), 0.2)' }}>
            <p className="text-sm font-semibold text-center" style={{ color: 'rgb(var(--error))' }}>
              Are you absolutely sure? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 p-3 rounded-xl font-semibold transition-colors"
                style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--text))' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 p-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'rgb(var(--error))' }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        )}

        {message && (
          <p className="text-sm text-center font-medium" style={{ color: status === 'error' ? 'rgb(var(--error))' : 'rgb(var(--success))' }}>
            {message}
          </p>
        )}

        <div className="text-center">
          <Link to="/" className="text-sm font-medium hover:underline" style={{ color: 'rgb(var(--muted))' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountPage;
