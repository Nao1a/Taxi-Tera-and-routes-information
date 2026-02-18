import api from './apiClient';

const API_URL = '/api/hire/';

const getAvailableJobs = () => {
  return api.get(API_URL + 'jobs');
};

const applyForJob = (carId, proposedGebi, experienceYears, notes) => {
  return api.post(API_URL + 'apply', { carId, proposedGebi, experienceYears, notes });
};

const makeOffer = (requestId, amount) => {
  return api.post(API_URL + `requests/${requestId}/offer`, { amount });
};

const getMyApplications = () => {
  return api.get(API_URL + 'my-applications');
};

const getChatMessages = (requestId) => {
  return api.get(API_URL + `requests/${requestId}/messages`);
};

const sendMessage = (requestId, content) => {
  return api.post(API_URL + `requests/${requestId}/messages`, { content });
};

const getUnreadCount = () => {
    return api.get(API_URL + 'unread-count');
}

const hireService = {
  getAvailableJobs,
  applyForJob,
  makeOffer,
  getMyApplications,
  getChatMessages,
  sendMessage,
  getUnreadCount
};

export default hireService;
