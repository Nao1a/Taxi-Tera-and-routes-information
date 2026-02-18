// API Configuration - centralized base URL
const getBaseURL = () => {
    if (process.env.NODE_ENV === 'production') {
        return 'https://teras-7d3o.onrender.com';
    }
    return 'http://localhost:5000';
};

export const API_BASE_URL = getBaseURL();

