import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const EmailVerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialToken = params.get('token') || '';
  const email = params.get('email') || '';
  const [token, setToken] = useState(initialToken);
  const [code, setCode] = useState(params.get('code') || '');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [resentInfo, setResentInfo] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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
        setMessage('Email verified! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Verification failed');
      });
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    if (!email) {
      setMessage('Email unknown. Please sign up again.');
      return;
    }
    setStatus('resending');
    authService.resendVerification(email)
      .then(res => {
        const newToken = res.data?.verifyToken;
        if (newToken) setToken(newToken);
        setResentInfo({ at: Date.now() });
        setStatus('idle');
        setMessage('Verification email sent. Check your inbox.');
        setResendCooldown(60);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Resend failed');
      });
  };

  return (
    <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: 'rgb(var(--bg))' }}>
      <div className="w-full max-w-md p-8 space-y-6 rounded-2xl shadow-lg text-center" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
        <div>
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(var(--brand-rgb), 0.1)' }}>
            <svg className="w-8 h-8" style={{ color: 'rgb(var(--brand))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text))' }}>Verify your email</h1>
          <p className="text-sm mt-2" style={{ color: 'rgb(var(--muted))' }}>
            {email ? `We sent a code to ${email}` : 'Check your inbox for a verification code.'}
          </p>
        </div>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            placeholder="6-digit code"
            className="input-base tracking-widest text-center text-lg font-semibold"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s+/g, ''))}
            maxLength={6}
            required
            autoComplete="one-time-code"
          />
          <button
            disabled={status === 'verifying'}
            className="w-full p-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white transition-opacity"
            style={{ backgroundColor: 'rgb(var(--brand))' }}
          >
            {status === 'verifying' ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        <button
          onClick={handleResend}
          disabled={status === 'resending' || resendCooldown > 0}
          className="w-full p-4 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--text))' }}
        >
          {status === 'resending'
            ? 'Resending...'
            : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend verification email'}
        </button>
        {message && (
          <p className="text-sm font-medium" style={{ color: status === 'error' ? 'rgb(var(--error))' : 'rgb(var(--success))' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
