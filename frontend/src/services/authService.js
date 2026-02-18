import api from './apiClient';

const API_URL = '/api/users/';

const signup = (username, email, password, role = 'user', licenseText = '', carPlate = '', carType = '') => {
  return api.post(API_URL + 'signup', {
    username,
    email,
    password,
    role,
    licenseText,
    carPlate,
    carType,
  }).catch((err) => {
    throw err;
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
          _id: response.data._id,
          username: response.data.username,
          email: response.data.email,
          role: response.data.role,
          kycStatus: response.data.kycStatus,
          kycRejectionReason: response.data.kycRejectionReason
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

const submitDriverVerification = (file) => {
  const formData = new FormData();
  formData.append('licenseFile', file);
  return api.post(API_URL + 'verify-driver', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(response => {
    // Update local user state
    const currentUser = getCurrentUser();
    if (currentUser && response.data.kycStatus) {
      currentUser.kycStatus = response.data.kycStatus;
      localStorage.setItem('user', JSON.stringify(currentUser));
      window.dispatchEvent(new Event('auth-changed'));
    }
    return response;
  });
};

const submitOwnerVerification = (file) => {
  const formData = new FormData();
  formData.append('idFile', file);
  return api.post(API_URL + 'verify-owner', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(response => {
    // Update local user state
    const currentUser = getCurrentUser();
    if (currentUser && response.data.kycStatus) {
      currentUser.kycStatus = response.data.kycStatus;
      localStorage.setItem('user', JSON.stringify(currentUser));
      window.dispatchEvent(new Event('auth-changed'));
    }
    return response;
  });
};

const refreshUser = () => {
    return api.get(API_URL + 'current').then((response) => {
      // response.data.user contains the full user object from backend
      const dbUser = response.data.user;
      const localUser = getCurrentUser();
      
      if (localUser && dbUser) {
          // Merge updates
          const updatedUser = {
              ...localUser,
              kycStatus: dbUser.kycStatus,
              kycRejectionReason: dbUser.kycRejectionReason,
              isAccountBanned: dbUser.isAccountBanned,
              isSubmissionBanned: dbUser.isSubmissionBanned
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          window.dispatchEvent(new Event('auth-changed'));
          return updatedUser;
      }
      return localUser;
    }).catch(err => {
        // If 401/403, might need to logout? For now just ignore
        console.error("Failed to refresh user", err);
    });
  }

const authService = {
  signup,
  login,
  logout,
  getCurrentUser,
  refreshUser,
  submitDriverVerification,
  submitOwnerVerification,
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
