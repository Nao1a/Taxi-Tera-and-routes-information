import api from './apiClient';
import authService from './authService';

function authHeaders() {
  const user = authService.getCurrentUser();
  return user?.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {};
}

export async function createSubmission(type, payload) {
  // Allow names for teras; pass through as-is, backend will resolve when approving
  const { data } = await api.post('/api/submissions', { type, payload }, { headers: authHeaders() });
  return data;
}

export async function getMySubmissions() {
  const { data } = await api.get('/api/submissions/my', { headers: authHeaders() });
  return data;
}

export async function adminListSubmissions(status, type = null) {
  const params = { status };
  // Always include type if provided (even if empty string, to ensure filtering works)
  if (type !== null && type !== undefined) {
    params.type = String(type).trim();
  }
  const { data } = await api.get('/api/admin/submissions', { headers: authHeaders(), params });
  return data;
}

export async function approveSubmission(id, adminNotes) {
  const { data } = await api.patch(`/api/admin/submissions/${id}/approve`, { adminNotes }, { headers: authHeaders() });
  return data;
}

export async function rejectSubmission(id, adminNotes) {
  const { data } = await api.patch(`/api/admin/submissions/${id}/reject`, { adminNotes }, { headers: authHeaders() });
  return data;
}

// Admin manage services
export const adminManage = {
  // Teras
  listTeras: async () => (await api.get('/api/admin/manage/teras', { headers: authHeaders() })).data,
  createTera: async (tera) => (await api.post('/api/admin/manage/teras', tera, { headers: authHeaders() })).data,
  updateTera: async (id, tera) => (await api.patch(`/api/admin/manage/teras/${id}`, tera, { headers: authHeaders() })).data,
  deleteTera: async (id) => (await api.delete(`/api/admin/manage/teras/${id}`, { headers: authHeaders() })).data,
  // Routes
  listRoutes: async () => (await api.get('/api/admin/manage/routes', { headers: authHeaders() })).data,
  createRoute: async (route) => (await api.post('/api/admin/manage/routes', route, { headers: authHeaders() })).data,
  updateRoute: async (id, route) => (await api.patch(`/api/admin/manage/routes/${id}`, route, { headers: authHeaders() })).data,
  deleteRoute: async (id) => (await api.delete(`/api/admin/manage/routes/${id}`, { headers: authHeaders() })).data,
  // Users
  listUsers: async () => (await api.get('/api/admin/manage/users', { headers: authHeaders() })).data,
  banUser: async (id, reason) => (await api.post(`/api/admin/manage/users/${id}/ban`, { reason }, { headers: authHeaders() })).data,
  unbanUser: async (id) => (await api.post(`/api/admin/manage/users/${id}/unban`, {}, { headers: authHeaders() })).data,
  // Analytics
  getAnalytics: async () => (await api.get('/api/admin/analytics', { headers: authHeaders() })).data,
  // User management
  banAccount: async (id, reason) => (await api.post(`/api/admin/manage/users/${id}/ban-account`, { reason }, { headers: authHeaders() })).data,
  unbanAccount: async (id) => (await api.post(`/api/admin/manage/users/${id}/unban-account`, {}, { headers: authHeaders() })).data,
  changeUserRole: async (id, role) => (await api.patch(`/api/admin/manage/users/${id}/role`, { role }, { headers: authHeaders() })).data,
  // Driver management
  listDrivers: async () => (await api.get('/api/admin/drivers', { headers: authHeaders() })).data,
  verifyDriver: async (id) => (await api.post(`/api/admin/drivers/${id}/verify`, {}, { headers: authHeaders() })).data,
  rejectDriverVerification: async (id) => (await api.post(`/api/admin/drivers/${id}/reject-verification`, {}, { headers: authHeaders() })).data,
  banDriverFromRoute: async (id, reason, removeFromRoute) => (await api.post(`/api/admin/drivers/${id}/ban-from-route`, { reason, removeFromRoute }, { headers: authHeaders() })).data,
  unbanDriverFromRoute: async (id) => (await api.post(`/api/admin/drivers/${id}/unban-from-route`, {}, { headers: authHeaders() })).data,
  forceRemoveDriverFromRoute: async (id) => (await api.post(`/api/admin/drivers/${id}/force-remove-route`, {}, { headers: authHeaders() })).data,
  assignDriverToRoute: async (id, routeId) => (await api.post(`/api/admin/drivers/${id}/assign-route`, { routeId }, { headers: authHeaders() })).data,
};
