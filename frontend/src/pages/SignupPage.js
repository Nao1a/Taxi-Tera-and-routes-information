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
    <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: 'rgb(var(--bg))' }}>
      <div className="w-full max-w-md p-8 space-y-8 rounded-2xl shadow-lg" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
        </div>
        <form className="space-y-6" onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Username"
            className="w-full p-4 rounded-2xl focus:outline-none focus:ring-2 bg-white dark:bg-white/10 text-black dark:text-white"
            style={{ border: '1px solid rgb(var(--border))' }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            placeholder="Your email address"
            className="w-full p-4 rounded-2xl focus:outline-none focus:ring-2 bg-white dark:bg-white/10 text-black dark:text-white"
            style={{ border: '1px solid rgb(var(--border))' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-4 rounded-2xl focus:outline-none focus:ring-2 bg-white dark:bg-white/10 text-black dark:text-white"
            style={{ border: '1px solid rgb(var(--border))' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button disabled={loading} className="w-full p-4 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: 'rgb(var(--brand))', color: '#fff' }}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
          {errorMsg && <p className="text-sm text-center" style={{ color: '#dc2626' }}>{errorMsg}</p>}
        </form>
        <div className="text-center" style={{ color: 'rgb(var(--muted))' }}>
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
