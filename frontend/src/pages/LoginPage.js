import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const EyeIcon = ({ open }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {open ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    )}
  </svg>
);

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    authService.login(username, password)
      .then((data) => {
        const role = data?.role || authService.getCurrentUser()?.role;
        if (role === 'admin' || role === 'moderator') {
          navigate('/admin');
        } else if (role === 'taxiDriver') {
          navigate('/driver/dashboard');
        } else if (role === 'owner') {
          navigate('/owner/dashboard');
        } else {
          navigate('/');
        }
      })
      .catch((error) => {
        const status = error?.status;
        const data = error?.data;
        if (status === 403 && data?.needsVerification) {
          const qp = new URLSearchParams();
          if (data.verifyToken) qp.set('token', data.verifyToken);
          if (data.email) qp.set('email', data.email);
          qp.set('username', username);
          navigate(`/verify-email?${qp.toString()}`);
        } else if (typeof data?.message === 'string') {
          setErrorMsg(data.message);
        } else {
          setErrorMsg('Login failed');
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: 'rgb(var(--bg))' }}>
      <div className="w-full max-w-md p-8 space-y-8 rounded-2xl shadow-lg" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text))' }}>Welcome back</h1>
          <p style={{ color: 'rgb(var(--muted))' }}>Log in to TERAS</p>
        </div>
        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label htmlFor="login-username" className="sr-only">Username</label>
            <input
              id="login-username"
              type="text"
              placeholder="Username"
              className="input-base"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="relative">
            <label htmlFor="login-password" className="sr-only">Password</label>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="input-base pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center transition-colors"
              style={{ color: 'rgb(var(--muted))' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          <button
            disabled={loading}
            className="w-full p-4 rounded-xl font-bold text-lg shadow-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: 'rgb(var(--brand))' }}
          >
            {loading ? (
              <>
                <svg className="animate-spinner w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                Logging in...
              </>
            ) : 'Log in'}
          </button>
          {errorMsg && <p className="text-sm text-center font-medium" style={{ color: 'rgb(var(--error))' }}>{errorMsg}</p>}
        </form>
        <div className="text-center" style={{ color: 'rgb(var(--muted))' }}>
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold hover:underline" style={{ color: 'rgb(var(--brand))' }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
