import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    authService.login(username, password)
      .then((data) => {
        const role = data?.role || authService.getCurrentUser()?.role;
        if (role === 'admin' || role === 'moderator') {
          navigate('/admin/submissions');
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
      });
  };

  return (
    <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: 'rgb(var(--bg))' }}>
      <div className="w-full max-w-md p-8 space-y-8 rounded-2xl shadow-lg" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome!</h1>
          <p style={{ color: 'rgb(var(--muted))' }}>Log in to TERAS</p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            className="w-full p-4 rounded-2xl focus:outline-none focus:ring-2 bg-white dark:bg-white/10 text-black dark:text-white"
            style={{ border: '1px solid rgb(var(--border))' }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="w-full p-4 rounded-2xl focus:outline-none focus:ring-2 bg-white dark:bg-white/10 text-black dark:text-white"
              style={{ border: '1px solid rgb(var(--border))' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-4"
              style={{ color: 'rgb(var(--muted))' }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-blue-500 hover:underline">
              Forgot password?
            </Link>
          </div>
          <button className="w-full p-4 rounded-2xl font-bold text-lg shadow-lg" style={{ backgroundColor: 'rgb(var(--brand))', color: '#fff' }}>
            Log in
          </button>
          {errorMsg && <p className="text-sm text-center" style={{ color: '#dc2626' }}>{errorMsg}</p>}
        </form>
        <div className="text-center" style={{ color: 'rgb(var(--muted))' }}>
          Don’t have an account?{' '}
          <Link to="/signup" className="text-blue-500 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
