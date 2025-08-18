import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const EmailVerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialToken = params.get('token') || '';
  const email = params.get('email') || '';
  const username = params.get('username') || '';
  const [token, setToken] = useState(initialToken);
  const [code, setCode] = useState(params.get('code') || '');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [resentInfo, setResentInfo] = useState(null);

  const handleVerify = (e) => {
    e.preventDefault();
    if (!token) {
      setMessage('Missing verification token. Resend email.');
      return;
    }
    setStatus('verifying');
    authService.verifyEmail(token, code)
      .then(() => {
        setStatus('success');
        setMessage('Email verified. Redirecting...');
        setTimeout(() => navigate('/login'), 1500);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Verification failed');
      });
  };

  const handleResend = () => {
    if (!email) {
      setMessage('Email unknown. Re-signup or provide email.');
      return;
    }
    setStatus('resending');
    authService.resendVerification(email)
      .then(res => {
        const newToken = res.data?.verifyToken;
        if (newToken) setToken(newToken);
        setResentInfo({ at: Date.now() });
        setStatus('idle');
        setMessage('Verification email sent. Check inbox.');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Resend failed');
      });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-900 rounded-2xl shadow-lg text-center">
        <h1 className="text-2xl font-bold text-white">Verify your email</h1>
        <p className="text-gray-400 text-sm">{email ? `Email: ${email}` : 'Check your inbox for a code.'}</p>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            placeholder="6-digit code"
            className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s+/g,''))}
            maxLength={6}
            required
          />
          <button disabled={status==='verifying'} className="w-full p-4 rounded-2xl bg-white text-black font-bold text-lg shadow-lg disabled:opacity-50">
            {status==='verifying' ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        <button onClick={handleResend} disabled={status==='resending'} className="mt-2 w-full p-4 rounded-2xl border border-gray-500 text-white font-semibold text-lg hover:bg-gray-800 disabled:opacity-50">
          {status==='resending' ? 'Resending...' : 'Resend verification email'}
        </button>
        {message && <p className={`text-sm ${status==='error' ? 'text-red-400':'text-green-400'}`}>{message}</p>}
        {token && <p className="text-[10px] break-all text-gray-500">Token cached client-side.</p>}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
