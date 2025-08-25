import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const u = username.trim();
    const em = email.trim();
    const pw = password;
    // Basic client-side checks mirroring backend
    if (!u || !em || !pw) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (u.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }
    if (pw.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    authService.signup(u, em, pw)
      .then((res) => {
        const token = res.data?.verifyToken;
        const qp = new URLSearchParams();
        if (token) qp.set('token', token);
        qp.set('email', em);
        qp.set('username', u);
        navigate(`/verify-email?${qp.toString()}`);
      })
      .catch((error) => {
        // Axios error shape
        const serverMsg = error?.response?.data?.message;
        setErrorMsg(serverMsg || 'Signup failed');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black dark:text-white">Create an account</h1>
        </div>
        <form className="space-y-6" onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Username"
            className="w-full p-4 rounded-2xl bg-white border border-gray-300 text-black dark:bg-gray-800 dark:border-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            placeholder="Your email address"
            className="w-full p-4 rounded-2xl bg-white border border-gray-300 text-black dark:bg-gray-800 dark:border-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-4 rounded-2xl bg-white border border-gray-300 text-black dark:bg-gray-800 dark:border-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button disabled={loading} className="w-full p-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
          {errorMsg && <p className="text-sm text-red-500 dark:text-red-400 text-center">{errorMsg}</p>}
        </form>
        <div className="text-center text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
