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

const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('user');
  const [licenseText, setLicenseText] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [carType, setCarType] = useState('');
  const navigate = useNavigate();

  const passwordStrength = password.length === 0 ? 0 : password.length < 4 ? 1 : password.length < 8 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][passwordStrength];
  const strengthColor = ['', 'rgb(var(--error))', 'rgb(var(--warning))', 'rgb(var(--success))'][passwordStrength];

  const handleSignup = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const u = username.trim();
    const em = email.trim();
    const pw = password;
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
    authService.signup(u, em, pw, role, licenseText.trim(), carPlate.trim(), carType.trim())
      .then((res) => {
        const token = res.data?.verifyToken;
        const qp = new URLSearchParams();
        if (token) qp.set('token', token);
        qp.set('email', em);
        qp.set('username', u);
        navigate(`/verify-email?${qp.toString()}`);
      })
      .catch((error) => {
        const serverMsg = error?.response?.data?.message || error?.data?.message || error?.message;
        setErrorMsg(serverMsg || 'Signup failed. Please check your connection and try again.');
      })
      .finally(() => setLoading(false));
  };

  const roleOptions = [
    { value: 'user', label: 'Passenger', desc: 'Search routes & fares' },
    { value: 'taxiDriver', label: 'Driver', desc: 'Drive on routes' },
    { value: 'owner', label: 'Owner', desc: 'Manage cars & hire' },
  ];

  return (
    <div className="flex justify-center items-center min-h-screen py-8" style={{ backgroundColor: 'rgb(var(--bg))' }}>
      <div className="w-full max-w-md p-8 space-y-6 rounded-2xl shadow-lg" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text))' }}>Create an account</h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--muted))' }}>Join TERAS today</p>
        </div>
        <form className="space-y-5" onSubmit={handleSignup}>
          <div>
            <label htmlFor="signup-username" className="sr-only">Username</label>
            <input
              id="signup-username"
              type="text"
              placeholder="Username"
              className="input-base"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="signup-email" className="sr-only">Email</label>
            <input
              id="signup-email"
              type="email"
              placeholder="Email address"
              className="input-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <div className="relative">
              <label htmlFor="signup-password" className="sr-only">Password</label>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password (8+ characters)"
                className="input-base pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{ backgroundColor: i <= passwordStrength ? strengthColor : 'rgb(var(--border))' }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium" style={{ color: strengthColor }}>{strengthLabel}</p>
              </div>
            )}
          </div>

          {/* Role selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--text))' }}>Register as</label>
            <div className="grid grid-cols-3 gap-2">
              {roleOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className="p-3 rounded-xl text-center transition-all text-sm"
                  style={role === opt.value
                    ? { backgroundColor: 'rgba(var(--brand-rgb), 0.1)', border: '2px solid rgb(var(--brand))', color: 'rgb(var(--brand))' }
                    : { backgroundColor: 'rgb(var(--bg))', border: '2px solid rgb(var(--border))', color: 'rgb(var(--text))' }
                  }
                >
                  <div className="font-semibold">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Driver-specific fields */}
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: role === 'taxiDriver' ? '300px' : '0', opacity: role === 'taxiDriver' ? 1 : 0 }}
          >
            <div className="space-y-3 p-4 rounded-xl" style={{ backgroundColor: 'rgb(var(--bg))', border: '1px solid rgb(var(--border))' }}>
              <input
                type="text"
                placeholder="License Number"
                className="input-base"
                value={licenseText}
                onChange={(e) => setLicenseText(e.target.value)}
              />
              <input
                type="text"
                placeholder="Car Plate Number"
                className="input-base"
                value={carPlate}
                onChange={(e) => setCarPlate(e.target.value)}
              />
              <input
                type="text"
                placeholder="Car Type (e.g., Sedan, SUV)"
                className="input-base"
                value={carType}
                onChange={(e) => setCarType(e.target.value)}
              />
            </div>
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
                Creating account...
              </>
            ) : 'Sign up'}
          </button>
          {errorMsg && <p className="text-sm text-center font-medium" style={{ color: 'rgb(var(--error))' }}>{errorMsg}</p>}
        </form>
        <div className="text-center" style={{ color: 'rgb(var(--muted))' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: 'rgb(var(--brand))' }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
