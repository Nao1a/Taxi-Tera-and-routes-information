// Centralized Axios instance pointing to the deployed backend on Render
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://teras-7d3o.onrender.com',
});

export default api;
