import axios from "axios";
import { API_BASE_URL } from "./apiBaseUrl";

const api = axios.create({
  baseURL: API_BASE_URL,
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
  (error) => {
    return Promise.reject(error);
  }
);

// Handle Token Refresh
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      localStorage.getItem("mtp_refresh")
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("mtp_refresh");

        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {
            refreshToken,
          },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const accessToken = data?.data?.accessToken;
        const newRefreshToken = data?.data?.refreshToken;

        if (!accessToken) {
          throw new Error("Access token not received");
        }

        localStorage.setItem("mtp_access", accessToken);

        if (newRefreshToken) {
          localStorage.setItem(
            "mtp_refresh",
            newRefreshToken
          );
        }

        originalRequest.headers =
          originalRequest.headers || {};

        originalRequest.headers.Authorization =
          `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("mtp_access");
        localStorage.removeItem("mtp_refresh");
        localStorage.removeItem("mtp_admin");

        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;