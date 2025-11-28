import api from './apiClient';

const API_URL = '/api/driver/';

function authHeaders() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return { Authorization: `Bearer ${user.accessToken}` };
}

export async function verifyDriver(formData) {
  return api.post(API_URL + 'verify', formData, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function applyForRoute(targetRouteId, reason = '') {
  return api.post(
    API_URL + 'apply-route',
    { targetRouteId, reason },
    { headers: authHeaders() }
  );
}

export async function getAvailableRoutes() {
  return api.get(API_URL + 'routes', {
    headers: authHeaders(),
  });
}

export async function getDriverStatus() {
  return api.get(API_URL + 'status', {
    headers: authHeaders(),
  });
}

