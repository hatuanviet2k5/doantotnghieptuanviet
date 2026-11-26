import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const reqUrl = error.config?.url || '';
    const isAuthEndpoint = reqUrl.includes('/auth/login') || reqUrl.includes('/auth/register');
    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('readerCard');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Chỉ fallback sang mock khi backend thực sự không phản hồi (mất kết nối / proxy 502-504).
 * Các lỗi nghiệp vụ (400, 401, 403, 404, 429) phải throw thông báo thật từ server.
 */
export function handleApiErrorOrFallback(err: any): void {
  if (err?.response && err.response.status < 502) {
    const msg = err.response.data?.message || err.message || 'Yêu cầu thất bại';
    throw new Error(msg);
  }
}

export default api;
