import { http } from './httpClient';

export const authApi = {
  signup: (data) => http.post('/auth/signup', data),
  login: (data) => http.post('/auth/login', data),
  refresh: () => http.post('/auth/refresh'),
  logout: () => http.post('/auth/logout'),
  me: () => http.get('/auth/me'),
  updateSettings: (data) => http.put('/auth/settings', data),
};
