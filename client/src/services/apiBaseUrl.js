const LOCAL_API_URL = 'http://localhost:5000/api';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? LOCAL_API_URL : '')
).replace(/\/$/, '');

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL is required for production builds');
}
