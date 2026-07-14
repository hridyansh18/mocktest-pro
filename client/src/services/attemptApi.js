import axios from 'axios';
import api from './api';

const attemptApi = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000/api',
});

attemptApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(
    'mtp_attempt_token'
  );

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const publicTest = {
  access: (code, body) =>
    api.post(`/public/tests/${code}/access`, body),

  instructions: (code) =>
    api.get(`/public/tests/${code}/instructions`),
};

export const attempts = {
  start: (body) =>
    api.post('/attempts/start', body),

  questions: (id) =>
    attemptApi.get(`/attempts/${id}/questions`),

  save: (id, body) =>
    attemptApi.post(
      `/attempts/${id}/answers`,
      body
    ),

  violation: (id, body) =>
    attemptApi.post(
      `/attempts/${id}/violations`,
      body
    ),

  submit: (id) =>
    attemptApi.post(`/attempts/${id}/submit`),

  result: (id) =>
    attemptApi.get(`/attempts/${id}/result`),

  leaderboard: (id) =>
    attemptApi.get(
      `/attempts/${id}/leaderboard`
    ),
};

export default attemptApi;