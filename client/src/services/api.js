import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mtp_access');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (err) => {
    const original = err.config;

    if (
      err.response?.status === 401 &&
      !original?._retry &&
      localStorage.getItem('mtp_refresh')
    ) {
      original._retry = true;

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {
            refreshToken: localStorage.getItem('mtp_refresh')
          }
        );

        localStorage.setItem(
          'mtp_access',
          data.data.accessToken
        );

        if (data.data.refreshToken) {
          localStorage.setItem(
            'mtp_refresh',
            data.data.refreshToken
          );
        }

        original.headers.Authorization =
          `Bearer ${data.data.accessToken}`;

        return api(original);

      } catch {
        localStorage.removeItem('mtp_access');
        localStorage.removeItem('mtp_refresh');
        localStorage.removeItem('mtp_admin');

        window.location.href = '/login';
      }
    }

    return Promise.reject(err);
  }
);

export default api;