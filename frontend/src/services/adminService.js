import api from './apiClient';

const API_URL = '/api/admin/manage';

export const getPendingKYCUsers = async () => {
    const response = await api.get(`${API_URL}/kyc-pending`);
    return response.data;
};

export const approveKYC = async (userId) => {
    const response = await api.post(`${API_URL}/kyc/${userId}/approve`);
    return response.data;
};

export const rejectKYC = async (userId, reason) => {
    const response = await api.post(`${API_URL}/kyc/${userId}/reject`, { reason });
    return response.data;
};

// Car Approvals
export const getPendingCars = async () => {
    const response = await api.get(`${API_URL}/cars-pending`);
    return response.data;
};

export const approveCar = async (carId) => {
    const response = await api.post(`${API_URL}/cars/${carId}/approve`);
    return response.data;
};

export const rejectCar = async (carId, reason) => {
    const response = await api.post(`${API_URL}/cars/${carId}/reject`, { reason });
    return response.data;
};

const adminService = {
    getPendingKYCUsers,
    approveKYC,
    rejectKYC,
    getPendingCars,
    approveCar,
    rejectCar
};

export default adminService;
