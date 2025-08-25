import axios from 'axios';
import authService from './authService';

function authHeaders() {
  const user = authService.getCurrentUser();
  return user?.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {};
}

export async function createSubmission(type, payload) {
  // Allow names for teras; pass through as-is, backend will resolve when approving
  const { data } = await axios.post('/api/submissions', { type, payload }, { headers: authHeaders() });
  return data;
}

export async function getMySubmissions() {
  const { data } = await axios.get('/api/submissions/my', { headers: authHeaders() });
  return data;
}

export async function adminListSubmissions(status) {
  const { data } = await axios.get('/api/admin/submissions', { headers: authHeaders(), params: { status } });
  return data;
}

export async function approveSubmission(id, adminNotes) {
  const { data } = await axios.patch(`/api/admin/submissions/${id}/approve`, { adminNotes }, { headers: authHeaders() });
  return data;
}

export async function rejectSubmission(id, adminNotes) {
  const { data } = await axios.patch(`/api/admin/submissions/${id}/reject`, { adminNotes }, { headers: authHeaders() });
  return data;
}

// Admin manage services
export const adminManage = {
  // Teras
  listTeras: async () => (await axios.get('/api/admin/manage/teras', { headers: authHeaders() })).data,
  createTera: async (tera) => (await axios.post('/api/admin/manage/teras', tera, { headers: authHeaders() })).data,
  updateTera: async (id, tera) => (await axios.patch(`/api/admin/manage/teras/${id}`, tera, { headers: authHeaders() })).data,
  deleteTera: async (id) => (await axios.delete(`/api/admin/manage/teras/${id}`, { headers: authHeaders() })).data,
  // Routes
  listRoutes: async () => (await axios.get('/api/admin/manage/routes', { headers: authHeaders() })).data,
  createRoute: async (route) => (await axios.post('/api/admin/manage/routes', route, { headers: authHeaders() })).data,
  updateRoute: async (id, route) => (await axios.patch(`/api/admin/manage/routes/${id}`, route, { headers: authHeaders() })).data,
  deleteRoute: async (id) => (await axios.delete(`/api/admin/manage/routes/${id}`, { headers: authHeaders() })).data,
  // Users
  listUsers: async () => (await axios.get('/api/admin/manage/users', { headers: authHeaders() })).data,
  banUser: async (id, reason) => (await axios.post(`/api/admin/manage/users/${id}/ban`, { reason }, { headers: authHeaders() })).data,
  unbanUser: async (id) => (await axios.post(`/api/admin/manage/users/${id}/unban`, {}, { headers: authHeaders() })).data,
};
