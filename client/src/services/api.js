import axios from "axios";

const api = axios.create({
  baseURL: "https://mocktest-pro-na4k.onrender.com/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("mtp_access");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle Token Refresh
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("mtp_refresh")
    ) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          "https://mocktest-pro-na4k.onrender.com/api/auth/refresh",
          {
            refreshToken: localStorage.getItem("mtp_refresh"),
          },
          {
            withCredentials: true,
          }
        );

        localStorage.setItem(
          "mtp_access",
          data.data.accessToken
        );

        if (data.data.refreshToken) {
          localStorage.setItem(
            "mtp_refresh",
            data.data.refreshToken
          );
        }

        originalRequest.headers.Authorization =
          `Bearer ${data.data.accessToken}`;

        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem("mtp_access");
        localStorage.removeItem("mtp_refresh");
        localStorage.removeItem("mtp_admin");

        window.location.href = "/login";

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;