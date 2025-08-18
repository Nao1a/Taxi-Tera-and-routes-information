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
      .then(() => navigate('/'))
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
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-900 rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Welcome!</h1>
          <p className="text-gray-400">Log in to Redat</p>
        </div>
  <form className="space-y-6" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-4 text-gray-400"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-blue-500 hover:underline">
              Forgot password?
            </Link>
          </div>
          <button className="w-full p-4 rounded-2xl bg-white text-black font-bold text-lg shadow-lg">
            Log in
          </button>
          {errorMsg && <p className="text-sm text-red-400 text-center">{errorMsg}</p>}
        </form>
        <div className="text-center text-gray-400">
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
