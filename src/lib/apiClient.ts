import axios, { AxiosInstance } from 'axios';
import { APIError } from '@/types/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

console.log('apiClient', process.env.NEXT_PUBLIC_API_URL);

apiClient.interceptors.request.use(
  async (config) => {
    try {
      console.log('baseURL', config?.baseURL);

      const response = await axios.get('/api/token');
      if (response?.data?.accessToken) {
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        config.headers.Kid = '';
      }
    } catch (err) {
      console.error('Error fetching token:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: APIError) => {
    if (error.status === 401) {
      if (typeof window !== 'undefined' && 
          !window.location.pathname.includes('/api/auth')) {
        window.location.href = '/api/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient; 