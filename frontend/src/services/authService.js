import api from './apiClient';

const API_URL = '/api/users/';

const signup = (username, email, password) => {
  return api.post(API_URL + 'signup', {
    username,
    email,
    password,
  });
};

// Login now uses username instead of email
const login = (username, password) => {
  return api
    .post(API_URL + 'login', { username, password })
    .then((response) => {
      if (response.data.accessToken) {
        localStorage.setItem('user', JSON.stringify({
          accessToken: response.data.accessToken,
          username: response.data.username,
          email: response.data.email,
          role: response.data.role
        }));
        window.dispatchEvent(new Event('auth-changed'));
      }
      return response.data;
    })
    .catch((err) => {
      // Bubble error for unverified user so caller can redirect
      throw err.response ? err.response : err;
    });
};

const verifyEmail = (token, code) => {
  return api.get(`${API_URL}verify-email`, {
    headers: { verifytoken: `Bearer ${token}` },
    params: { code }
  });
};

const resendVerification = (email) => {
  return api.post(`${API_URL}request-verification-email`, { email });
};

const logout = () => {
  const user = getCurrentUser();
  localStorage.removeItem('user');
  // Optionally inform backend (token blacklist not implemented but endpoint exists)
  if (user?.accessToken) {
  api.post(API_URL + 'logout', {}, { headers: { Authorization: `Bearer ${user.accessToken}` } }).catch(()=>{});
  }
  window.dispatchEvent(new Event('auth-changed'));
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

const authService = {
  signup,
  login,
  logout,
  getCurrentUser,
  verifyEmail,
  resendVerification,
  deleteAccount: (password) => {
    const user = getCurrentUser();
  return api.delete(API_URL + 'delete', {
      headers: { Authorization: `Bearer ${user?.accessToken}` },
      data: { password }
    }).then(res => {
      localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth-changed'));
      return res.data;
    });
  }
};

export default authService;
