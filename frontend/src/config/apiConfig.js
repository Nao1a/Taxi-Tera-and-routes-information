// API Configuration - centralized base URL
const getBaseURL = () => {
  // Check for environment variable first (for production builds)
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  // Default to localhost for development
  return 'http://localhost:5000';
};

export const API_BASE_URL = getBaseURL();

