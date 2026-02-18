import api from './apiClient';

const API_URL = '/api/owner/';

const registerCar = (formData) => {
  return api.post(API_URL + 'cars', formData);
};

const getMyCars = () => {
  return api.get(API_URL + 'cars');
};

const getOwnerApplications = () => {
  return api.get(API_URL + 'applications');
};

const updateApplicationStatus = (id, status) => {
  return api.put(API_URL + `applications/${id}/status`, { status });
};

const getAllRoutes = () => {
  return api.get('/api/search/routes');
};

const toggleCarStatus = (id) => {
  return api.put(API_URL + `cars/${id}/status`);
};

const updateCar = (id, formData) => {
  return api.put(API_URL + `cars/${id}`, formData);
};

const ownerService = {
  registerCar,
  getMyCars,
  getOwnerApplications,
  updateApplicationStatus,
  getAllRoutes,
  toggleCarStatus,
  updateCar
};

export default ownerService;
